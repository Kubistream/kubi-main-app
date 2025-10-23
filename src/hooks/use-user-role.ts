"use client";

import { usePathname } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";

export type UserRole = "streamer" | "supporter";

const STREAMER_PREFIXES = ["/dashboard", "/onboarding", "/overlay"] as const;
const SUPPORTER_PREFIXES = ["/donate"] as const;

const matchesPrefix = (pathname: string | null, prefixes: readonly string[]) => {
  if (!pathname) return false;
  return prefixes.some((prefix) => pathname.startsWith(prefix));
};

export function useUserRole(): UserRole {
  const pathname = usePathname();
  const { user } = useAuth();

  const routeRole = (() => {
    if (matchesPrefix(pathname, STREAMER_PREFIXES)) return "streamer" as const;
    if (matchesPrefix(pathname, SUPPORTER_PREFIXES)) return "supporter" as const;
    return null;
  })();

  if (routeRole) {
    return routeRole;
  }

  if (user?.role === "STREAMER" || user?.role === "SUPERADMIN") {
    return "streamer";
  }

  return "supporter";
}
