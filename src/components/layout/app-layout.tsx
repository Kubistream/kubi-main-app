"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";
import { LandingNavbar } from "@/components/features/landing/landing-navbar";
import { useUserRole, type UserRole } from "@/hooks/use-user-role";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<UserRole, string> = {
  streamer: "Streamer",
  supporter: "Supporter",
};

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const role = useUserRole();
  const pathname = usePathname();

  const isMarketingRoute = pathname === "/" || pathname?.startsWith("/landing");

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col",
        isMarketingRoute
          ? "bg-rose-50 text-slate-900"
          : "bg-slate-950 text-slate-100",
      )}
    >
      {isMarketingRoute ? (
        <LandingNavbar roleLabel={ROLE_LABEL[role]} />
      ) : (
        <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-4 transition sm:h-20 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight text-white transition hover:text-indigo-300"
            >
              Kubi
            </Link>

            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-300">
                <span className="text-[0.65rem] font-semibold text-slate-500">Role</span>
                <span className="text-slate-100">{ROLE_LABEL[role]}</span>
              </span>

              <ConnectWalletButton label="Connect wallet" />
            </div>
          </div>
        </header>
      )}

      <div className="flex-1">{children}</div>
    </div>
  );
}
