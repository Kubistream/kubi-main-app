import React from "react";
import { cn } from "@/lib/utils"; // Assuming utils exists, standard in UI libs
import { TrendingUp, Bitcoin } from "lucide-react";

export type DonationCardProps = {
    donorName: string;
    amount: string;
    tokenSymbol: string;
    tokenLogo?: string;
    message?: string;
    apy?: string;
    theme?: "Vibrant Dark" | "Minimal Light";
    animationPreset?: string;
    showYieldApy?: boolean;
};

export function DonationCard({
    donorName,
    amount,
    tokenSymbol,
    tokenLogo,
    message,
    apy = "+5.2% APY",
    theme = "Vibrant Dark",
    animationPreset = "Slide In Left",
    showYieldApy = true,
}: DonationCardProps) {
    const isDark = theme === "Vibrant Dark";

    const getAnimationClass = (preset: string) => {
        switch (preset) {
            case "Slide In Left":
                return "animate-enter-slide-left";
            case "Fade In":
                return "animate-fade-in";
            case "Pop Up":
                return "animate-enter-zoom";
            case "Glitch Effect":
                // Using a bottom slide as proxy for now
                return "animate-enter-slide-bottom";
            default:
                return "animate-enter-slide-left";
        }
    };

    const renderTokenIcon = () => {
        if (tokenLogo) {
            return <img src={tokenLogo} alt={tokenSymbol} className="w-8 h-8 object-contain" />;
        }

        // Fallbacks for common tokens if no logo provided
        if (tokenSymbol === "BTC" || tokenSymbol === "WBTC") return <span className="font-bold text-black text-[24px]">₿</span>;
        if (tokenSymbol === "ETH" || tokenSymbol === "WETH") return <span className="font-bold text-black text-[20px]">Ξ</span>;
        if (tokenSymbol === "USDC" || tokenSymbol === "USDT") return <span className="font-bold text-black text-[20px]">$</span>;

        // Default text fallback
        return <span className="font-bold text-black text-[18px]">{tokenSymbol.slice(0, 2)}</span>;
    };

    return (
        <div className={cn("fill-mode-forwards relative z-20", getAnimationClass(animationPreset))}>
            <div className="w-[450px] relative">
                {/* Floating accent circle - Animated */}
                <div
                    className="absolute -right-4 -top-6 w-16 h-16 bg-accent-yellow rounded-full z-0 animate-bounce"
                    style={{ animationDuration: "3s" }}
                />

                {/* Black shadow layer */}
                <div className="absolute -left-2 -bottom-2 w-full h-full bg-black rounded-2xl z-0" />

                {/* Main card */}
                <div
                    className={cn(
                        "relative rounded-2xl p-6 border-2 border-black z-10 flex flex-col gap-4",
                        "shadow-[0_0_0_4px_#000,8px_8px_0_0_rgba(247,120,186,1)]", // overlay-card-glow equivalent
                        isDark ? "bg-[#181033]" : "bg-white"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-accent-pink w-12 h-12 flex items-center justify-center rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] overflow-hidden">
                                {renderTokenIcon()}
                            </div>
                            <div>
                                <div className="text-xs font-black tracking-wider uppercase text-accent-pink mb-0.5">
                                    Incoming Donation
                                </div>
                                <h3 className={cn("text-2xl font-black leading-none", isDark ? "text-white" : "text-black")}>
                                    {donorName}
                                </h3>
                            </div>
                        </div>

                        {showYieldApy && (
                            <div className="bg-accent-cyan text-black border-2 border-black rounded-lg px-2 py-1 flex items-center gap-1 shadow-[2px_2px_0px_0px_#000] transform -rotate-2">
                                <TrendingUp size={16} strokeWidth={3} />
                                <span className="text-[11px] font-black">{apy}</span>
                            </div>
                        )}
                    </div>

                    {/* Amount box */}
                    <div className="bg-white rounded-xl p-3 border-2 border-black relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-full bg-accent-yellow/20 skew-x-12 transform translate-x-4" />
                        <div className="flex items-baseline gap-2 relative z-10">
                            <span className="text-4xl font-black text-black tracking-tight">{amount}</span>
                            <span className="text-2xl font-black text-slate-500">{tokenSymbol}</span>
                        </div>
                    </div>

                    {/* Message bubble */}
                    {message && (
                        <div className="relative mt-1">
                            <div className="absolute -top-2 left-8 w-4 h-4 bg-[#2D2452] rotate-45 border-l-2 border-t-2 border-black z-20" />
                            <div className="bg-[#2D2452] border-2 border-black rounded-xl p-4 relative z-10">
                                <p className="text-white text-base font-bold leading-snug">
                                    "{message}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
