"use client";

import { useState } from "react";
import { Wallet, RefreshCw, User, CheckCircle2, ArrowRight, Building2, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function LandingTokenFlow() {
    const [activeFlow, setActiveFlow] = useState<"swap" | "yield">("swap");

    return (
        <section className="bg-[#0f0919] py-24 px-6 overflow-hidden">
            <div className="mx-auto max-w-6xl">
                <header className="mb-12 text-center">
                    <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-md">
                        <span className="bg-gradient-to-r from-[#5EEAD4] to-[#A78BFA] bg-clip-text text-transparent">
                            See It In Action
                        </span>
                    </h2>
                    <p className="mt-4 text-lg font-medium text-slate-400 max-w-2xl mx-auto">
                        Visualizing how Kubi handles your assets securely on-chain.
                    </p>
                </header>

                {/* Toggle Controls */}
                <div className="flex justify-center mb-10">
                    <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex gap-2">
                        <button
                            onClick={() => setActiveFlow("swap")}
                            className={cn(
                                "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                                activeFlow === "swap" ? "bg-[#7C3AED] text-white shadow-md scale-105" : "text-slate-400 hover:text-white"
                            )}
                        >
                            Auto-Swap
                        </button>
                        <button
                            onClick={() => setActiveFlow("yield")}
                            className={cn(
                                "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                                activeFlow === "yield" ? "bg-[#FBBF24] text-black shadow-md scale-105" : "text-slate-400 hover:text-white"
                            )}
                        >
                            Auto-Yield
                        </button>
                    </div>
                </div>

                {/* Animated Flow Container */}
                <div className="relative mx-auto max-w-4xl h-[500px] md:h-[450px]">
                    {activeFlow === "swap" && <AnimatedSwapFlow />}
                    {activeFlow === "yield" && <AnimatedYieldFlow />}
                </div>
            </div>
        </section>
    );
}

function AnimatedSwapFlow() {
    return (
        <Card className="border border-white/10 bg-[#181033] shadow-[8px_8px_0_0_#7C3AED] rounded-3xl overflow-hidden relative h-full animate-fade-in">
            <CardContent className="p-8 md:p-12 h-full flex flex-col justify-center">

                {/* Connection Lines (Desktop) */}
                <div className="absolute top-[40%] left-[10%] right-[10%] h-1 bg-white/5 hidden md:block -z-0">
                    {/* Moving gradient line */}
                    <div className="h-full w-full bg-gradient-to-r from-transparent via-[#5EEAD4] to-transparent opacity-30 animate-pulse" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                    {/* Step 1: Supporter */}
                    <div className="flex flex-col items-center text-center gap-4 group">
                        <div className="w-20 h-20 rounded-full bg-[#181033] border-4 border-[#5EEAD4] flex items-center justify-center shadow-[0_0_20px_rgba(94,234,212,0.3)] relative z-20">
                            <User size={32} className="text-[#5EEAD4]" />
                            {/* Badge */}
                            <div className="absolute -top-3 -right-3 bg-white text-slate-900 text-xs font-black px-2 py-1 rounded-full border border-slate-200">
                                Sender
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Supporter</h3>
                            <div className="mt-2 inline-flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-sm font-mono text-slate-300">Sends ETH</span>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Contract (The Processor) */}
                    <div className="flex flex-col items-center text-center gap-4 relative">
                        {/* Mobile Connect Line */}
                        <div className="h-12 w-1 bg-white/10 md:hidden absolute -top-14 left-1/2 -translate-x-1/2" />

                        <div className="w-24 h-24 rounded-2xl bg-[#7C3AED] flex items-center justify-center shadow-[6px_6px_0_0_#000] relative z-20 animate-[bounce_3s_infinite]">
                            <RefreshCw size={40} className="text-white animate-[spin_4s_linear_infinite]" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Kubi Protocol</h3>
                            <div className="mt-2 bg-[#7C3AED]/10 px-3 py-1 rounded-lg border border-[#7C3AED]/30">
                                <span className="text-sm font-bold text-[#A78BFA]">Auto-Swap</span>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Streamer */}
                    <div className="flex flex-col items-center text-center gap-4">
                        {/* Mobile Connect Line */}
                        <div className="h-12 w-1 bg-white/10 md:hidden absolute -top-14 left-1/2 -translate-x-1/2" />

                        <div className="w-20 h-20 rounded-full bg-[#181033] border-4 border-[#FBBF24] flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.3)] relative z-20">
                            <Wallet size={32} className="text-[#FBBF24]" />
                            <div className="absolute -top-3 -right-3 bg-white text-slate-900 text-xs font-black px-2 py-1 rounded-full border border-slate-200">
                                You
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Streamer</h3>
                            <div className="mt-2 inline-flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                                <div className="w-3 h-3 rounded-full bg-[#FBBF24] shadow-[0_0_10px_#FBBF24]" />
                                <span className="text-sm font-mono text-slate-300">Gets USDC</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* The Moving Token Animation Layer */}
                <div className="absolute inset-0 pointer-events-none hidden md:block">
                    {/* Token 1: ETH moves from Left to Center */}
                    <div className="absolute top-[40%] left-[16%] -translate-y-1/2 flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full shadow-lg z-30 animate-token-travel-1">
                        <span className="text-[10px] font-bold text-white">ETH</span>
                    </div>

                    {/* Token 2: USDC moves from Center to Right */}
                    <div className="absolute top-[40%] left-[50%] -translate-y-1/2 flex items-center justify-center w-8 h-8 bg-[#FBBF24] rounded-full shadow-lg z-30 animate-token-travel-2 opacity-0">
                        <span className="text-[8px] font-bold text-black">USDC</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function AnimatedYieldFlow() {
    return (
        <Card className="border border-white/10 bg-[#181033] shadow-[8px_8px_0_0_#06D6A0] rounded-3xl overflow-hidden relative h-full animate-fade-in">
            <CardContent className="p-8 md:p-12 h-full flex flex-col justify-center">

                <div className="absolute top-[40%] left-[10%] right-[10%] h-1 bg-white/5 hidden md:block -z-0">
                    <div className="h-full w-full bg-gradient-to-r from-transparent via-[#06D6A0] to-transparent opacity-30 animate-pulse" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                    {/* Step 1: Supporter */}
                    <div className="flex flex-col items-center text-center gap-4 group">
                        <div className="w-20 h-20 rounded-full bg-[#181033] border-4 border-[#5EEAD4] flex items-center justify-center shadow-[0_0_20px_rgba(94,234,212,0.3)] relative z-20">
                            <User size={32} className="text-[#5EEAD4]" />
                            <div className="absolute -top-3 -right-3 bg-white text-slate-900 text-xs font-black px-2 py-1 rounded-full border border-slate-200">
                                Sender
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Supporter</h3>
                            <div className="mt-2 inline-flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                                <span className="text-sm font-mono text-slate-300">Direct Donation</span>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Kubi Contract (The Router) */}
                    <div className="flex flex-col items-center text-center gap-4 relative">
                        <div className="h-12 w-1 bg-white/10 md:hidden absolute -top-14 left-1/2 -translate-x-1/2" />
                        <div className="w-24 h-24 rounded-2xl bg-[#06D6A0] flex items-center justify-center shadow-[6px_6px_0_0_#000] relative z-20 animate-[bounce_3s_infinite]">
                            <RefreshCw size={40} className="text-[#0f0919] animate-[spin_5s_linear_infinite]" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Kubi Protocol</h3>
                            <div className="mt-2 bg-[#06D6A0]/10 px-3 py-1 rounded-lg border border-[#06D6A0]/30">
                                <span className="text-sm font-bold text-[#06D6A0]">Swaps & Deposits</span>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Yield Protocol */}
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="h-12 w-1 bg-white/10 md:hidden absolute -top-14 left-1/2 -translate-x-1/2" />
                        <div className="w-20 h-20 rounded-full bg-[#181033] border-4 border-[#06D6A0] flex items-center justify-center shadow-[0_0_20px_rgba(6,214,160,0.3)] relative z-20">
                            <Building2 size={32} className="text-[#06D6A0]" />
                            {/* Floating Coins Animation */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-[#FBBF24] animate-yield-float" style={{ animationDelay: '0s' }} />
                                <div className="w-3 h-3 rounded-full bg-[#FBBF24] animate-yield-float" style={{ animationDelay: '0.5s' }} />
                                <div className="w-2 h-2 rounded-full bg-[#FBBF24] animate-yield-float" style={{ animationDelay: '1s' }} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Yield Accrual</h3>
                            <div className="mt-2 inline-flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                                <span className="text-sm font-bold text-[#06D6A0]">+ 5-10% APY</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Moving Token: ETH -> Contract -> Yield */}
                <div className="absolute inset-0 pointer-events-none hidden md:block">
                    {/* Token 1: ETH moves from Left to Center (Contract) */}
                    <div className="absolute top-[38%] left-[16%] -translate-y-1/2 flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full shadow-lg z-30 animate-token-travel-1">
                        <span className="text-[10px] font-bold text-white">ETH</span>
                    </div>

                    {/* Token 2: USDC moves from Center (Contract) to Right (Yield) */}
                    <div className="absolute top-[38%] left-[50%] -translate-y-1/2 flex items-center justify-center w-8 h-8 bg-[#FBBF24] rounded-full shadow-lg z-30 animate-token-travel-2 opacity-0">
                        <span className="text-[8px] font-bold text-black">USDC</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
