"use client";

import { useState, useCallback } from "react";
import { useWatchAsset, useConnectorClient } from "wagmi";
import type { TokenDto } from "@/services/tokens/token-service";

type UseAddTokenResult = {
  addToken: (token: TokenDto) => Promise<boolean>;
  isAdding: boolean;
  error: string | null;
};

export function useAddToken(): UseAddTokenResult {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useWatchAsset for adding tokens to wallet (MetaMask, etc.)
  const { watchAsset } = useWatchAsset();

  const addToken = useCallback(async (token: TokenDto): Promise<boolean> => {
    setIsAdding(true);
    setError(null);

    try {
      // Attempt to add token using wagmi's watchAsset
      const result = await watchAsset({
        type: "ERC20",
        options: {
          address: token.address as `0x${string}`,
          symbol: token.symbol,
          decimals: token.decimals,
          image: token.logoURI || undefined,
        },
      });

      return result;
    } catch (err: any) {
      console.error("Failed to add token to wallet:", err);

      // User-friendly error messages
      if (err.message?.includes("User rejected")) {
        setError("You rejected the request");
      } else if (err.message?.includes("Already added")) {
        setError("Token is already in your wallet");
      } else {
        setError(err.message || "Failed to add token to wallet");
      }

      return false;
    } finally {
      setIsAdding(false);
    }
  }, [watchAsset]);

  return {
    addToken,
    isAdding,
    error,
  };
}
