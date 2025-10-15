"use client";

import Link from "next/link";

import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";
export function DashboardNavbar() {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between border-b border-white/40 bg-white/80 px-6 py-4 backdrop-blur-sm sm:px-10"
      style={{ boxShadow: "0 12px 32px -24px rgba(47, 42, 44, 0.35)" }}
    >
      <div className="flex items-baseline gap-3">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Creator Dashboard</h1>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-rose-500">
          Beta
        </span>
      </div>

      <div className="flex items-center gap-4">
        <ConnectWalletButton label="Connect wallet" />
      </div>
    </header>
  );
}
