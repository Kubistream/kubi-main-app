"use client";

import { useCallback, useEffect, useState } from "react";

export type DashboardStats = {
    totalDonors: number;
    totalDonations: number;
    avgYieldApr: number | null;
    donorsGrowthPercent: number;
    donationsGrowthPercent: number;
};

type UseDashboardStatsResult = {
    data: DashboardStats | null;
    loading: boolean;
    error: string | null;
    reload: () => void;
};

export function useDashboardStats(): UseDashboardStatsResult {
    const [data, setData] = useState<DashboardStats | null>(null);
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
                const res = await fetch("/api/streamers/dashboard-stats", {
                    method: "GET",
                    signal: controller.signal,
                    credentials: "include",
                    cache: "no-store",
                });
                if (!res.ok) throw new Error(`Request failed: ${res.status}`);
                const payload = (await res.json()) as DashboardStats;
                if (cancelled) return;
                setData(payload);
            } catch (err: unknown) {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : "Failed to load stats");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        run();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [reloadToken]);

    const reload = useCallback(() => {
        setReloadToken((token) => token + 1);
    }, []);

    return { data, loading, error, reload };
}
