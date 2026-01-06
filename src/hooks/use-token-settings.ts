"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/providers/auth-provider";
import { useWallet } from "@/hooks/use-wallet";
import {
  fetchTokenSettings,
  updateTokenSettings,
  type StreamerTokenSettings,
} from "@/services/streamers/token-settings-service";
import { fetchTokens, type TokenDto } from "@/services/tokens/token-service";

type UseTokenSettings = {
  tokens: TokenDto[];
  settings: StreamerTokenSettings | null;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  save: (s: StreamerTokenSettings) => Promise<StreamerTokenSettings>;
};

export function useTokenSettings(): UseTokenSettings {
  const { status } = useAuth();
  const { isConnected } = useWallet();

  const [tokens, setTokens] = useState<TokenDto[]>([]);
  const [settings, setSettings] = useState<StreamerTokenSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!isConnected || status !== "authenticated") {
      setTokens([]);
      setSettings(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [tokensResult, settingsResult] = await Promise.allSettled([
        fetchTokens(),
        fetchTokenSettings(),
      ]);

      if (tokensResult.status === "fulfilled") {
        setTokens(tokensResult.value);
      } else {
        console.error("fetchTokens rejected:", tokensResult.reason);
        // We can choose to set error here or just log it
        // setError(tokensResult.reason as Error); 
      }

      if (settingsResult.status === "fulfilled") {
        setSettings(settingsResult.value);
      } else {
        console.error("fetchTokenSettings rejected:", settingsResult.reason);
      }

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

  const save = useCallback(async (s: StreamerTokenSettings) => {
    const next = await updateTokenSettings(s);
    setSettings(next);
    return next;
  }, []);

  return {
    tokens,
    settings,
    isConnected: isConnected && status === "authenticated",
    isLoading,
    error,
    refresh,
    save,
  };
}

