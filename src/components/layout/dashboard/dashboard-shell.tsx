"use client";

import { useEffect, useMemo, useState, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { NewDashboardSidebar } from "@/components/layout/dashboard/new-dashboard-sidebar";
import { NewDashboardHeader } from "@/components/layout/dashboard/new-dashboard-header";
import { useAuth } from "@/providers/auth-provider";
import { useAccount } from "wagmi";

interface DashboardShellProps {
  children: ReactNode;
}

// Navigation Progress Bar Component - Kubi Theme
function NavigationProgress({ isNavigating }: { isNavigating: boolean }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isNavigating) {
      setVisible(true);
      setProgress(0);

      // Simulate progress
      const timer1 = setTimeout(() => setProgress(30), 100);
      const timer2 = setTimeout(() => setProgress(60), 300);
      const timer3 = setTimeout(() => setProgress(80), 600);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      setProgress(100);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(hideTimer);
    }
  }, [isNavigating]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-primary via-accent-purple to-secondary transition-all duration-300 ease-out shadow-[0_0_10px_rgba(98,58,214,0.5)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, isSigning } = useAuth();
  const { isConnected } = useAccount();
  const [guardMessage, setGuardMessage] = useState<string | null>("Loading session...");
  const [deferRedirect, setDeferRedirect] = useState(false);
  const [hasPrimaryToken, setHasPrimaryToken] = useState<boolean | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const previousPathRef = useRef(pathname);
  const primaryTokenCheckedRef = useRef(false); // Cache to avoid repeated API calls

  const isDashboardRoute = useMemo(
    () => pathname?.startsWith("/dashboard") ?? false,
    [pathname],
  );
  const isProfileRoute = useMemo(
    () => pathname?.startsWith("/dashboard/profile") ?? false,
    [pathname],
  );
  const isAdminRoute = useMemo(
    () => pathname?.startsWith("/dashboard/admin") ?? false,
    [pathname],
  );

  // Track navigation between pages
  useEffect(() => {
    if (previousPathRef.current !== pathname) {
      setIsNavigating(true);
      previousPathRef.current = pathname;
      // Reset navigation state after a short delay
      const timer = setTimeout(() => setIsNavigating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Don't reset hasPrimaryToken on navigation - keep it cached
  // Only reset when user changes
  useEffect(() => {
    if (!user) {
      setHasPrimaryToken(null);
      primaryTokenCheckedRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isDashboardRoute) {
      setGuardMessage(null);
      return;
    }

    if (status === "loading" || isSigning) {
      setGuardMessage(isSigning ? "Awaiting wallet signature..." : "Loading your session...");
      return;
    }

    if (status === "unauthenticated" || !user) {
      if (isConnected && !isSigning && !deferRedirect) {
        setGuardMessage("Establishing session...");
        setDeferRedirect(true);
        const t = setTimeout(() => setDeferRedirect(false), 1200);
        return () => clearTimeout(t);
      }
      if (deferRedirect) {
        return;
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

    if (isAdmin && !isAdminRoute) {
      setGuardMessage("Redirecting to admin...");
      router.replace("/dashboard/admin");
      return;
    }

    if (isStreamer) {
      // Only check primary token once per session, not on every navigation
      if (hasPrimaryToken === null && !primaryTokenCheckedRef.current) {
        primaryTokenCheckedRef.current = true;
        setGuardMessage("Checking your setup...");
        void (async () => {
          try {
            const res = await fetch("/api/streamers/me", { credentials: "include" });
            if (!res.ok) throw new Error("Failed to verify streamer setup");
            type MePayload = {
              hasPrimaryToken?: boolean;
              hasPrimaryTokenId?: boolean;
              onboardingComplete?: boolean;
              streamer?: { primaryTokenId?: string | null } | null;
            };
            const data = (await res.json()) as MePayload;
            const computedHasToken =
              typeof data.hasPrimaryToken === "boolean"
                ? data.hasPrimaryToken
                : typeof data.hasPrimaryTokenId === "boolean"
                  ? data.hasPrimaryTokenId
                  : Boolean(data.streamer?.primaryTokenId);
            setHasPrimaryToken(computedHasToken);
          } catch {
            setHasPrimaryToken(false);
          }
        })();
        return;
      }

      // Wait for token check to complete
      if (hasPrimaryToken === null) {
        return;
      }

      const needsProfile = !user.profile.isComplete;
      const needsToken = !hasPrimaryToken;
      if ((needsProfile || needsToken) && !isProfileRoute) {
        // Build informative message about what's missing
        const missingItems = [];
        if (needsProfile) {
          missingItems.push("profile information");
        }
        if (needsToken) {
          missingItems.push("primary token");
        }

        const missingText = missingItems.join(" and ");
        setGuardMessage(`Please complete your ${missingText} to continue...`);
        router.replace("/dashboard/profile?onboarding=1");
        return;
      }
    }

    setGuardMessage(null);
  }, [isDashboardRoute, isProfileRoute, isAdminRoute, pathname, router, status, user, isSigning, isConnected, hasPrimaryToken, deferRedirect]);

  if (guardMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background-dark to-[#0f141e] pattern-dots-subtle">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-gray-400">{guardMessage}</p>
        </div>
      </div>
    );
  }

  const isOverlayEditor = pathname?.startsWith("/dashboard/overlay");

  return (
    <>
      <NavigationProgress isNavigating={isNavigating} />
      <div className="flex h-screen w-full bg-gradient-to-br from-background-dark to-[#0f141e] text-white font-body overflow-hidden">
        <NewDashboardSidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <NewDashboardHeader />
          <div className={`flex-1 overflow-y-auto ${isOverlayEditor ? "p-0" : "p-10"} pattern-dots-subtle`}>
            {isOverlayEditor ? (
              <div className="h-full w-full flex flex-col">{children}</div>
            ) : (
              <div className="max-w-7xl mx-auto flex flex-col gap-10">
                {children}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
