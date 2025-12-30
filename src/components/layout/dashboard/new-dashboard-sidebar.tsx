"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useAccount } from "wagmi";

export function NewDashboardSidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const { isConnected } = useAccount();

    const streamerId = user?.streamerId;

    const isActive = (path: string) => {
        if (path === "/dashboard" && pathname === "/dashboard") return true;
        if (path !== "/dashboard" && pathname?.startsWith(path)) return true;
        return false;
    };

    return (
        <aside className="w-64 flex flex-col border-r border-border-dark bg-[#080a0f] hidden md:flex">
            {/* Logo */}
            <div className="p-8 flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-white font-bold">savings</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight font-display text-white">Kubi</h1>
            </div>

            <nav className="flex-1 flex flex-col gap-3 px-6 py-4">
                <Link
                    href="/dashboard"
                    prefetch={true}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${isActive("/dashboard") && !isActive("/dashboard/")
                        ? "bg-primary text-white shadow-lg shadow-primary/25 transform hover:scale-[1.02]"
                        : pathname === "/dashboard"
                            ? "bg-primary text-white shadow-lg shadow-primary/25 transform hover:scale-[1.02]"
                            : "hover:bg-white/5 text-gray-400 hover:text-white hover:pl-5"
                        }`}
                >
                    <span className={`material-symbols-outlined ${pathname === "/dashboard" ? "icon-filled" : ""}`}>grid_view</span>
                    <span className="font-bold font-display">Dashboard</span>
                </Link>

                <Link
                    href="/dashboard/create-link"
                    prefetch={true}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${isActive("/dashboard/create-link")
                        ? "bg-primary text-white shadow-lg shadow-primary/25 transform hover:scale-[1.02]"
                        : "hover:bg-white/5 text-gray-400 hover:text-white hover:pl-5"
                        }`}
                >
                    <span className={`material-symbols-outlined ${isActive("/dashboard/create-link") ? "icon-filled" : ""}`}>link</span>
                    <span className="font-medium font-display">Create Link</span>
                </Link>

                <Link
                    href="/dashboard/profile"
                    prefetch={true}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${isActive("/dashboard/profile")
                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                        : "hover:bg-white/5 text-gray-400 hover:text-white hover:pl-5"
                        }`}
                >
                    <span className="material-symbols-outlined">person</span>
                    <span className="font-medium font-display">Profile</span>
                </Link>

                {/* Overlay Link */}
                <Link
                    href="/dashboard/overlay"
                    prefetch={true}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${isActive("/dashboard/overlay")
                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                        : "hover:bg-white/5 text-gray-400 hover:text-white hover:pl-5"
                        }`}
                >
                    <span className="material-symbols-outlined">cast</span>
                    <span className="font-medium font-display">OBS Overlay</span>
                </Link>

                <Link
                    href="/dashboard/leaderboard"
                    prefetch={true}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${isActive("/dashboard/leaderboard")
                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                        : "hover:bg-white/5 text-gray-400 hover:text-white hover:pl-5"
                        }`}
                >
                    <span className="material-symbols-outlined">leaderboard</span>
                    <span className="font-medium font-display">Leaderboard</span>
                </Link>

                <Link
                    href="/dashboard/history"
                    prefetch={true}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${isActive("/dashboard/history")
                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                        : "hover:bg-white/5 text-gray-400 hover:text-white hover:pl-5"
                        }`}
                >
                    <span className="material-symbols-outlined">history</span>
                    <span className="font-medium font-display">History</span>
                </Link>

                <Link
                    href="/dashboard/tutorial"
                    prefetch={true}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${isActive("/dashboard/tutorial")
                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                        : "hover:bg-white/5 text-gray-400 hover:text-white hover:pl-5"
                        }`}
                >
                    <span className="material-symbols-outlined">school</span>
                    <span className="font-medium font-display">Tutorial</span>
                </Link>
            </nav>

            {/* User Profile Footer */}
            <div className="p-6 border-t border-border-dark/50">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-dark/50 border border-border-dark/50 hover:bg-surface-dark transition-colors cursor-pointer">
                    <div
                        className="size-10 rounded-full bg-cover bg-center ring-2 ring-primary/50"
                        style={{ backgroundImage: "url('/assets/brand/logo2.png')" }}
                    ></div>
                    <div className="flex flex-col overflow-hidden">
                        <p className="text-sm font-bold text-white font-display truncate">
                            {user?.profile?.displayName || user?.profile?.username || "Guest User"}
                        </p>
                        <p className="text-xs text-accent-cyan font-medium truncate">
                            {isConnected ? "Connected" : "Disconnected"}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
