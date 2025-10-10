"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";

type UserRole = "USER" | "STREAMER" | "SUPERADMIN";

type StreamerProfile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type AuthUser = {
  id: string;
  wallet: string;
  role: UserRole;
  chainId: number;
  streamerProfile: StreamerProfile | null;
  session?: {
    id: string;
    expiresAt: string;
  };
};

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

  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [isSigning, setIsSigning] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (!response.ok) {
        setUser(null);
        setStatus("unauthenticated");
        return;
      }

      const data = (await response.json()) as { user: AuthUser };
      setUser({
        ...data.user,
        session: data.user.session
          ? {
              id: data.user.session.id,
              expiresAt: data.user.session.expiresAt,
            }
          : undefined,
      });
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

        const data = (await verifyResponse.json()) as { user: AuthUser };
        setUser(data.user);
        setStatus("authenticated");
      } catch (error) {
        console.error("SIWE sign-in failed", error);
        throw error;
      } finally {
        setIsSigning(false);
      }
    },
    [address, chainId, signMessageAsync],
  );

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
