
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JsonRpcProvider, Wallet, Contract, parseUnits } from "ethers";
import ERC20_ABI from "@/abis/ERC20.json";

// Default amount to dispense: 100 tokens (adjusted by decimals)
const DEFAULT_AMOUNT = "100";

// Chain RPC configurations
const CHAIN_RPC: Record<number, string> = {
    5003: process.env.NEXT_PUBLIC_MANTLE_RPC_URL || "https://rpc.sepolia.mantle.xyz",
    84532: process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://base-sepolia.g.alchemy.com/v2/okjfsx8BQgIIx7k_zPuLKtTUAk9TaJqa",
};

// Block explorer URLs
const CHAIN_EXPLORER: Record<number, string> = {
    5003: "https://explorer.sepolia.mantle.xyz/tx/",
    84532: "https://sepolia.basescan.org/tx/",
};

// Rate limiting: Track faucet requests per address
const faucetRequestLog = new Map<string, number[]>();
const FAUCET_COOLDOWN = 30000; // 30 seconds cooldown per address
const FAUCET_MAX_REQUESTS = 3; // Max 3 requests per cooldown period

// In-memory nonce tracking per chain to avoid "already known" errors
const nonceCache: Map<number, number> = new Map();
// Sequential queue per chain to ensure transactions are sent one at a time
const chainQueues: Map<number, Array<() => Promise<any>>> = new Map();
const processingQueues: Map<number, boolean> = new Map();

async function enqueueChainRequest<T>(chainId: number, fn: () => Promise<T>): Promise<T> {
    // Initialize queue if not exists
    if (!chainQueues.has(chainId)) {
        chainQueues.set(chainId, []);
    }

    // Create a promise that resolves when our turn comes
    return new Promise((resolve, reject) => {
        const queue = chainQueues.get(chainId)!;

        // Add our function to the queue
        queue.push(async () => {
            try {
                const result = await fn();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });

        // Process the queue if not already processing
        processQueue(chainId);
    });
}

async function processQueue(chainId: number) {
    // Skip if already processing
    if (processingQueues.get(chainId)) {
        return;
    }

    processingQueues.set(chainId, true);

    try {
        const queue = chainQueues.get(chainId);
        if (!queue || queue.length === 0) {
            return;
        }

        // Get the next request from the queue
        const nextRequest = queue.shift();
        if (nextRequest) {
            await nextRequest();
        }

        // Continue processing if there are more requests
        if (queue.length > 0) {
            // Small delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            await processQueue(chainId);
        }
    } finally {
        processingQueues.set(chainId, false);
    }
}

async function sendTokenWithRetry(
    wallet: Wallet,
    tokenContract: Contract,
    walletAddress: string,
    amountToSend: bigint,
    chainId: number,
    maxRetries: number = 5
): Promise<{ hash: string }> {
    // Enqueue this request to ensure sequential processing per chain
    return enqueueChainRequest(chainId, async () => {
        let lastError: any;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Always get fresh nonce from network
                const networkNonce = await wallet.getNonce("pending");

                // Use the higher of cached nonce or network nonce
                const cachedNonce = nonceCache.get(chainId) || 0;
                const nonce = Math.max(networkNonce, cachedNonce);

                console.log(`[Faucet] Chain ${chainId}: Attempt ${attempt + 1}, using nonce ${nonce}`);

                // Send with explicit nonce
                const tx = await tokenContract.transfer(walletAddress, amountToSend, {
                    nonce: nonce,
                });

                // Update cache for next transaction
                nonceCache.set(chainId, nonce + 1);

                return tx;
            } catch (error: any) {
                lastError = error;
                const errorMessage = error.message || JSON.stringify(error);

                // Check if it's an "already known" or nonce-related error
                if (
                    errorMessage.includes("already known") ||
                    errorMessage.includes("nonce too low") ||
                    errorMessage.includes("replacement transaction underpriced") ||
                    errorMessage.includes("nonce has already been used")
                ) {
                    console.log(`[Faucet] Chain ${chainId}: Nonce conflict, incrementing and retrying...`);

                    // Force refresh from network and increment
                    const freshNonce = await wallet.getNonce("pending");
                    nonceCache.set(chainId, freshNonce + 1);

                    // Longer delay before retry
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }

                // For other errors, throw immediately
                throw error;
            }
        }

        throw lastError;
    });
}

