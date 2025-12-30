"use client";

import { usePathname } from "next/navigation";
import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";

export function NewDashboardHeader() {
    const pathname = usePathname();

    const getTitle = () => {
        if (pathname === "/dashboard") return "Dashboard";
        if (pathname?.includes("/overlay")) return "OBS Overlay";
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
                <ConnectWalletButton label="Connect" />
            </div>
        </header>
    );
}
