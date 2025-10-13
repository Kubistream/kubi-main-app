"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/providers/auth-provider";
import { useWallet } from "@/hooks/use-wallet";
import {
  fetchStreamerProfile,
  type StreamerProfile,
} from "@/services/streamers/profile-service";

interface UseStreamerProfileResult {
  profile: StreamerProfile | null;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useStreamerProfile(): UseStreamerProfileResult {
  const { status } = useAuth();
  const { isConnected } = useWallet();

  const [profile, setProfile] = useState<StreamerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!isConnected || status !== "authenticated") {
      setProfile(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextProfile = await fetchStreamerProfile();
      setProfile(nextProfile);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    profile,
    isConnected: isConnected && status === "authenticated",
    isLoading,
    error,
    refresh,
  };
}
