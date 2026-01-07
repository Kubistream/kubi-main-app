/**
 * Rebase Scheduler for Yield Tokens
 *
 * Automatically rebases yield tokens based on APR/APY configuration.
 * This is the TypeScript equivalent of the Go rebase-scheduler.
 *
 * Usage:
 *   tsx src/workers/rebase-scheduler.ts
 *
 * Required Environment Variables:
 *   RPC_URL -> Ethereum node RPC (HTTP/WS)
 *   PRIVATE_KEY -> hex private key of owner (0x...)
 *   CHAIN_ID -> chain id (e.g. 1, 137, 5003)
 *   CRON_EXPR -> cron expression (default "0 */30 * * * *" -> every 30 minutes)
 *
 * Optional:
 *   GAS_LIMIT -> gas limit for rebase tx (default 300000)
 *   GAS_PRICE_GWEI -> gas price in gwei (if not set, uses suggested)
 */

import { createPublicClient, createWalletClient, http, parseUnits, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { prisma } from "../lib/prisma";
import cron from "node-cron";

// ABI for TokenYield contract (minimal - only what we need)
const TOKEN_YIELD_ABI = [
  {
    constant: true,
    inputs: [],
    name: "scalingFactor",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ internalType: "uint256", name: "newScalingFactor", type: "uint256" }],
    name: "rebase",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

interface TokenConfig {
  mode: "apr" | "apy"; // APR or APY calculation mode
  percent: number; // e.g. 12.5 => 12.5%
  active: boolean;
  skipIfZero: boolean;
}

interface ProviderToken {
  providerId: string;
  name: string;
  address: string;
  config: TokenConfig;
}

// Constants
const DEFAULT_CALL_TIMEOUT = 30000; // 30 seconds
const DEFAULT_GAS_LIMIT = 300000n;
const DEFAULT_GAS_PRICE_GWEI = 5n;
const WEI_PER_GWEI = 1000000000n;
const REBASE_INTERVAL_MINUTES = 30;
const REBASES_PER_DAY = (24 * 60) / REBASE_INTERVAL_MINUTES;

// Custom error for skip
class ErrSkip extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErrSkip";
  }
}

/**
 * Convert APR to daily growth fraction
 * @param aprPercent APR in percent (12.5 => 12.5%)
 * @returns Daily growth fraction (e.g. 0.000327 -> 0.0327%)
 */
function aprToDaily(aprPercent: number): number {
  return (aprPercent / 100.0) / 365.0;
}

/**
 * Convert APY to daily growth fraction
 * @param apyPercent APY in percent (12.5 => 12.5% yearly with daily compound)
 * @returns Daily growth fraction
 */
function apyToDaily(apyPercent: number): number {
  const apy = apyPercent / 100.0;
  // daily factor = (1+apy)^(1/365)
  return Math.pow(1.0 + apy, 1.0 / 365.0) - 1.0;
}

/**
 * Compute new scaling factor: newFactor = floor(currentFactor * (1 + growth))
 * @param currentFactor Current scaling factor (uint256 scaled by 1e18)
 * @param growth Growth rate as fraction
 * @returns New scaling factor
 */
function computeNewScalingFactor(currentFactor: bigint, growth: number): bigint {
  if (growth <= 0) {
    return currentFactor;
  }

  const multiplier = 1.0 + growth;
  // Convert to decimal: currentFactor / 1e18 * multiplier
  const current = Number(currentFactor) / 1e18;
  const newValue = current * multiplier;
  return BigInt(Math.floor(newValue * 1e18));
}

/**
 * Compute growth per rebase interval from daily growth
 * @param dailyGrowth Daily growth fraction
 * @returns Growth per rebase
 */
function growthPerRebase(dailyGrowth: number): number {
  if (dailyGrowth === 0) {
    return 0;
  }
  const base = 1.0 + dailyGrowth;
  if (base <= 0) {
    return 0;
  }
  return Math.pow(base, 1.0 / REBASES_PER_DAY) - 1.0;
}

/**
 * Get daily growth for token config
 * @param cfg Token configuration
 * @returns Daily growth fraction
 */
