/**
 * Custom Event Listener for Donation Events
 *
 * Replaces Ponder indexer with viem-based WebSocket event monitoring.
 * Listens for donation events on Base Sepolia and Mantle Sepolia.
 */

import { createPublicClient, fallback, webSocket, http, parseAbiItem, formatUnits, Log, defineChain } from "viem";
import { baseSepolia } from "viem/chains";
import { prisma } from "../lib/prisma";
import { initOverlayWebSocket, broadcastToStreamer, closeOverlayWebSocket } from "../lib/overlay-ws";

// Define Mantle Sepolia testnet (not exported by viem/chains)
export const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  nativeCurrency: { name: 'Mantle', symbol: 'BIT', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.mantle.xyz'],
      webSocket: ['wss://rpc.sepolia.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Mantle Sepolia Explorer', url: 'https://explorer.sepolia.mantle.xyz' },
  },
  testnet: true,
});

// Contract addresses
const BASE_CONTRACT_ADDRESS = "0x4AB4a2290cB651065D346299425b2D45eEf9D75D" as const;
const MANTLE_CONTRACT_ADDRESS = "0xDb26Ba8581979dc4E11218735F821Af5171fb737" as const;

// Event signatures
const DONATION_EVENT = parseAbiItem("event Donation(address indexed donor, address indexed streamer, address indexed tokenIn, uint256 amountIn, uint256 feeAmount, address tokenOut, uint256 amountOutToStreamer, uint256 timestamp)");
const DONATION_BRIDGED_EVENT = parseAbiItem("event DonationBridged(address indexed donor, address indexed streamer, uint32 indexed destinationChain, address tokenBridged, uint256 amount, bytes32 messageId)");
const BRIDGED_DONATION_RECEIVED_EVENT = parseAbiItem("event BridgedDonationReceived(uint32 indexed originChain, address indexed donor, address indexed streamer, address token, uint256 amount, bytes32 messageId)");

// RPC URLs
const BASE_RPC_URL = process.env.PONDER_RPC_URL_84532 || "https://base-sepolia.publicnode.com";
const MANTLE_RPC_URL = process.env.PONDER_RPC_URL_5003 || "https://rpc.sepolia.mantle.xyz";

// WebSocket URLs (convert HTTPS to WSS)
const BASE_WS_URL = BASE_RPC_URL.replace("https://", "wss://").replace("http://", "ws://");
const MANTLE_WS_URL = MANTLE_RPC_URL.replace("https://", "wss://").replace("http://", "ws://");

// Helper function to format token amount
function formatTokenAmount(amount: bigint, decimals: number): string {
  return formatUnits(amount, decimals);
}

/**
 * Handle Donation event
 */
async function handleDonationEvent(log: Log & { args: any }, chainId: number) {
  const { donor, streamer, tokenIn, amountIn, feeAmount, tokenOut, amountOutToStreamer, timestamp } = log.args;
  const { transactionHash, logIndex, blockNumber } = log;

  console.log(`📩 Donation event: chain=${chainId} tx=${transactionHash}`);

  try {
    // Find streamer
    const streamerRecord = await prisma.user.findFirst({
      where: { wallet: streamer!.toLowerCase() },
      include: { streamer: true },
    });

    if (!streamerRecord?.streamer) {
      console.warn(`⚠️ Streamer not found for wallet: ${streamer}`);
      return;
    }

    // Find tokens
    const [tokenInRecord, tokenOutRecord] = await Promise.all([
      prisma.token.findFirst({ where: { chainId, address: tokenIn!.toLowerCase() } }),
      prisma.token.findFirst({ where: { chainId, address: tokenOut!.toLowerCase() } }),
    ]);

    if (!tokenInRecord || !tokenOutRecord) {
      console.warn(`⚠️ Token not found: ${tokenIn} or ${tokenOut}`);
      return;
    }

    // Check if this might be a bridged donation (no fee = received from bridge)
    const isBridgedReceive = feeAmount === BigInt(0);

    // Upsert donation with idempotency key
    const donation = await prisma.donation.upsert({
      where: {
        txHash_logIndex: { txHash: transactionHash!, logIndex: Number(logIndex) },
      },
      create: {
        streamerId: streamerRecord.streamer.id,
        donorWallet: donor!.toLowerCase(),
        tokenInId: tokenInRecord.id,
        tokenOutId: tokenOutRecord.id,
        amountInRaw: formatTokenAmount(amountIn!, tokenInRecord.decimals),
        amountOutRaw: formatTokenAmount(amountOutToStreamer!, tokenOutRecord.decimals),
        feeRaw: formatTokenAmount(feeAmount!, tokenInRecord.decimals),
        txHash: transactionHash!,
        logIndex: Number(logIndex),
        blockNumber: Number(blockNumber),
        chainId,
        timestamp: new Date(Number(timestamp!) * 1000),
        status: "CONFIRMED",
        isBridged: isBridgedReceive,
      },
      update: {
        status: "CONFIRMED",
      },
    });

    // Create QueueOverlay entry for notification
    // The donation-queue-processor will handle broadcasting
    await prisma.queueOverlay.create({
      data: {
        streamerId: streamerRecord.streamer.id,
        tokenInId: tokenInRecord.id,
        amountInRaw: amountIn!.toString(),
        txHash: transactionHash!,
        timestamp: new Date(Number(timestamp!) * 1000),
        status: "PENDING",
      },
    });

    console.log(`✅ Donation indexed and queued for overlay: ${donation.id}`);
  } catch (error) {
    console.error(`❌ Error processing Donation event:`, error);
  }
}

