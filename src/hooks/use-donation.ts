"use client";

import { useCallback, useState } from "react";
import {
    useAccount,
    useBalance,
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt,
    usePublicClient,
    useWalletClient,
    useConfig
} from "wagmi";
import { getWalletClient, getPublicClient } from "wagmi/actions";
import { parseUnits, parseEther, formatUnits, formatEther, getAddress, erc20Abi, createPublicClient, http } from "viem";
import { baseSepolia, mantleSepoliaTestnet } from "viem/chains";
import { getDonationContractAddress } from "@/services/contracts/donation";

// Donation contract ABI (minimal)
const DONATION_ABI = [
    {
        name: "donate",
        type: "function",
        stateMutability: "payable",
        inputs: [
            { name: "addressSupporter", type: "address" },
            { name: "tokenIn", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "streamer", type: "address" },
            { name: "amountOutMin", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
        outputs: [],
    },
    { inputs: [], name: "NotInGlobalWhitelist", type: "error" },
    { inputs: [], name: "NotInStreamerWhitelist", type: "error" },
    { inputs: [], name: "PrimaryNotSet", type: "error" },
    { inputs: [], name: "ZeroAddress", type: "error" },
    { inputs: [], name: "ZeroAmount", type: "error" },
    { inputs: [], name: "InsufficientFee", type: "error" },
    { inputs: [], name: "InvalidToken", type: "error" },
] as const;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export type TokenInfo = {
    symbol: string;
    logoURI: string;
    address?: string;
    isNative?: boolean;
    decimals?: number;
    chainId?: number;
};

export type DonationParams = {
    streamerAddress: string;
    amount: string;
    token: TokenInfo;
    tokenOut?: string;
    name: string;
    message: string;
    streamerId: string;
    channel: string;
    avatarUrl?: string;
    mediaType?: "TEXT" | "AUDIO" | "VIDEO";
    mediaUrl?: string;
    mediaDuration?: number;
    chainId?: number;
};

export type UseDonationResult = {
    donate: (params: DonationParams) => Promise<{ success: boolean; txHash?: string; error?: string }>;
    isApproving: boolean;
    isDonating: boolean;
    isPending: boolean;
    txHash: string | null;
};

export function useDonation(): UseDonationResult {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const { writeContractAsync } = useWriteContract();
    const config = useConfig();

    const [isApproving, setIsApproving] = useState(false);
    const [isDonating, setIsDonating] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);

    const isPending = isApproving || isDonating;

    const donate = useCallback(async (params: DonationParams): Promise<{ success: boolean; txHash?: string; error?: string }> => {
        const { streamerAddress, amount, token, tokenOut, name, message, streamerId, channel, avatarUrl, mediaType, mediaUrl, mediaDuration, chainId } = params;

        if (!address) {
            return { success: false, error: "Wallet not connected" };
        }

        // Get wallet client with fallback
        let client = walletClient;
        if (!client) {
            try {
                client = await getWalletClient(config);
            } catch (e) {
                console.error("Failed to get wallet client:", e);
            }
        }

        if (!client) {
            return { success: false, error: "Wallet client not available. Please reconnect your wallet." };
        }

        if (!publicClient) {
            return { success: false, error: "Public client not available" };
        }

        try {
            // Determine the target chain
            const effectiveChainId = chainId || token.chainId || 84532;

            // Check if wallet is on the correct chain
            const currentChainId = await client.getChainId();
            if (currentChainId !== effectiveChainId) {
                console.log(`🔄 Switching chain from ${currentChainId} to ${effectiveChainId}...`);
                try {
                    // Import switchChain from wagmi/actions
                    const { switchChain } = await import("wagmi/actions");
                    await switchChain(config, { chainId: effectiveChainId });

                    // Wait a bit for the switch to complete and get new client
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    client = await getWalletClient(config);

                    if (!client) {
                        return { success: false, error: "Failed to get wallet client after chain switch" };
                    }
                    console.log(`✅ Chain switched to ${effectiveChainId}`);
                } catch (switchError: any) {
                    console.error("Chain switch error:", switchError);
                    return {
                        success: false,
                        error: `Please switch your wallet to ${effectiveChainId === 5003 ? 'Mantle Sepolia' : 'Base Sepolia'} network`
                    };
                }
            }

            // Parse amount
            let cleanAmount = amount.trim();
            if (cleanAmount.endsWith(".")) {
                cleanAmount = cleanAmount.slice(0, -1);
            }
            if (!cleanAmount || Number.isNaN(Number(cleanAmount))) {
                return { success: false, error: "Invalid amount" };
            }

            const donationContractAddress = getDonationContractAddress(effectiveChainId) as `0x${string}`;

            // Create a dedicated public client for this chain using reliable RPCs
            // This avoids issues where the wallet's default provider is lagging or on the wrong chain
            // and allows us to reliably wait for transaction receipts.
            const chainConfigs: Record<number, any> = {
                84532: baseSepolia,
                5003: mantleSepoliaTestnet,
            };

            const rpcUrl = CHAIN_RPCS[effectiveChainId];
            const chainPublicClient = createPublicClient({
                chain: chainConfigs[effectiveChainId],
                transport: http(rpcUrl)
            });

            if (!chainPublicClient) {
                return { success: false, error: "Failed to create public client for the target chain" };
            }

            let amountIn: bigint;
            let decimals = 18;

            // Get decimals and parse amount
            if (token.isNative) {
                amountIn = parseEther(cleanAmount);
            } else if (token.address) {
                const tokenAddress = token.address as `0x${string}`;

                // Read decimals
                const tokenDecimals = await chainPublicClient.readContract({
                    address: tokenAddress,
                    abi: erc20Abi,
                    functionName: "decimals",
                });
                decimals = tokenDecimals;
                amountIn = parseUnits(cleanAmount, decimals);

                // Check allowance
                const currentAllowance = await chainPublicClient.readContract({
                    address: tokenAddress,
                    abi: erc20Abi,
                    functionName: "allowance",
                    args: [address, donationContractAddress],
                });

                console.log("🔎 Current allowance:", currentAllowance.toString(), "Needed:", amountIn.toString());

                // Approve if needed - request only the exact amount (no unlimited allowance)
                if (currentAllowance < amountIn) {
                    console.log("📝 Approving token for donation contract (exact amount)...");
                    setIsApproving(true);

                    try {
                        const approveTxHash = await writeContractAsync({
                            address: tokenAddress,
                            abi: erc20Abi,
                            functionName: "approve",
                            args: [donationContractAddress, amountIn],
                        });

                        console.log("⏳ Waiting for approve tx:", approveTxHash);

                        // Wait for confirmation
                        await chainPublicClient.waitForTransactionReceipt({ hash: approveTxHash });
                        console.log("✅ Approve succeeded");

                        // Wait for allowance update with retry - give more time
                        let newAllowance = await chainPublicClient.readContract({
                            address: tokenAddress,
                            abi: erc20Abi,
                            functionName: "allowance",
                            args: [address, donationContractAddress],
                        });

                        let retries = 0;
                        while (newAllowance < amountIn && retries < 10) {
                            console.log(`⌛ Waiting for allowance update... (attempt ${retries + 1}/10)`);
                            await new Promise(r => setTimeout(r, 1500)); // Increased delay
                            newAllowance = await chainPublicClient.readContract({
                                address: tokenAddress,
                                abi: erc20Abi,
                                functionName: "allowance",
                                args: [address, donationContractAddress],
                            });
                            retries++;
                        }

                        // Final check before proceeding
                        if (newAllowance < amountIn) {
                            throw new Error(`Allowance update failed. Current: ${newAllowance.toString()}, Needed: ${amountIn.toString()}`);
                        }

                        console.log("✅ Allowance updated successfully:", newAllowance.toString());
                    } catch (approveErr: any) {
                        setIsApproving(false);
                        console.error("❌ Approve failed:", approveErr);
                        return { success: false, error: "Failed to approve token: " + (approveErr?.message || approveErr) };
                    }

                    setIsApproving(false);
                } else {
                    console.log("✅ Allowance sufficient, skipping approve");
                }
            } else {
                return { success: false, error: "Invalid token selection" };
            }

            // Donate
            setIsDonating(true);
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);
            const tokenInAddress = token.isNative
                ? ZERO_ADDRESS
                : (getAddress(token.address!) as `0x${string}`);

            console.log("⏳ Sending donation...", {
                donor: address,
                tokenIn: tokenInAddress,
                streamer: streamerAddress,
                amountIn: amountIn.toString(),
            });

            const donateTxHash = await writeContractAsync({
                address: donationContractAddress,
                abi: DONATION_ABI,
                functionName: "donate",
                args: [
                    address, // addressSupporter (donor)
                    tokenInAddress, // tokenIn
                    amountIn, // amount
                    getAddress(streamerAddress) as `0x${string}`, // streamer
                    BigInt(0), // amountOutMin
                    deadline, // deadline
                ],
                value: token.isNative ? amountIn : undefined,
            });

            console.log("🚀 Donate tx sent:", donateTxHash);
            setTxHash(donateTxHash);

            // Wait for confirmation
            await chainPublicClient.waitForTransactionReceipt({ hash: donateTxHash });
            console.log("🎉 Donation confirmed!");

            // Save donation to API
            try {
                await fetch(`/api/save-donation/${channel}`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        txHash: donateTxHash,
                        message,
                        name,
                        streamerId,
                        avatarUrl,
                        mediaType: mediaType || "TEXT",
                        mediaUrl,
                        mediaDuration,
                        chainId: effectiveChainId,
                    }),
                });
                console.log("✅ Donation data sent to API");
            } catch (apiErr) {
                console.error("❌ Failed to send donation data:", apiErr);
            }

            setIsDonating(false);
            return { success: true, txHash: donateTxHash };
        } catch (err: any) {
            setIsApproving(false);
            setIsDonating(false);
            console.error("Donation error:", err);
            return { success: false, error: err?.message || String(err) };
        }
    }, [address, publicClient, walletClient, writeContractAsync]);

    return {
        donate,
        isApproving,
        isDonating,
        isPending,
        txHash,
    };
}

