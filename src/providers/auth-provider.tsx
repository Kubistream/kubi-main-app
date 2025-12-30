"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";

type UserRole = "USER" | "STREAMER" | "SUPERADMIN";

type StreamerProfile = {
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isComplete: boolean;
  completedAt: string | null;
};

type AuthUser = {
  id: string;
  wallet: string;
  role: UserRole;
  chainId?: number;
  streamerId: string | null;
  profile: StreamerProfile;
  session?: {
    id: string;
    expiresAt: string;
  };
};

type AuthUserApiResponse = Omit<AuthUser, "profile" | "session"> & {
  profile?: Partial<StreamerProfile> | null;
  session?: {
    id: string;
    expiresAt: string | Date;
  } | null;
};

const normalizeProfile = (profile: Partial<StreamerProfile> | null | undefined): StreamerProfile => ({
  username: profile?.username ?? null,
  displayName: profile?.displayName ?? null,
  avatarUrl: profile?.avatarUrl ?? null,
  bio: profile?.bio ?? null,
  isComplete: Boolean(profile?.isComplete),
  completedAt: profile?.completedAt ?? null,
});

const normalizeSession = (session: AuthUserApiResponse["session"]) => {
  if (!session) return undefined;
  return {
    id: session.id,
    expiresAt:
      typeof session.expiresAt === "string"
        ? session.expiresAt
        : new Date(session.expiresAt).toISOString(),
  };
};

const normalizeAuthUser = (apiUser: AuthUserApiResponse): AuthUser => ({
  id: apiUser.id,
  wallet: apiUser.wallet,
  role: apiUser.role,
  chainId: apiUser.chainId,
  streamerId: apiUser.streamerId ?? null,
  profile: normalizeProfile(apiUser.profile),
  session: normalizeSession(apiUser.session),
});

interface AuthContextValue {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  isSigning: boolean;
  signIn: (options?: { createStreamerProfile?: boolean }) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const statement = "Sign in with Ethereum to manage your Kubi creator account.";
const defaultAppUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, chainId } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [isSigning, setIsSigning] = useState(false);
  const isSigningRef = useRef(false);
  useEffect(() => {
    isSigningRef.current = isSigning;
  }, [isSigning]);

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (!response.ok) {
        setUser(null);
        setStatus("unauthenticated");
        return;
      }

      const data = (await response.json()) as { user: AuthUserApiResponse | null };
      if (!data.user) {
        setUser(null);
        setStatus("unauthenticated");
        return;
      }

      setUser(normalizeAuthUser(data.user));
      setStatus("authenticated");
    } catch (error) {
      console.error("Failed to load authenticated user", error);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (!address) {
      if (user) {
        setUser(null);
      }
      if (status === "authenticated") {
        setStatus("unauthenticated");
      }
      return;
    }

    if (user && user.wallet.toLowerCase() !== address.toLowerCase()) {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, [address, status, user]);

  const signIn = useCallback(
    async (options?: { createStreamerProfile?: boolean }) => {
      if (!address || !chainId) {
        throw new Error("Connect your wallet before attempting to sign in.");
      }

      setIsSigning(true);
      isSigningRef.current = true;

      try {
        const nonceResponse = await fetch("/api/auth/nonce", {
          credentials: "include",
        });

        if (!nonceResponse.ok) {
          throw new Error("Failed to request SIWE nonce");
        }

        const { nonce } = (await nonceResponse.json()) as { nonce: string };
        const message = new SiweMessage({
          domain: window.location.host,
          address,
          statement,
          uri: defaultAppUrl,
          version: "1",
          chainId,
          nonce,
        });

        const preparedMessage = message.prepareMessage();
        const signature = await signMessageAsync({ message: preparedMessage });

        const verifyResponse = await fetch("/api/auth/verify", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: preparedMessage,
            signature,
            createStreamerProfile: options?.createStreamerProfile ?? false,
          }),
        });

        if (!verifyResponse.ok) {
          const errorPayload = await verifyResponse.json().catch(() => ({ error: "" }));
          throw new Error(errorPayload.error || "Failed to verify SIWE signature");
        }

        // Validate that Set-Cookie from verify actually established a session.
        // We read back /api/auth/me and synchronise client auth explicitly.
        const meResponse = await fetch("/api/auth/me", { credentials: "include" });
        if (!meResponse.ok) {
          throw new Error("Session not established after signature. Please try again.");
        }
        const meData = (await meResponse.json()) as { user: AuthUserApiResponse | null };
        if (!meData.user) {
          throw new Error("Signed but no session was found. Please retry.");
        }
        setUser(normalizeAuthUser(meData.user));
        setStatus("authenticated");
      } catch (error) {
        console.error("SIWE sign-in failed", error);
        throw error;
      } finally {
        setIsSigning(false);
        isSigningRef.current = false;
      }
    },
    [address, chainId, signMessageAsync],
  );

  // Centralized auto sign-in with strong de-duplication guards.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!address) {
      // Allow auto sign-in again if user disconnects.
      return;
    }
    if (status !== "unauthenticated") return;
    if (isSigningRef.current) return;

    // Skip auto sign-in on landing/marketing and onboarding page
    // (onboarding has its own flow with progress indicator)
    if (pathname === "/" || pathname?.startsWith("/landing") || pathname?.startsWith("/onboarding")) return;

    // Deduplicate by address to avoid blocking sign-in after address switch.
    const AUTO_KEY = address ? `kubi:siwe:auto:${address.toLowerCase()}` : "kubi:siwe:auto";
    if (sessionStorage.getItem(AUTO_KEY) === "1") return;

    sessionStorage.setItem(AUTO_KEY, "1");

    // Fire and forget; provider-level lock prevents parallel prompts.
    signIn().catch((error) => {
      console.error("Automatic SIWE sign-in failed", error);
      // allow retry if it failed
      sessionStorage.removeItem(AUTO_KEY);
    });
  }, [address, status, signIn, pathname]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Failed to logout", error);
    }

    setUser(null);
    setStatus("unauthenticated");

    try {
      if (disconnectAsync) {
        await disconnectAsync();
      }
    } catch (error) {
      console.error("Failed to disconnect wallet", error);
    }
  }, [disconnectAsync]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isSigning,
      signIn,
      signOut,
      refresh: fetchSession,
    }),
    [fetchSession, isSigning, signIn, signOut, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