/**
 * Handle DonationBridged event
 */
async function handleDonationBridgedEvent(log: Log & { args: any }, chainId: number) {
  const { donor, streamer, destinationChain, tokenBridged, amount, messageId } = log.args;
  const { transactionHash, logIndex, blockNumber } = log;

  console.log(`🌉 DonationBridged event: chain=${chainId} messageId=${messageId}`);

  try {
    // Find streamer
    const streamerRecord = await prisma.user.findFirst({
      where: { wallet: streamer!.toLowerCase() },
      include: { streamer: true },
    });

    if (!streamerRecord?.streamer) {
      console.warn(`⚠️ Streamer not found for wallet: ${streamer}`);
      return;
    }

    // Find token
    const tokenRecord = await prisma.token.findFirst({
      where: { chainId, address: tokenBridged!.toLowerCase() },
    });

    if (!tokenRecord) {
      console.warn(`⚠️ Token not found: ${tokenBridged}`);
      return;
    }

    // Create donation record for origin chain (bridged out)
    const donation = await prisma.donation.upsert({
      where: {
        txHash_logIndex: { txHash: transactionHash!, logIndex: Number(logIndex) },
      },
      create: {
        streamerId: streamerRecord.streamer.id,
        donorWallet: donor!.toLowerCase(),
        tokenInId: tokenRecord.id,
        tokenOutId: tokenRecord.id,
        amountInRaw: formatTokenAmount(amount!, tokenRecord.decimals),
        amountOutRaw: formatTokenAmount(amount!, tokenRecord.decimals),
        feeRaw: "0",
        txHash: transactionHash!,
        logIndex: Number(logIndex),
        blockNumber: Number(blockNumber),
        chainId,
        timestamp: new Date(),
        status: "PENDING",
        isBridged: true,
        bridgeMessageId: messageId!,
      },
      update: {
        bridgeMessageId: messageId,
        isBridged: true,
      },
    });

    console.log(`✅ DonationBridged indexed: ${donation.id} messageId=${messageId}`);
  } catch (error) {
    console.error(`❌ Error processing DonationBridged event:`, error);
  }
}

/**
 * Handle BridgedDonationReceived event
 */
async function handleBridgedDonationReceivedEvent(log: Log & { args: any }, chainId: number) {
  const { originChain, donor, streamer, token, amount, messageId } = log.args;
  const { transactionHash, logIndex, blockNumber } = log;

  console.log(`📥 BridgedDonationReceived: chain=${chainId} messageId=${messageId}`);

  try {
    // Find parent donation by messageId
    const parentDonation = await prisma.donation.findFirst({
      where: { bridgeMessageId: messageId! },
    });

    // Find streamer
    const streamerRecord = await prisma.user.findFirst({
      where: { wallet: streamer!.toLowerCase() },
      include: { streamer: true },
    });

    if (!streamerRecord?.streamer) {
      console.warn(`⚠️ Streamer not found for wallet: ${streamer}`);
      return;
    }

    // Find token on destination chain
    const tokenRecord = await prisma.token.findFirst({
      where: { chainId, address: token!.toLowerCase() },
    });

    if (!tokenRecord) {
      console.warn(`⚠️ Token not found: ${token}`);
      return;
    }

    // Create/update donation for destination chain
    const donation = await prisma.donation.upsert({
      where: {
        txHash_logIndex: { txHash: transactionHash!, logIndex: Number(logIndex) },
      },
      create: {
        streamerId: streamerRecord.streamer.id,
        donorWallet: donor!.toLowerCase(),
        tokenInId: tokenRecord.id,
        tokenOutId: tokenRecord.id,
        amountInRaw: formatTokenAmount(amount!, tokenRecord.decimals),
        amountOutRaw: formatTokenAmount(amount!, tokenRecord.decimals),
        feeRaw: "0",
        txHash: transactionHash!,
        logIndex: Number(logIndex),
        blockNumber: Number(blockNumber),
        chainId,
        timestamp: new Date(),
        status: "PENDING",
        isBridged: true,
        bridgeMessageId: messageId!,
        originChainId: Number(originChain),
        parentDonationId: parentDonation?.id,
      },
      update: {
        bridgeMessageId: messageId!,
        originChainId: Number(originChain),
        parentDonationId: parentDonation?.id,
      },
    });

    // Update parent donation status
    if (parentDonation) {
      await prisma.donation.update({
        where: { id: parentDonation.id },
        data: { status: "CONFIRMED" },
      });
    }

    console.log(`✅ BridgedDonationReceived indexed: ${donation.id}`);
  } catch (error) {
    console.error(`❌ Error processing BridgedDonationReceived event:`, error);
  }
}

