"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { useWallet } from "@/hooks/use-wallet";
import { getProfile } from "@/services/streamers/profile-service";

export type UserRole = "streamer" | "supporter";

const STREAMER_PREFIXES = ["/dashboard", "/onboarding", "/overlay"] as const;
const SUPPORTER_PREFIXES = ["/donate"] as const;

const matchesPrefix = (pathname: string | null, prefixes: readonly string[]) => {
  if (!pathname) return false;
  return prefixes.some((prefix) => pathname.startsWith(prefix));
};

export function useUserRole(): UserRole {
  const { address } = useWallet();
  const pathname = usePathname();
  const [hasStreamerProfile, setHasStreamerProfile] = useState(false);

  useEffect(() => {
    if (!address) {
      setHasStreamerProfile(false);
      return;
    }

    try {
      const profile = getProfile(address);
      setHasStreamerProfile(Boolean(profile));
    } catch (error) {
      console.error("Failed to load streamer profile", error);
      setHasStreamerProfile(false);
    }
  }, [address]);

  const routeRole = useMemo(() => {
    if (matchesPrefix(pathname, STREAMER_PREFIXES)) return "streamer" as const;
    if (matchesPrefix(pathname, SUPPORTER_PREFIXES)) return "supporter" as const;
    return null;
  }, [pathname]);

  if (routeRole) {
    return routeRole;
  }

  if (hasStreamerProfile) {
    return "streamer";
  }

  return "supporter";
}
