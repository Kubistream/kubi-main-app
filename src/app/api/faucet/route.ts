
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JsonRpcProvider, Wallet, Contract, parseUnits } from "ethers";
import ERC20_ABI from "@/abis/ERC20.json";

// Default amount to dispense: 100 tokens (adjusted by decimals)
const DEFAULT_AMOUNT = "100";

// Chain RPC configurations
const CHAIN_RPC: Record<number, string> = {
    5003: process.env.NEXT_PUBLIC_MANTLE_RPC_URL || "https://mantle-sepolia.drpc.org",
    84532: process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://base-sepolia.g.alchemy.com/v2/okjfsx8BQgIIx7k_zPuLKtTUAk9TaJqa",
};

// In-memory nonce tracking per chain to avoid "already known" errors
const nonceCache: Map<number, number> = new Map();
const nonceLock: Map<number, Promise<void>> = new Map();

async function withNonceLock<T>(chainId: number, fn: () => Promise<T>): Promise<T> {
    // Wait for any pending lock to release
    while (nonceLock.has(chainId)) {
        await nonceLock.get(chainId);
    }

    // Create a new lock
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
        releaseLock = resolve;
    });
    nonceLock.set(chainId, lockPromise);

    try {
        return await fn();
    } finally {
        nonceLock.delete(chainId);
        releaseLock!();
    }
}

async function sendTokenWithRetry(
    wallet: Wallet,
    tokenContract: Contract,
    walletAddress: string,
    amountToSend: bigint,
    chainId: number,
    maxRetries: number = 3
): Promise<{ hash: string }> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // Get the current nonce from the network
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
                errorMessage.includes("replacement transaction underpriced")
            ) {
                console.log(`[Faucet] Chain ${chainId}: Nonce conflict, incrementing and retrying...`);

                // Force refresh from network and increment
                const freshNonce = await wallet.getNonce("pending");
                nonceCache.set(chainId, freshNonce + 1);

                // Small delay before retry
                await new Promise(resolve => setTimeout(resolve, 500));
                continue;
            }

            // For other errors, throw immediately
            throw error;
        }
    }

    throw lastError;
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

        const tx = await withNonceLock(token.chainId, () =>
            sendTokenWithRetry(wallet, tokenContract, walletAddress, amountToSend, token.chainId)
        );

        return NextResponse.json({
            success: true,
            txHash: tx.hash,
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