// Chain RPC configurations for balance fetching
const CHAIN_RPCS: Record<number, string> = {
    84532: "https://sepolia.base.org",
    5003: "https://rpc.sepolia.mantle.xyz",
};

// Hook to get token balances - individual calls per token
export function useTokenBalances(tokens: TokenInfo[]) {
    const { address } = useAccount();
    const [balances, setBalances] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const fetchBalances = useCallback(async () => {
        console.log("🔍 fetchBalances called", { address, tokensCount: tokens.length });

        if (!address || tokens.length === 0) {
            console.log("⏭️ Skipping balance fetch - missing requirements");
            setBalances({});
            return;
        }

        console.log("🚀 Starting balance fetch for", tokens.length, "tokens");

        setIsLoading(true);
        const newBalances: { [key: string]: string } = {};

        try {
            // Import viem dynamically
            const { createPublicClient, http } = await import("viem");
            const { baseSepolia, mantleSepoliaTestnet } = await import("viem/chains");

            const chainConfigs: Record<number, any> = {
                84532: baseSepolia,
                5003: mantleSepoliaTestnet,
            };

            // Create clients for each chain
            const clients: Record<number, any> = {};
            for (const chainId of Object.keys(CHAIN_RPCS)) {
                const id = Number(chainId);
                clients[id] = createPublicClient({
                    chain: chainConfigs[id],
                    transport: http(CHAIN_RPCS[id]),
                });
            }

            // Fetch all tokens in parallel using Promise.all
            console.log(`✅ Tokens loaded: ${tokens.length}`);
            console.log(`🔄 Starting balance fetch for ${tokens.length} tokens`);

            await Promise.all(
                tokens.map(async (token) => {
                    const chainId = token.chainId || 84532;
                    const client = clients[chainId];

                    // Debug logs
                    console.log(`Checking token: ${token.symbol} on chain ${chainId}. isNative: ${token.isNative}, Address: ${token.address}`);

                    if (!client) {
                        console.warn(`⚠️ No client for chain ${chainId}`);
                        return;
                    }

                    try {
                        if (token.isNative) {
                            // Fetch native balance (ETH/MNT)
                            console.log(`🔄 Fetching ${token.symbol} balance on chain ${chainId}...`);
                            const balance = await client.getBalance({ address });
                            const formatted = formatEther(balance);
                            newBalances[`native-${chainId}`] = formatted;

                            // Also store under the address key if available, so SelectTokenModal can find it
                            if (token.address) {
                                newBalances[`${chainId}-${token.address.toLowerCase()}`] = formatted;
                            }

                            console.log(`✅ ${token.symbol} (chain ${chainId}) balance: ${formatted}`);
                        } else if (token.address) {
                            const tokenAddress = token.address.toLowerCase() as `0x${string}`;

                            console.log(`🔄 Fetching ${token.symbol} balance on chain ${chainId}...`);

                            // Get decimals
                            const decimals = await client.readContract({
                                address: tokenAddress,
                                abi: erc20Abi,
                                functionName: "decimals",
                            });

                            // Get balance
                            const balance = await client.readContract({
                                address: tokenAddress,
                                abi: erc20Abi,
                                functionName: "balanceOf",
                                args: [address],
                            });

                            // Use chainId-address as key to prevent overwrite between chains
                            newBalances[`${chainId}-${tokenAddress}`] = formatUnits(balance, decimals);
                            console.log(`✅ ${token.symbol} (chain ${chainId}) balance: ${formatUnits(balance, decimals)}`);
                        }
                    } catch (err: any) {
                        console.error(`❌ Error fetching balance for ${token.symbol}:`, err);
                        // store 0 on error to avoid indefinite loading
                        if (token.address) {
                            newBalances[`${chainId}-${token.address.toLowerCase()}`] = "0";
                        }
                    }
                })
            );

            console.log("🎉 Balance fetch complete:", Object.keys(newBalances).length, "balances");
            setBalances(newBalances);
        } catch (err) {
            console.error("❌ Failed to fetch balances:", err);
        } finally {
            setIsLoading(false);
        }
    }, [address, tokens]);

    return { balances, isLoading, fetchBalances };
}