/**
 * Setup event listeners for a specific chain
 */
async function setupChainListeners(chainId: number, contractAddress: `0x${string}`, rpcUrl: string, wsUrl: string) {
  console.log(`🔗 Setting up listeners for chain ${chainId}...`);

  const transport = fallback([
    webSocket(wsUrl),
    http(rpcUrl),
  ]);

  const client = createPublicClient({
    chain: chainId === 84532 ? baseSepolia : mantleSepolia,
    transport,
    pollingInterval: 1_000, // Fallback to polling every second if WebSocket fails
  });

  // Listen for Donation events
  const unwatchDonation = await client.watchContractEvent({
    address: contractAddress,
    abi: [DONATION_EVENT],
    onLogs: (logs) => {
      for (const log of logs) {
        handleDonationEvent(log, chainId);
      }
    },
  });

  // Listen for DonationBridged events
  const unwatchBridged = await client.watchContractEvent({
    address: contractAddress,
    abi: [DONATION_BRIDGED_EVENT],
    onLogs: (logs) => {
      for (const log of logs) {
        handleDonationBridgedEvent(log, chainId);
      }
    },
  });

  // Listen for BridgedDonationReceived events
  const unwatchReceived = await client.watchContractEvent({
    address: contractAddress,
    abi: [BRIDGED_DONATION_RECEIVED_EVENT],
    onLogs: (logs) => {
      for (const log of logs) {
        handleBridgedDonationReceivedEvent(log, chainId);
      }
    },
  });

  console.log(`✅ Listening for events on chain ${chainId} (${contractAddress})`);

  // Return cleanup function
  return () => {
    unwatchDonation();
    unwatchBridged();
    unwatchReceived();
    console.log(`🔕 Stopped listening for chain ${chainId}`);
  };
}

/**
 * Main function to start all event listeners
 */
async function main() {
  console.log("🚀 Starting Kubi Event Listener...");
  console.log("=====================================");

  // Initialize overlay broadcaster (Pusher)
  initOverlayWebSocket();
  console.log("[Overlay] Broadcaster initialized (Pusher)");

  // Setup cleanup handlers
  const cleanups: Array<() => void> = [];

  try {
    // Base Sepolia
    const baseCleanup = await setupChainListeners(
      84532,
      BASE_CONTRACT_ADDRESS,
      BASE_RPC_URL,
      BASE_WS_URL
    );
    cleanups.push(baseCleanup);

    // Mantle Sepolia
    const mantleCleanup = await setupChainListeners(
      5003,
      MANTLE_CONTRACT_ADDRESS,
      MANTLE_RPC_URL,
      MANTLE_WS_URL
    );
    cleanups.push(mantleCleanup);

    console.log("=====================================");
    console.log("✅ All event listeners started successfully");
    console.log("🎧 Listening for donation events...");
    console.log("Press Ctrl+C to stop");

  } catch (error) {
    console.error("❌ Error starting event listeners:", error);
    process.exit(1);
  }

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down gracefully...");
    cleanups.forEach(cleanup => cleanup());
    closeOverlayWebSocket();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Shutting down gracefully...");
    cleanups.forEach(cleanup => cleanup());
    closeOverlayWebSocket();
    process.exit(0);
  });

  // Keep process alive
  process.stdin.resume();
}

// Start the listener
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
