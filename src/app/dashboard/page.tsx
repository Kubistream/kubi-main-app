"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useAccount } from "wagmi";
import { useEarningsOverview } from "@/hooks/use-earnings-overview";
import type { EarningsTimeframe, EarningsCurrency } from "@/types/earnings";

// Format number with commas
function formatNumber(value: string | number, decimals = 2): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "0";
    return num.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

// Format currency
function formatCurrency(value: string | number, currency: EarningsCurrency = "USD"): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return currency === "USD" ? "$0.00" : "Rp 0";
    if (currency === "USD") {
        return `$${formatNumber(num, 2)}`;
    }
    return `Rp ${formatNumber(num, 0)}`;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const { address } = useAccount();

    const [timeframe, setTimeframe] = useState<EarningsTimeframe>("7D");
    const [currency] = useState<EarningsCurrency>("USD");

    const { data: earningsData, loading: earningsLoading } = useEarningsOverview(timeframe, currency);

    // Generate sparkline path from data
    const sparklinePath = useMemo(() => {
        if (!earningsData?.sparkline || earningsData.sparkline.length === 0) {
            // Default placeholder path
            return {
                line: "M0,150 C50,140 100,160 150,130 C200,100 250,110 300,90 C350,70 400,80 450,60 C500,40 550,50 600,40 C650,30 700,40 750,20 L800,10",
                area: "M0,150 C50,140 100,160 150,130 C200,100 250,110 300,90 C350,70 400,80 450,60 C500,40 550,50 600,40 C650,30 700,40 750,20 L800,10 L800,200 L0,200 Z"
            };
        }

        const points = earningsData.sparkline;
        const width = 800;
        const height = 200;
        const padding = 10;

        // Find min/max for scaling
        const values = points.map(p => parseFloat(p.v));
        const maxVal = Math.max(...values, 1);
        const minVal = Math.min(...values, 0);
        const range = maxVal - minVal || 1;

        // Generate points
        const pathPoints = points.map((point, i) => {
            const x = (i / (points.length - 1 || 1)) * width;
            const y = height - padding - ((parseFloat(point.v) - minVal) / range) * (height - padding * 2);
            return { x, y };
        });

        // Create smooth curve using quadratic bezier
        let linePath = `M${pathPoints[0]?.x ?? 0},${pathPoints[0]?.y ?? height}`;
        for (let i = 1; i < pathPoints.length; i++) {
            const prev = pathPoints[i - 1]!;
            const curr = pathPoints[i]!;
            const cpX = (prev.x + curr.x) / 2;
            linePath += ` Q${prev.x},${prev.y} ${cpX},${(prev.y + curr.y) / 2}`;
        }
        if (pathPoints.length > 1) {
            const last = pathPoints[pathPoints.length - 1]!;
            linePath += ` T${last.x},${last.y}`;
        }

        const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

        return { line: linePath, area: areaPath };
    }, [earningsData?.sparkline]);

    // Calculate total donations and growth
    const totalDonated = earningsData?.primaryTotal ?? "0";
    const growthPercent = earningsData?.growthPercent ?? 0;

    return (
        <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
            {/* Stats Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Total Value Donated */}
                <div className="bg-[#181033] border-2 border-white rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:border-primary/80 transition-all duration-300 shadow-xl">
                    <div className="absolute -right-6 -top-6 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12">
                        <span className="material-symbols-outlined text-9xl text-secondary">volunteer_activism</span>
                    </div>
                    <div className="flex flex-col gap-6 relative z-10 h-full justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-secondary rounded-xl text-black shadow-lg shadow-secondary/20 border-2 border-black">
                                <span className="material-symbols-outlined">payments</span>
                            </div>
                            <p className="text-gray-300 font-bold font-display tracking-wide uppercase text-xs">Total Donated</p>
                        </div>
                        <div>
                            {earningsLoading ? (
                                <div className="h-10 w-32 bg-surface-dark animate-pulse rounded-lg"></div>
                            ) : (
                                <h3 className="text-4xl font-black text-white font-display tracking-tight">
                                    {formatCurrency(totalDonated, currency)}
                                </h3>
                            )}
                            <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg ${growthPercent >= 0
                                ? "bg-green-500/10 border border-green-500/20"
                                : "bg-red-500/10 border border-red-500/20"
                                }`}>
                                <span className={`material-symbols-outlined text-sm ${growthPercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                                    {growthPercent >= 0 ? "trending_up" : "trending_down"}
                                </span>
                                <p className={`text-xs font-bold ${growthPercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                                    {growthPercent >= 0 ? "+" : ""}{growthPercent}% vs last period
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Current Yield APY */}
                <div className="bg-[#181033] border-2 border-white rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:border-accent-purple/80 transition-all duration-300 shadow-xl">
                    <div className="absolute -right-6 -top-6 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12">
                        <span className="material-symbols-outlined text-9xl text-accent-purple">trending_up</span>
                    </div>
                    <div className="flex flex-col gap-6 relative z-10 h-full justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-accent-purple rounded-xl text-black shadow-lg shadow-accent-purple/20 border-2 border-black">
                                <span className="material-symbols-outlined">percent</span>
                            </div>
                            <p className="text-gray-300 font-bold font-display tracking-wide uppercase text-xs">Current Yield APY</p>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-white font-display tracking-tight">4.8%</h3>
                            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent-purple/10 border border-accent-purple/20">
                                <span className="material-symbols-outlined text-sm text-accent-purple">arrow_upward</span>
                                <p className="text-accent-purple text-xs font-bold">+0.5% boost active</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active OBS Widgets */}
                <div className="bg-[#181033] border-2 border-white rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:border-accent-cyan/80 transition-all duration-300 shadow-xl">
                    <div className="absolute -right-6 -top-6 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12">
                        <span className="material-symbols-outlined text-9xl text-accent-cyan">broadcast_on_personal</span>
                    </div>
                    <div className="flex flex-col gap-6 relative z-10 h-full justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-accent-cyan rounded-xl text-black shadow-lg shadow-accent-cyan/20 border-2 border-black">
                                <span className="material-symbols-outlined">dvr</span>
                            </div>
                            <p className="text-gray-300 font-bold font-display tracking-wide uppercase text-xs">Active OBS Widgets</p>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-white font-display tracking-tight">
                                {user?.streamerId ? "1" : "0"}
                            </h3>
                            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
                                <span className={`size-2 rounded-full ${user?.streamerId ? "bg-accent-cyan animate-pulse" : "bg-gray-500"}`}></span>
                                <p className="text-accent-cyan text-xs font-bold">
                                    Status: {user?.streamerId ? "Online" : "Offline"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Charts Section */}
            <section>
                {/* Real-time Yield Earnings Chart */}
                <div className="bg-[#181033] border-2 border-white rounded-3xl p-6 sm:p-8 shadow-xl">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white font-display">Real-time Earnings</h3>
                            <p className="text-sm text-gray-400 mt-1">Your donation earnings over time</p>
                        </div>
                        <div className="flex flex-col items-end">
                            {earningsLoading ? (
                                <div className="h-8 w-24 bg-surface-dark animate-pulse rounded-lg"></div>
                            ) : (
                                <span className="text-3xl font-black text-secondary font-display tracking-tight">
                                    {formatCurrency(totalDonated, currency)}
                                </span>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                                </span>
                                <span className="text-xs text-secondary uppercase tracking-wider font-bold">Live</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeframe selector */}
                    <div className="flex gap-2 mb-4">
                        {(["1D", "7D", "30D", "All"] as const).map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === tf
                                    ? "bg-primary text-white"
                                    : "bg-surface-dark text-gray-400 hover:text-white hover:bg-white/10"
                                    }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    <div className="w-full h-72 relative bg-surface-dark/30 rounded-2xl p-4 border border-border-dark/30">
                        {earningsLoading ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <svg className="w-full h-full drop-shadow-[0_0_15px_rgba(98,58,214,0.3)]" preserveAspectRatio="none" viewBox="0 0 800 200">
                                <defs>
                                    <linearGradient id="gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: "#623AD6", stopOpacity: 0.3 }}></stop>
                                        <stop offset="100%" style={{ stopColor: "#623AD6", stopOpacity: 0 }}></stop>
                                    </linearGradient>
                                </defs>
                                <path d={sparklinePath.area} fill="url(#gradient)"></path>
                                <path d={sparklinePath.line} fill="none" stroke="#623AD6" strokeLinecap="round" strokeWidth="4"></path>
                            </svg>
                        )}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-6 px-2 font-display font-medium">
                        {earningsData?.sparkline && earningsData.sparkline.length > 0 ? (
                            <>
                                <span>{new Date(earningsData.sparkline[0]?.t ?? 0).toLocaleDateString()}</span>
                                <span className="text-white">Now</span>
                            </>
                        ) : (
                            <>
                                <span>No data</span>
                                <span className="text-white">Now</span>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Token Breakdown */}
            {earningsData?.tokenBreakdown && earningsData.tokenBreakdown.length > 0 && (
                <section className="bg-[#181033] border-2 border-white rounded-3xl p-6 sm:p-8 shadow-xl">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-bold text-white font-display">Token Breakdown</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {earningsData.tokenBreakdown.map((token) => (
                            <div key={token.tokenId} className="bg-surface-dark rounded-xl p-4 border border-border-dark/50">
                                <div className="flex items-center gap-3 mb-3">
                                    {token.logoURI ? (
                                        <img src={token.logoURI} alt={token.symbol} className="w-8 h-8 rounded-full" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                            <span className="text-xs font-bold text-primary">{token.symbol.slice(0, 2)}</span>
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-bold text-white">{token.symbol}</p>
                                        <p className="text-xs text-gray-500">{token.name}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-lg font-bold text-white">{formatCurrency(token.fiatValue, currency)}</p>
                                    </div>
                                    <div className={`text-xs font-bold ${token.growthPercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                                        {token.growthPercent >= 0 ? "+" : ""}{token.growthPercent}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
