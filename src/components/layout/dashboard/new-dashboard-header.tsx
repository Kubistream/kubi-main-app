"use client";

import { usePathname } from "next/navigation";
import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";

export function NewDashboardHeader() {
    const pathname = usePathname();

    const getTitle = () => {
        if (pathname === "/dashboard") return "Dashboard";
        if (pathname?.includes("/history")) return "Transaction History";
        if (pathname?.includes("/profile")) return "Profile";
        if (pathname?.includes("/leaderboard")) return "Leaderboard";
        if (pathname?.includes("/tutorial")) return "Tutorial";
        if (pathname?.includes("/create-link")) return "Create Link";
        return "Dashboard";
    };

    return (
        <header className="h-24 border-b border-border-dark/50 flex items-center justify-between px-10 bg-background-dark/80 backdrop-blur-md z-10 sticky top-0">
            <div className="flex flex-col">
                <h2 className="text-3xl font-black text-white font-display tracking-tight">{getTitle()}</h2>
            </div>
            <div className="flex items-center gap-4">
                <button className="flex items-center justify-center size-12 rounded-xl border border-border-dark bg-surface-dark/50 hover:bg-surface-dark text-gray-400 hover:text-white transition-all hover:scale-105 hover:shadow-lg">
                    <span className="material-symbols-outlined">visibility</span>
                </button>

                <button className="flex items-center justify-center size-12 rounded-xl border border-border-dark bg-surface-dark/50 hover:bg-surface-dark text-gray-400 hover:text-white transition-all relative hover:scale-105 hover:shadow-lg">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-3 right-3 size-2.5 bg-accent-purple rounded-full ring-2 ring-surface-dark"></span>
                </button>

                <button className="flex items-center justify-center size-12 rounded-xl border border-border-dark bg-surface-dark/50 hover:bg-surface-dark text-gray-400 hover:text-white transition-all hover:scale-105 hover:shadow-lg">
                    <span className="material-symbols-outlined">settings</span>
                </button>

                <ConnectWalletButton label="Connect" />
            </div>
        </header>
    );
}
