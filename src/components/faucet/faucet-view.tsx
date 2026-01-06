
"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Token } from "@prisma/client";

import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";
import { Loader2, CheckCircle, AlertCircle, Wallet } from "lucide-react";
import { useAccount } from "wagmi";

// Chain configurations
const CHAINS: Record<number, {
    name: string;
    shortName: string;
    explorerUrl: string;
    color: string;
    bgColor: string;
    iconUrl: string;
}> = {
    5003: {
        name: "Mantle Sepolia",
        shortName: "Mantle",
        explorerUrl: "https://sepolia.mantlescan.xyz/tx",
        color: "from-[#65B3AE] to-[#4A9591]",
        bgColor: "bg-[#65B3AE]",
        iconUrl: "https://cryptologos.cc/logos/mantle-mnt-logo.png?v=040",
    },
    84532: {
        name: "Base Sepolia",
        shortName: "Base",
        explorerUrl: "https://sepolia.basescan.org/tx",
        color: "from-[#0052FF] to-[#003DD9]",
        bgColor: "bg-[#0052FF]",
        iconUrl: "https://avatars.githubusercontent.com/u/108554348?s=200&v=4",
    },
};

// Chain IDs as numbers for proper comparison
const CHAIN_IDS = [5003, 84532] as const;

interface FaucetViewProps {
    tokens: Token[];
}

export function FaucetView({ tokens }: FaucetViewProps) {
    const { address } = useAccount();
    const [recipient, setRecipient] = useState("");
    const [loadingToken, setLoadingToken] = useState<string | null>(null);
    const [activeChain, setActiveChain] = useState<number>(5003); // Default to Mantle
    const [status, setStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
        txHash?: string;
        chainId?: number;
    }>({ type: null, message: "" });
    // Cooldown tracking to prevent spam-clicking
    const [cooldownTokens, setCooldownTokens] = useState<Set<string>>(new Set());
    const COOLDOWN_MS = 10000; // 10 seconds cooldown after claim

    const effectiveAddress = recipient || address;

    // Filter tokens by active chain
    const filteredTokens = useMemo(() => {
        return tokens.filter((token) => token.chainId === activeChain);
    }, [tokens, activeChain]);

    // Get active chain config
    const activeChainConfig = CHAINS[activeChain];

    const handleClaim = async (tokenId: string, symbol: string, chainId: number) => {
        // Check cooldown first
        if (cooldownTokens.has(tokenId)) {
            setStatus({ type: "error", message: "Please wait before claiming again" });
            return;
        }

        if (!effectiveAddress) {
            setStatus({ type: "error", message: "Please connect wallet or enter address" });
            return;
        }

        setLoadingToken(tokenId);
        setStatus({ type: null, message: "" });

        try {
            const res = await fetch("/api/faucet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletAddress: effectiveAddress, tokenId }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to claim tokens");
            }

            setStatus({
                type: "success",
                message: `Successfully claimed 100 ${symbol}!`,
                txHash: data.txHash,
                chainId: chainId,
            });

            // Add token to cooldown
            setCooldownTokens(prev => new Set(prev).add(tokenId));
            setTimeout(() => {
                setCooldownTokens(prev => {
                    const next = new Set(prev);
                    next.delete(tokenId);
                    return next;
                });
            }, COOLDOWN_MS);
        } catch (err: any) {
            setStatus({ type: "error", message: err.message });
        } finally {
            setLoadingToken(null);
        }
    };

    const getExplorerUrl = (txHash: string, chainId?: number) => {
        const chain = chainId ? CHAINS[chainId] : activeChainConfig;
        return `${chain.explorerUrl}/${txHash}`;
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-pink-500/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative z-10 mx-auto py-6 pt-10 max-w-7xl px-6">
                <header className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-3 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/20 hover:scale-105 transition-transform" aria-label="Back to Home">
                            <img src="/assets/brand/logo.png" alt="Kubi" className="w-8 h-8 invert brightness-0" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                                Kubi Faucet
                            </h1>
                            <p className="text-gray-400 mt-1">Get testnet tokens for development</p>
                        </div>
                    </div>
                    <ConnectWalletButton label="Connect Wallet" />
                </header>

                {/* Chain Tabs */}
                <section className="mb-8">
                    <div className="flex justify-center">
                        <div className="inline-flex bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 gap-1">
                            {CHAIN_IDS.map((chainId) => {
                                const chain = CHAINS[chainId];
                                const isActive = activeChain === chainId;
                                return (
                                    <button
                                        key={chainId}
                                        onClick={() => setActiveChain(chainId)}
                                        className={`
                                            flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300
                                            ${isActive
                                                ? `bg-gradient-to-r ${chain.color} text-white shadow-lg`
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        <img
                                            src={chain.iconUrl}
                                            alt={chain.shortName}
                                            className={`w-6 h-6 rounded-full ${isActive ? '' : 'opacity-60'}`}
                                        />
                                        <span>{chain.shortName}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-white/10'}`}>
                                            {chainId}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="mb-10 max-w-2xl mx-auto">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Wallet className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Enter wallet address (0x...)"
                                className="block w-full pl-11 pr-4 py-4 bg-transparent text-white placeholder-gray-500 focus:outline-none focus:ring-0 text-lg font-mono"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                defaultValue={address}
                            />
                        </div>
                    </div>
                    {!recipient && !address && (
                        <p className="text-center text-sm text-yellow-500/80 mt-3 flex items-center justify-center gap-2">
                            <AlertCircle size={14} />
                            Connect your wallet or enter an address above
                        </p>
                    )}
                </section>

                {status.message && (
                    <div className={`max-w-xl mx-auto mb-10 p-4 rounded-xl border flex items-center gap-3 ${status.type === 'success'
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <div className="flex-1">
                            <p className="font-medium">{status.message}</p>
                            {status.txHash && (
                                <a
                                    href={getExplorerUrl(status.txHash, status.chainId)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs underline opacity-80 hover:opacity-100 block mt-1"
                                >
                                    View on Block Explorer
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Tokens Grid */}
                {filteredTokens.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                            <AlertCircle size={32} className="text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-400 mb-2">No tokens available</h3>
                        <p className="text-gray-500">There are no faucet tokens configured for {activeChainConfig.name}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTokens.map((token) => (
                            <div
                                key={token.id}
                                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 rounded-3xl p-6 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        {token.logoURI ? (
                                            <img src={token.logoURI} alt={token.symbol} className="w-12 h-12 rounded-full bg-white/10 object-cover p-1" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-lg font-bold">
                                                {token.symbol[0]}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-pink-400 transition-colors">{token.name || token.symbol}</h3>
                                            <p className="text-sm text-gray-400 font-mono">{token.symbol}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Network</span>
                                        <span className={`text-white px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r ${activeChainConfig.color}`}>
                                            {activeChainConfig.shortName}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Chain ID</span>
                                        <span className="text-gray-300">{token.chainId}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleClaim(token.id, token.symbol, token.chainId)}
                                    disabled={!!loadingToken || (!address && !recipient) || cooldownTokens.has(token.id)}
                                    className="mt-8 w-full py-3.5 px-4 bg-white text-black font-bold rounded-xl hover:bg-pink-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(244,114,182,0.4)]"
                                >
                                    {loadingToken === token.id ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Processing...
                                        </>
                                    ) : cooldownTokens.has(token.id) ? (
                                        <>
                                            <CheckCircle size={18} />
                                            Claimed - Wait 10s
                                        </>
                                    ) : (
                                        <>
                                            Claim 100 {token.symbol}
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