export async function POST(req: Request) {
    try {
        const { walletAddress, tokenId } = await req.json();

        if (!walletAddress || !tokenId) {
            return NextResponse.json(
                { error: "Missing walletAddress or tokenId" },
                { status: 400 }
            );
        }

        // Rate limiting: Check if user is requesting too frequently
        const now = Date.now();
        const userRequests = faucetRequestLog.get(walletAddress) || [];

        // Filter out old requests (outside cooldown window)
        const recentRequests = userRequests.filter(
            (timestamp) => now - timestamp < FAUCET_COOLDOWN
        );

        // Check if user exceeded rate limit
        if (recentRequests.length >= FAUCET_MAX_REQUESTS) {
            const oldestRequest = Math.min(...recentRequests);
            const cooldownRemaining = Math.ceil((FAUCET_COOLDOWN - (now - oldestRequest)) / 1000);
            return NextResponse.json(
                {
                    error: `Too many faucet requests. Please wait ${cooldownRemaining} seconds before trying again.`,
                    cooldownRemaining,
                },
                { status: 429 } // 429 Too Many Requests
            );
        }

        // Add this request to the log
        recentRequests.push(now);
        faucetRequestLog.set(walletAddress, recentRequests);

        // 1. Fetch token details from DB
        const token = await prisma.token.findUnique({
            where: { id: tokenId },
        });

        if (!token) {
            return NextResponse.json({ error: "Token not found" }, { status: 404 });
        }

        // 2. Setup Provider & Wallet
        const privateKey = process.env.FAUCET_PRIVATE_KEY;
        if (!privateKey) {
            return NextResponse.json(
                { error: "Faucet configuration missing (FAUCET_PRIVATE_KEY)" },
                { status: 500 }
            );
        }

        // Get RPC URL based on token's chainId
        const rpcUrl = CHAIN_RPC[token.chainId];
        if (!rpcUrl) {
            return NextResponse.json(
                { error: `Unsupported chain: ${token.chainId}` },
                { status: 400 }
            );
        }

        const provider = new JsonRpcProvider(rpcUrl);
        const wallet = new Wallet(privateKey, provider);

        // 3. Connect to Token Contract
        const tokenContract = new Contract(token.address, ERC20_ABI, wallet);

        // 4. Send Tokens with nonce management and retry
        const amountToSend = parseUnits(DEFAULT_AMOUNT, token.decimals);

        const tx = await sendTokenWithRetry(wallet, tokenContract, walletAddress, amountToSend, token.chainId);

        return NextResponse.json({
            success: true,
            txHash: tx.hash,
            explorerUrl: `${CHAIN_EXPLORER[token.chainId]}${tx.hash}`,
            amount: DEFAULT_AMOUNT,
            symbol: token.symbol,
            chainId: token.chainId,
        });
    } catch (error: any) {
        console.error("Faucet error:", error);

        // Provide user-friendly error messages
        const errorMessage = error.message || "Internal server error";
        let userMessage = errorMessage;

        if (errorMessage.includes("already known")) {
            userMessage = "Transaction already pending. Please wait a moment and try again.";
        } else if (errorMessage.includes("insufficient funds")) {
            userMessage = "Faucet wallet has insufficient balance. Please contact support.";
        } else if (errorMessage.includes("nonce")) {
            userMessage = "Transaction conflict. Please try again.";
        }

        return NextResponse.json(
            { error: userMessage },
            { status: 500 }
        );
    }
}
