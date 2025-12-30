"use client";

import { useCallback, useState } from "react";
import {
    useAccount,
    useBalance,
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt,
    usePublicClient,
    useWalletClient
} from "wagmi";
import { parseUnits, parseEther, formatUnits, formatEther, getAddress, erc20Abi } from "viem";
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
] as const;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export type TokenInfo = {
    symbol: string;
    logoURI: string;
    address?: string;
    isNative?: boolean;
    decimals?: number;
};

export type DonationParams = {
    streamerAddress: string;
    amount: string;
    token: TokenInfo;
    name: string;
    message: string;
    streamerId: string;
    channel: string;
    avatarUrl?: string;
    mediaType?: "TEXT" | "AUDIO" | "VIDEO";
    mediaUrl?: string;
    mediaDuration?: number;
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

    const [isApproving, setIsApproving] = useState(false);
    const [isDonating, setIsDonating] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);

    const isPending = isApproving || isDonating;

    const donate = useCallback(async (params: DonationParams): Promise<{ success: boolean; txHash?: string; error?: string }> => {
        const { streamerAddress, amount, token, name, message, streamerId, channel, avatarUrl, mediaType, mediaUrl, mediaDuration } = params;

        if (!address) {
            return { success: false, error: "Wallet not connected" };
        }

        if (!walletClient) {
            return { success: false, error: "Wallet client not available" };
        }

        if (!publicClient) {
            return { success: false, error: "Public client not available" };
        }

        try {
            // Parse amount
            let cleanAmount = amount.trim();
            if (cleanAmount.endsWith(".")) {
                cleanAmount = cleanAmount.slice(0, -1);
            }
            if (!cleanAmount || Number.isNaN(Number(cleanAmount))) {
                return { success: false, error: "Invalid amount" };
            }

            const donationContractAddress = getDonationContractAddress() as `0x${string}`;
            let amountIn: bigint;
            let decimals = 18;

            // Get decimals and parse amount
            if (token.isNative) {
                amountIn = parseEther(cleanAmount);
            } else if (token.address) {
                const tokenAddress = token.address as `0x${string}`;

                // Read decimals
                const tokenDecimals = await publicClient.readContract({
                    address: tokenAddress,
                    abi: erc20Abi,
                    functionName: "decimals",
                });
                decimals = tokenDecimals;
                amountIn = parseUnits(cleanAmount, decimals);

                // Check allowance
                const currentAllowance = await publicClient.readContract({
                    address: tokenAddress,
                    abi: erc20Abi,
                    functionName: "allowance",
                    args: [address, donationContractAddress],
                });

                console.log("🔎 Current allowance:", currentAllowance.toString(), "Needed:", amountIn.toString());

                // Approve if needed
                if (currentAllowance < amountIn) {
                    console.log("📝 Approving token for donation contract...");
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
                        await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
                        console.log("✅ Approve succeeded");

                        // Wait for allowance update with retry
                        let newAllowance = await publicClient.readContract({
                            address: tokenAddress,
                            abi: erc20Abi,
                            functionName: "allowance",
                            args: [address, donationContractAddress],
                        });

                        let retries = 0;
                        while (newAllowance < amountIn && retries < 5) {
                            console.log("⌛ waiting allowance update...");
                            await new Promise(r => setTimeout(r, 1000));
                            newAllowance = await publicClient.readContract({
                                address: tokenAddress,
                                abi: erc20Abi,
                                functionName: "allowance",
                                args: [address, donationContractAddress],
                            });
                            retries++;
                        }
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
                    address,
                    tokenInAddress,
                    amountIn,
                    getAddress(streamerAddress) as `0x${string}`,
                    BigInt(0),
                    deadline,
                ],
                value: token.isNative ? amountIn : undefined,
            });

            console.log("🚀 Donate tx sent:", donateTxHash);
            setTxHash(donateTxHash);

            // Wait for confirmation
            await publicClient.waitForTransactionReceipt({ hash: donateTxHash });
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

// Hook to get token balances using wagmi
export function useTokenBalances(tokens: TokenInfo[]) {
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const [balances, setBalances] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const fetchBalances = useCallback(async () => {
        if (!isConnected || !address || !publicClient || tokens.length === 0) {
            setBalances({});
            return;
        }

        setIsLoading(true);
        const newBalances: { [key: string]: string } = {};

        try {
            for (const token of tokens) {
                try {
                    if (token.isNative) {
                        const balance = await publicClient.getBalance({ address });
                        newBalances["native"] = formatEther(balance);
                    } else if (token.address) {
                        const tokenAddress = token.address.toLowerCase() as `0x${string}`;

                        // Check if it's a contract
                        const code = await publicClient.getCode({ address: tokenAddress });
                        if (!code || code === "0x") continue;

                        // Get decimals
                        const decimals = await publicClient.readContract({
                            address: tokenAddress,
                            abi: erc20Abi,
                            functionName: "decimals",
                        });

                        // Get balance
                        const balance = await publicClient.readContract({
                            address: tokenAddress,
                            abi: erc20Abi,
                            functionName: "balanceOf",
                            args: [address],
                        });

                        newBalances[tokenAddress] = formatUnits(balance, decimals);
                    }
                } catch (err) {
                    console.error(`Error fetching balance for ${token.symbol}:`, err);
                }
            }

            setBalances(newBalances);
        } catch (err) {
            console.error("Failed to fetch balances:", err);
        } finally {
            setIsLoading(false);
        }
    }, [isConnected, address, publicClient, tokens]);

    return { balances, isLoading, fetchBalances };
}
