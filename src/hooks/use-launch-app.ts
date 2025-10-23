"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";

type AuthMeResponse = {
  user: {
    role: "USER" | "STREAMER" | "SUPERADMIN";
    profile?: { isComplete?: boolean | null } | null;
  } | null;
};

export function useLaunchApp() {
  const router = useRouter();
  const { status, user, isSigning } = useAuth();

  const onLaunch = useCallback(async () => {
    // Prefer server-backed session if available to avoid unnecessary SIWE on landing.
    try {
      const authRes = await fetch("/api/auth/me", { credentials: "include" });
      if (authRes.ok) {
        const authData = (await authRes.json()) as AuthMeResponse;
        const apiUser = authData.user;
        if (apiUser?.role === "SUPERADMIN") {
          router.push("/dashboard/admin");
          return;
        }
        const serverIsStreamer = apiUser?.role === "STREAMER";

        if (serverIsStreamer) {
          // Check latest profile completion from streamer endpoint
          let destination = "/dashboard/profile?onboarding=1";
          try {
            const profileRes = await fetch("/api/streamers/me", { credentials: "include" });
            if (profileRes.ok) {
              const data = (await profileRes.json()) as {
                profile: { isComplete?: boolean | null } | null;
              };
              if (data.profile?.isComplete) destination = "/dashboard";
            }
          } catch {
            // Ignore and fall back to onboarding profile
          }

          router.push(destination);
          return;
        }

        // Authenticated session but not a streamer → go to onboarding
        router.push("/onboarding");
        return;
      }
    } catch {
      // ignore and fall through to client-state based routing
    }

    // Fallback to client-state if server session not present
    if (status !== "authenticated" || !user) {
      router.push("/onboarding");
      return;
    }

    if (user.role === "SUPERADMIN") {
      router.push("/dashboard/admin");
      return;
    }
    const isStreamer = user.role === "STREAMER";
    if (!isStreamer) {
      router.push("/onboarding");
      return;
    }

    router.push(user.profile.isComplete ? "/dashboard" : "/dashboard/profile?onboarding=1");
  }, [router, status, user]);

  const label = useMemo(() => {
    if (isSigning) return "Check wallet";
    if (status === "loading") return "Launching...";
    if (status === "authenticated" && user?.profile.isComplete) return "Launch App";
    if (status === "authenticated") return "Continue setup";
    return "Launch App";
  }, [isSigning, status, user]);

  const disabled = status === "loading" || isSigning;

  return { onLaunch, label, disabled };
}
