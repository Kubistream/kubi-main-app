"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { DashboardNavbar } from "@/components/layout/dashboard/dashboard-navbar";
import { DashboardSidebar } from "@/components/layout/dashboard/dashboard-sidebar";
import { DashboardFooter } from "@/components/layout/dashboard/dashboard-footer";
import { useAuth } from "@/providers/auth-provider";
import { useAccount } from "wagmi";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, isSigning } = useAuth();
  const { isConnected } = useAccount();
  const [guardMessage, setGuardMessage] = useState<string | null>("Loading session...");
  const [deferRedirect, setDeferRedirect] = useState(false);
  const [hasPrimaryToken, setHasPrimaryToken] = useState<boolean | null>(null);

  const isDashboardRoute = useMemo(
    () => pathname?.startsWith("/dashboard") ?? false,
    [pathname],
  );
  const isProfileRoute = useMemo(
    () => pathname?.startsWith("/dashboard/profile") ?? false,
    [pathname],
  );

  useEffect(() => {
    if (!isDashboardRoute) {
      setGuardMessage(null);
      setHasPrimaryToken(null);
      return;
    }

    if (status === "loading" || isSigning) {
      setGuardMessage(isSigning ? "Awaiting wallet signature..." : "Loading your session...");
      return;
    }

    if (status === "unauthenticated" || !user) {
      // If wallet is connected, give auto-SIWE a brief window to complete
      // before redirecting back to onboarding to avoid redirect loops.
      if (isConnected && !isSigning) {
        setGuardMessage("Establishing session...");
        setDeferRedirect(true);
        const t = setTimeout(() => setDeferRedirect(false), 1200);
        return () => clearTimeout(t);
      }
      setGuardMessage("Redirecting to onboarding...");
      router.replace("/onboarding");
      return;
    }

    const isStreamer = user.role === "STREAMER";
    const isAdmin = user.role === "SUPERADMIN";

    if (!isStreamer && !isAdmin) {
      setGuardMessage("Redirecting to onboarding...");
      router.replace("/onboarding");
      return;
    }

    // For streamers, ensure both profile and primary token are set
    if (isStreamer) {
      // If we haven't checked token readiness yet, fetch it
      if (hasPrimaryToken === null) {
        setGuardMessage("Checking your setup...");
        void (async () => {
          try {
            const res = await fetch("/api/streamers/me", { credentials: "include" });
            if (!res.ok) throw new Error("Failed to verify streamer setup");
            const data = (await res.json()) as { hasPrimaryToken?: boolean };
            setHasPrimaryToken(Boolean(data.hasPrimaryToken));
          } catch {
            setHasPrimaryToken(false);
          }
        })();
        return;
      }

      const needsProfile = !user.profile.isComplete;
      const needsToken = !hasPrimaryToken;
      if ((needsProfile || needsToken) && !isProfileRoute) {
        setGuardMessage("Redirecting to profile setup...");
        router.replace("/dashboard/profile?onboarding=1");
        return;
      }
    }

    setGuardMessage(null);
  }, [isDashboardRoute, isProfileRoute, pathname, router, status, user, isSigning, isConnected, hasPrimaryToken]);

  if (guardMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-sm text-slate-300">{guardMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-900">
      <DashboardSidebar />
      <div className="flex min-h-screen flex-1 flex-col bg-gradient-to-b from-[#FFF1E4] via-white to-[#FFF7F7]">
        <DashboardNavbar />
        <main className="flex-1 overflow-y-auto px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="mx-auto w-full max-w-6xl">
            {children}
          </div>
        </main>
        <DashboardFooter />
      </div>
    </div>
  );
}
