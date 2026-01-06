"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

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
  const isDashboardExperience =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/onboarding") ||
    // Overlays are rendered standalone (for OBS), no app chrome
    pathname?.startsWith("/overlays");

  if (isDashboardExperience) {
    return <>{children}</>;
  }

  return (
    <div
      suppressHydrationWarning
      className={cn(
        "flex min-h-screen flex-col",
        "bg-gradient-to-br from-background-dark to-[#0f141e] text-white",
      )}
    >
      {isMarketingRoute ? (
        <LandingNavbar roleLabel={ROLE_LABEL[role]} />
      ) : (
        <header
          className="sticky top-0 z-50 border-b border-border-dark/50 backdrop-blur-md"
          style={{ backgroundColor: "rgba(11, 14, 20, 0.9)" }}
        >
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 transition sm:h-20 sm:flex-nowrap sm:px-6">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="Kubi Home">
              <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-white font-bold text-xl">savings</span>
              </div>
              <span className="text-xl font-bold text-white">Kubi</span>
            </Link>

            <div className="flex items-center gap-3 sm:gap-4" suppressHydrationWarning>
              <span className="hidden flex-wrap items-center justify-between gap-2 rounded-full border border-border-dark bg-surface-dark/50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-300 sm:flex">
                <span className="text-[0.65rem] font-semibold text-gray-500">Role</span>
                <span className="text-white">{ROLE_LABEL[role]}</span>
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
