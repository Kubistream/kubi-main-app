"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  EarningsCurrency,
  EarningsOverviewResponse,
  EarningsTimeframe,
} from "@/types/earnings";

type UseEarningsOverviewResult = {
  data: EarningsOverviewResponse | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function useEarningsOverview(
  timeframe: EarningsTimeframe,
  currency: EarningsCurrency,
): UseEarningsOverviewResult {
  const [data, setData] = useState<EarningsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function run() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ timeframe, currency });
        const res = await fetch(`/api/earnings/primary?${params.toString()}`, {
          method: "GET",
          signal: controller.signal,
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const payload = (await res.json()) as EarningsOverviewResponse;
        if (cancelled) return;
        setData(payload);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load earnings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [timeframe, currency, reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { data, loading, error, reload };
}
