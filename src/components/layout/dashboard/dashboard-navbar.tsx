"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";

export function DashboardNavbar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/dashboard/admin") ?? false;
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between border-b border-border-dark/50 bg-background-dark/90 px-6 py-4 backdrop-blur-md sm:px-10"
    >
      <div className="flex items-baseline gap-3">
        <h1 className="text-xl font-bold text-white sm:text-2xl">{isAdmin ? "Admin Dashboard" : "Creator Dashboard"}</h1>
        <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          Beta
        </span>
      </div>

      <div className="flex items-center gap-4">
        <ConnectWalletButton label="Connect wallet" />
      </div>
    </header>
  );
}
