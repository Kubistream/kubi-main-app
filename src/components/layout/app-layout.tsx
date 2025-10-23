"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";
import { LandingNavbar } from "@/components/features/landing/landing-navbar";
import { brandPalette } from "@/constants/theme";
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
      className={cn(
        "flex min-h-screen flex-col",
        "bg-gradient-to-b from-rose-100 via-white to-rose-50 text-slate-900",
      )}
    >
      {isMarketingRoute ? (
        <LandingNavbar roleLabel={ROLE_LABEL[role]} />
      ) : (
        <header
          className="sticky top-0 z-50 border-b border-rose-200/70 backdrop-blur"
          style={{ backgroundColor: `${brandPalette.cream}CC` }}
        >
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 transition sm:h-20 sm:flex-nowrap sm:px-6">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="Kubi Home">
              <Image src="/assets/brand/logo2.png" alt="Kubi" width={100} height={100} />
            </Link>

            <div className="flex items-center gap-3 sm:gap-4">
              <span className="hidden flex-wrap items-center justify-between gap-2 rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-rose-500 sm:flex">
                <span className="text-[0.65rem] font-semibold text-rose-400">Role</span>
                <span className="text-slate-900">{ROLE_LABEL[role]}</span>
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