function dailyGrowthForConfig(cfg: TokenConfig): number {
  switch (cfg.mode.toLowerCase()) {
    case "apr":
      return aprToDaily(cfg.percent);
    case "apy":
      return apyToDaily(cfg.percent);
    default:
      throw new Error(`Unknown mode: ${cfg.mode}`);
  }
}

/**
 * Load active yield provider tokens from database
 * @param chainId Chain ID to filter providers
 * @returns List of provider tokens with configuration
 */
async function loadActiveProviderTokens(chainId: number): Promise<ProviderToken[]> {
  const providers = await prisma.yieldProvider.findMany({
    where: {
      chainId,
      status: "ACTIVE",
    },
    include: {
      representativeToken: true,
    },
  });

  const result: ProviderToken[] = [];

  for (const provider of providers) {
    const address = provider.representativeToken.address;

    if (!address) {
      console.warn(`Skip yield provider ${provider.id}: empty representative token address`);
      continue;
    }

    if (!provider.apr) {
      console.warn(`Skip yield provider ${provider.id}: apr is NULL`);
      continue;
    }

    let percent = Number(provider.apr);
    let mode = "apr";
    let name = provider.representativeToken.symbol || provider.protocolName || provider.id;
    let active = true;
    let skipIfZero = false;

    // Parse extraData for custom config
    if (provider.extraData) {
      try {
        const extra = provider.extraData as any;
        if (extra.percent !== undefined) percent = extra.percent;
        if (extra.mode) mode = extra.mode;
        if (extra.name) name = extra.name;
        if (extra.active !== undefined) active = extra.active;
        if (extra.skipIfZero !== undefined) skipIfZero = extra.skipIfZero;
      } catch (e) {
        console.warn(`Yield provider ${provider.id} extraData parse error:`, e);
      }
    }

    if (percent <= 0) {
      console.warn(`Skip yield provider ${provider.id}: apr <= 0 (${percent})`);
      continue;
    }

    if (!active) {
      continue;
    }

    result.push({
      providerId: provider.id,
      name,
      address,
      config: {
        mode: mode as "apr" | "apy",
        percent,
        active: true,
        skipIfZero,
      },
    });
  }

  return result;
}

/**
 * Update APR updated timestamp in database
 * @param providerId Provider ID
 */
async function updateAPRUpdatedAt(providerId: string): Promise<void> {
  const now = new Date();
  await prisma.yieldProvider.update({
    where: { id: providerId },
    data: { aprUpdatedAt: now, updatedAt: now },
  });
}

/**
 * Run rebase for a single token
 * @param client Public client for blockchain interaction
 * @param walletClient Wallet client for transaction signing
 * @param chainId Chain ID
 * @param contractAddress Token contract address
 * @param config Token configuration
 */
async function runRebaseForToken(
  client: any,
  walletClient: any,
  chainId: number,
  contractAddress: Address,
  config: TokenConfig
): Promise<void> {
  if (config.percent <= 0) {
    throw new ErrSkip(`percent must be > 0 (got ${config.percent})`);
  }

  // Read current scaling factor
  const currentFactor = (await client.readContract({
    address: contractAddress,
    abi: TOKEN_YIELD_ABI,
    functionName: "scalingFactor",
  })) as bigint;

  // Calculate new scaling factor
  const dailyGrowth = dailyGrowthForConfig(config);
  const perRebaseGrowth = growthPerRebase(dailyGrowth);
  const newFactor = computeNewScalingFactor(currentFactor, perRebaseGrowth);

  // Sanity check: if newFactor <= currentFactor, skip
  if (newFactor <= currentFactor) {
    throw new ErrSkip(
      `computed newFactor <= currentFactor (current=${currentFactor} new=${newFactor} intervalGrowth=${perRebaseGrowth})`
    );
  }

  // Get gas price
  let gasPrice: bigint;
  const gasPriceGwei = process.env.GAS_PRICE_GWEI;
  if (gasPriceGwei) {
    gasPrice = parseUnits(gasPriceGwei, 9); // gwei to wei
  } else {
    gasPrice = (await client.getGasPrice()) || parseUnits("5", 9);
  }

  if (!gasPrice || gasPrice <= 0n) {
    gasPrice = DEFAULT_GAS_PRICE_GWEI * WEI_PER_GWEI;
  }

  // Get gas limit
  const gasLimitEnv = process.env.GAS_LIMIT;
  const gasLimit = gasLimitEnv ? BigInt(gasLimitEnv) : DEFAULT_GAS_LIMIT;

  // Build and send transaction
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: TOKEN_YIELD_ABI,
    functionName: "rebase",
    args: [newFactor],
    gasPrice,
    gasLimit,
  });

  console.log(
    `Rebase tx sent to ${contractAddress}: txHash=${hash} intervalGrowth=${perRebaseGrowth * 100}% dailyGrowth=${dailyGrowth * 100}% currentFactor=${currentFactor} newFactor=${newFactor}`
  );
}

