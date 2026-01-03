
"use client";

import Link from "next/link";
import { useState } from "react";
import { Token } from "@prisma/client"; // Or wherever the type comes from

import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";
import { Loader2, CheckCircle, AlertCircle, Droplets, Wallet } from "lucide-react";
import { useAccount } from "wagmi";

interface FaucetViewProps {
    tokens: Token[];
}

export function FaucetView({ tokens }: FaucetViewProps) {
    const { address, isConnected } = useAccount();
    const [recipient, setRecipient] = useState("");
    const [loadingToken, setLoadingToken] = useState<string | null>(null);
    const [status, setStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
        txHash?: string;
    }>({ type: null, message: "" });

    const effectiveAddress = recipient || address;

    const handleClaim = async (tokenId: string, symbol: string) => {
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
            });
        } catch (err: any) {
            setStatus({ type: "error", message: err.message });
        } finally {
            setLoadingToken(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-pink-500/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative z-10 mx-auto py-6 pt-10 max-w-7xl px-6">
                <header className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-3 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/20 hover:scale-105 transition-transform" aria-label="Back to Home">
                            <img src="/assets/brand/logo.png" alt="Kubi" className="w-8 h-8 invert brightness-0" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                                Kubi Faucet
                            </h1>
                            <p className="text-gray-400 mt-1">Get testnet tokens for the Base Sepolia network</p>
                        </div>
                    </div>
                    <ConnectWalletButton label="Connect Wallet" />
                </header>

                <section className="mb-12 max-w-2xl mx-auto">
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
                    <div className={`max-w-xl mx-auto mb-12 p-4 rounded-xl border flex items-center gap-3 ${status.type === 'success'
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <div className="flex-1">
                            <p className="font-medium">{status.message}</p>
                            {status.txHash && (
                                <a
                                    href={`https://sepolia.basescan.org/tx/${status.txHash}`}
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tokens.map((token) => (
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
                                    <span className="text-gray-300 bg-white/5 px-2 py-1 rounded-md border border-white/5">Base Sepolia</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Chain ID</span>
                                    <span className="text-gray-300">{token.chainId}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleClaim(token.id, token.symbol)}
                                disabled={!!loadingToken || (!address && !recipient)}
                                className="mt-8 w-full py-3.5 px-4 bg-white text-black font-bold rounded-xl hover:bg-pink-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(244,114,182,0.4)]"
                            >
                                {loadingToken === token.id ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Processing...
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
            </div>
        </div>
    );
}
