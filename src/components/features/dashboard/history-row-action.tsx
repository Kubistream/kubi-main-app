"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { formatUnits } from "viem";

import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Helper to extract video ID (duplicated for component isolation)
const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// Only define the shape of props we need for display
export interface HistoryRowActionProps {
    txHash: string;
    donorName: string | null;
    donorWallet: string | null;
    status: string;
    amountInRaw: string | null;
    amountOutRaw: string | null;
    feeRaw: string | null;
    tokenIn: {
        symbol: string;
        logoURI: string | null;
        decimals: number;
    };
    tokenOut: {
        symbol: string;
        logoURI: string | null;
        decimals: number;
    };
    mediaType?: "TEXT" | "AUDIO" | "VIDEO";
    message?: string | null;
    mediaUrl?: string | null;
    createdAt: string;
}

function shortenHash(value: string, lead = 6, tail = 4) {
    if (!value || value.length <= lead + tail + 3) return value;
    return `${value.slice(0, lead)}...${value.slice(-tail)}`;
}

/**
 * Renders a "View" button that opens a dialog with full transaction details.
 */
export function HistoryRowAction({
    row
}: {
    row: HistoryRowActionProps;
}) {
    const [isOpen, setIsOpen] = useState(false);

    // Helper formats
    const formatAmount = (raw: string | null, decimals: number) => {
        if (!raw) return "0";
        try {
            const cleanRaw = raw.split('.')[0];
            const formatted = formatUnits(BigInt(cleanRaw), decimals);
            return Number(formatted).toLocaleString("en-US", { maximumFractionDigits: 4 });
        } catch (e) {
            return "0";
        }
    };

    const displayAmountIn = formatAmount(row.amountInRaw, row.tokenIn.decimals);
    const displayAmountOut = formatAmount(row.amountOutRaw, row.tokenOut.decimals);
    // Fee is usually in native token (ETH) or the input token depending on logic, 
    // but looking at page.tsx 'feeRaw' seems to be associated with tokenIn based on 'formatDonationAmount(row.feeRaw, row.tokenIn.decimals)'.
    // Let's assume fee is in tokenIn for now based on previous table code.
    const displayFee = formatAmount(row.feeRaw, row.tokenIn.decimals);

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-[var(--color-surface-elevated)] rounded-full"
                onClick={() => setIsOpen(true)}
            >
                <span className="material-symbols-outlined text-lg">visibility</span>
                <span className="sr-only">View Details</span>
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-[450px] p-0 border-none bg-transparent shadow-none overflow-visible">
                    {/* Wrapper to center and scale slightly if needed */}
                    <div className="relative w-full">
                        {/* Floating decor */}
                        <div
                            className="absolute -right-4 -top-6 w-16 h-16 bg-[var(--color-accent-yellow)] rounded-full z-0 animate-bounce"
                            style={{ animationDuration: "3s" }}
                        />

                        {/* Shadow layer */}
                        <div className="absolute -left-2 -bottom-2 w-full h-full bg-black rounded-2xl z-0" />

                        {/* Main Card */}
                        <div className="relative rounded-2xl p-6 border-2 border-white bg-[#181033] z-10 flex flex-col gap-4 shadow-[8px_8px_0_0_rgba(247,120,186,1)]">

                            {/* Header: Token Icon + Name + Date */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[var(--color-accent-pink)] w-12 h-12 flex items-center justify-center rounded-lg border-2 border-white shadow-[2px_2px_0px_0px_#000] overflow-hidden">
                                        {row.tokenIn.logoURI ? (
                                            <img src={row.tokenIn.logoURI} alt={row.tokenIn.symbol} className="w-8 h-8 object-contain" />
                                        ) : (
                                            <span className="font-bold text-black text-lg">{row.tokenIn.symbol.slice(0, 2)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-xs font-black tracking-wider uppercase text-[var(--color-accent-pink)] mb-0.5">
                                            Donation Details
                                        </div>
                                        <h3 className="text-2xl font-black leading-none text-white truncate max-w-[200px]">
                                            {row.donorName || "Anonymous"}
                                        </h3>
                                        {row.donorWallet && (
                                            <p className="text-[10px] font-mono text-slate-400 mt-1">
                                                {shortenHash(row.donorWallet)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <div className="bg-[var(--color-accent-cyan)] text-black border-2 border-black rounded-lg px-2 py-1 flex items-center gap-1 shadow-[2px_2px_0px_0px_#000] transform -rotate-2">
                                        <span className="text-[10px] font-black uppercase tracking-wide">
                                            {new Date(row.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider",
                                        row.status === "CONFIRMED" ? "bg-green-500/20 border-green-500 text-green-400" :
                                            row.status === "PENDING" ? "bg-yellow-500/20 border-yellow-500 text-yellow-400" :
                                                "bg-red-500/20 border-red-500 text-red-400"
                                    )}>
                                        {row.status}
                                    </div>
                                </div>
                            </div>

                            {/* Amount Box */}
                            <div className="bg-white rounded-xl p-3 border-2 border-black relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-16 h-full bg-[var(--color-accent-yellow)]/20 skew-x-12 transform translate-x-4 transition-transform group-hover:translate-x-2" />
                                <div className="flex items-baseline gap-2 relative z-10">
                                    <span className="text-4xl font-black text-black tracking-tight">
                                        {displayAmountIn}
                                    </span>
                                    <span className="text-2xl font-black text-slate-500">{row.tokenIn.symbol}</span>
                                </div>
                            </div>

                            {/* Financial Breakdown (Received & Fee) */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#1F1640] rounded-xl p-3 border border-white/10">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Received</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-lg font-bold text-white">{displayAmountOut}</span>
                                        <span className="text-xs font-bold text-slate-500">{row.tokenOut.symbol}</span>
                                    </div>
                                </div>
                                <div className="bg-[#1F1640] rounded-xl p-3 border border-white/10">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Fee</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-lg font-bold text-slate-300">{displayFee}</span>
                                        <span className="text-xs font-bold text-slate-500">{row.tokenIn.symbol}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Message Bubble (Text) */}
                            {row.mediaType === "TEXT" && row.message && (
                                <div className="relative mt-1">
                                    <div className="absolute -top-2 left-8 w-4 h-4 bg-[#2D2452] rotate-45 border-l-2 border-t-2 border-white z-20" />
                                    <div className="bg-[#2D2452] border-2 border-white rounded-xl p-4 relative z-10 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
                                        <p className="text-white text-base font-bold leading-snug">
                                            "{row.message}"
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Media Content */}
                            {row.mediaUrl && (
                                <div className="mt-2 text-center">
                                    {row.mediaType === "VIDEO" && getYouTubeId(row.mediaUrl) ? (
                                        <div className="rounded-xl overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_#000] aspect-video relative">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={`https://www.youtube.com/embed/${getYouTubeId(row.mediaUrl)}`}
                                                title="Video player"
                                                allow="accelerometer; border-0; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="w-full h-full"
                                            />
                                        </div>
                                    ) : row.mediaType === "AUDIO" ? (
                                        <div className="p-3 bg-[var(--color-accent-yellow)]/10 rounded-xl border-2 border-[var(--color-accent-yellow)] relative mt-2">
                                            <div className="absolute -top-3 left-4 bg-[#181033] px-2 text-[10px] font-bold text-[var(--color-accent-yellow)] uppercase tracking-wider">
                                                Voice Message
                                            </div>
                                            <audio controls src={row.mediaUrl} className="w-full h-8 mt-1" />
                                        </div>
                                    ) : null}

                                    {/* If there's a caption WITH media */}
                                    {row.mediaType !== "TEXT" && row.message && (
                                        <div className="mt-3 bg-[#2D2452] border-2 border-white/50 rounded-xl p-3 text-left">
                                            <p className="text-sm font-bold text-slate-300">"{row.message}"</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Footer / Meta Actions */}
                            <div className="pt-4 border-t-2 border-white/10 flex items-center justify-between mt-2">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Transaction Hash</span>
                                    <div className="flex items-center gap-1 font-mono text-xs text-[var(--color-accent-cyan)]">
                                        {shortenHash(row.txHash)}
                                    </div>
                                </div>

                                <Link
                                    href={`https://sepolia.basescan.org/tx/${row.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button
                                        size="sm"
                                        className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-bold border-2 border-transparent hover:border-white shadow-lg transition-all"
                                    >
                                        <span className="mr-1">BaseScan</span>
                                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                                    </Button>
                                </Link>
                            </div>

                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