/**
 * Main rebase job - runs on schedule
 */
async function runRebaseJob() {
  console.log(`== run rebase job: ${new Date().toISOString()} ==`);

  const chainId = parseInt(process.env.CHAIN_ID || "5003");
  const rpcUrl = process.env.RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl) {
    throw new Error("RPC_URL env missing");
  }
  if (!privateKey) {
    throw new Error("PRIVATE_KEY env missing");
  }

  // Create clients
  const publicClient = createPublicClient({
    transport: http(rpcUrl),
  });

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    transport: http(rpcUrl),
    chain: {
      id: chainId,
      name: "Custom Chain",
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } },
    },
  });

  console.log(`Using owner address: ${account.address}`);

  // Load active yield provider tokens
  const tokens = await loadActiveProviderTokens(chainId);

  if (tokens.length === 0) {
    console.log(`No active yield providers found for chainID=${chainId}`);
    return;
  }

  // Process each token sequentially to maintain nonce ordering
  for (const token of tokens) {
    if (!token.config.active) {
      continue;
    }

    const label = token.name;

    try {
      await runRebaseForToken(
        publicClient,
        walletClient,
        chainId,
        token.address as `0x${string}`,
        token.config
      );
      console.log(`[${label}] rebase tx submitted`);

      // Update APR updated timestamp if providerId exists
      if (token.providerId) {
        await updateAPRUpdatedAt(token.providerId);
      }
    } catch (error: any) {
      if (error instanceof ErrSkip) {
        console.log(`[${label}] rebase skipped: ${error.message}`);
      } else {
        console.error(`[${label}] rebase error:`, error);
      }
      // Continue to next token even if this one fails
    }
  }
}

/**
 * Main function to start the scheduler
 */
async function main() {
  console.log("🚀 Starting Kubi Rebase Scheduler...");
  console.log("=====================================");

  // Check required environment variables
  const rpcUrl = process.env.RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;
  const chainId = process.env.CHAIN_ID;

  if (!rpcUrl || !privateKey || !chainId) {
    console.warn("⚠️  Missing required environment variables for rebase scheduler:");
    console.warn("   - RPC_URL:", rpcUrl ? "✓" : "✗");
    console.warn("   - PRIVATE_KEY:", privateKey ? "✓" : "✗");
    console.warn("   - CHAIN_ID:", chainId ? "✓" : "✗");
    console.warn("⚠️  Scheduler will NOT run. Please set these environment variables to enable rebase scheduling.");
    console.warn("=====================================");
    console.log("ℹ️  Keep process alive (waiting for env changes)...");
    console.log("Press Ctrl+C to stop");

    // Keep process alive but don't run scheduler
    process.stdin.resume();

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n🛑 Shutting down gracefully...");
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log("\n🛑 Shutting down gracefully...");
      process.exit(0);
    });

    return;
  }

  // Get cron expression from env (default: every 30 minutes)
  const cronExpr = process.env.CRON_EXPR || "0 */30 * * * *";
  console.log(`Cron expression: ${cronExpr}`);

  // Run once on startup
  try {
    await runRebaseJob();
  } catch (error) {
    console.error("Error in initial rebase job:", error);
  }

  // Schedule recurring job
  const task = cron.schedule(cronExpr, async () => {
    try {
      await runRebaseJob();
    } catch (error) {
      console.error("Error in rebase job:", error);
    }
  });

  console.log("=====================================");
  console.log("✅ Rebase scheduler started");
  console.log("📅 Press Ctrl+C to stop");

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down gracefully...");
    task.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Shutting down gracefully...");
    task.stop();
    process.exit(0);
  });
}

// Start the scheduler
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
