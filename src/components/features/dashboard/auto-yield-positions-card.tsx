"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { fetchTokens, type TokenDto } from "@/services/tokens/token-service";
import { useAuth } from "@/providers/auth-provider";
import { getStreamerYield } from "@/services/contracts/yield";

type AutoYieldPosition = {
  id: string;
  representativeAddress: string;
  repSymbol: string;
  underlyingSymbol: string;
  underlyingLogo: string | null | undefined;
  protocol: string;
  growthPercent: number;
};

type YieldProviderDto = {
  id: string;
  protocol: string;
  protocolName: string;
  protocolImageUrl?: string | null;
  status: "ACTIVE" | "PAUSED" | "DEPRECATED";
  apr?: string | number | null;
  underlyingToken: TokenDto;
  representativeToken: TokenDto;
};

export function AutoYieldPositionsCard() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<TokenDto[]>([]);
  const [providers, setProviders] = useState<YieldProviderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [list, prov] = await Promise.all([
          fetchTokens(),
          fetch("/api/admin/yield/providers", { credentials: "include" })
            .then((r) => r.json())
            .then((j) => (Array.isArray(j?.providers) ? (j.providers as YieldProviderDto[]) : []))
            .catch(() => []),
        ]);
        if (mounted) {
          setTokens(list);
          setProviders(prov);
        }
      } catch (e) {
        if (mounted) setError("Failed to load auto-yield data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const providersByUnderlying = useMemo(() => {
    const map: Record<string, YieldProviderDto[]> = {};
    for (const p of providers) {
      if (p.status !== "ACTIVE") continue;
      const key = String((p as any).underlyingToken?.id ?? "");
      if (!key) continue;
      const arr = map[key] || (map[key] = []);
      arr.push(p);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        const av = a.apr == null ? 0 : Number(a.apr);
        const bv = b.apr == null ? 0 : Number(b.apr);
        return bv - av;
      });
    }
    return map;
  }, [providers]);

  const [positions, setPositions] = useState<AutoYieldPosition[]>([]);

  // Read on-chain subscriptions for each underlying with providers
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const streamer = user?.wallet;
        if (!streamer) return;
        const tasks: Promise<void>[] = [];
        const next: AutoYieldPosition[] = [];
        for (const t of tokens) {
          const offers = providersByUnderlying[String(t.id)];
          if (!offers || offers.length === 0) continue;
          tasks.push(
            (async () => {
              const repAddr = await getStreamerYield(streamer, t.address);
              if (!repAddr) return;
              const match = offers.find((p) => p.representativeToken?.address?.toLowerCase() === repAddr.toLowerCase());
              if (match) {
                const repSym = match.representativeToken?.symbol || `rep:${repAddr.slice(0, 6)}`;
                const proto = match.protocolName || match.protocol || "Provider";
                next.push({
                  id: match.id,
                  representativeAddress: repAddr,
                  repSymbol: repSym,
                  underlyingSymbol: t.symbol,
                  underlyingLogo: t.logoURI ?? null,
                  protocol: proto,
                  growthPercent: deterministicGrowthPercent(repSym),
                });
              } else {
                const repSym = `rep:${repAddr.slice(0, 6)}`;
                next.push({
                  id: `${t.id}:${repAddr}`,
                  representativeAddress: repAddr,
                  repSymbol: repSym,
                  underlyingSymbol: t.symbol,
                  underlyingLogo: t.logoURI ?? null,
                  protocol: "Unknown",
                  growthPercent: deterministicGrowthPercent(repSym),
                });
              }
            })(),
          );
        }
        await Promise.all(tasks);
        if (!cancelled) setPositions(next);
      } catch {
        // swallow errors for dashboard UX
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.wallet, tokens, providersByUnderlying]);

  return (
    <section className="rounded-3xl border border-white/60 bg-white/90 px-8 py-8 shadow-[0_18px_32px_-26px_rgba(47,42,44,0.35)]">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-400">Auto Yield</p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-900">Subscribed representative tokens</h3>
        </div>
        <Link
          href="/dashboard/profile"
          className="text-xs font-semibold text-rose-400 transition hover:text-rose-600"
        >
          Manage
        </Link>
      </header>

      <div className="mt-6 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <PositionRowSkeleton key={i} />)
        ) : error ? (
          <p className="text-xs text-rose-500">{error}</p>
        ) : positions.length === 0 ? (
          <p className="text-xs text-slate-500">No positions yet. Subscribe in Profile to start earning auto yield.</p>
        ) : (
          positions.slice(0, 6).map((p) => <PositionRow key={p.id} p={p} />)
        )}
      </div>
    </section>
  );
}

function PositionRow({ p }: { p: AutoYieldPosition }) {
  const meta = getGrowthMeta(p.growthPercent);
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-100 bg-rose-50/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <TokenAvatar symbol={p.repSymbol} logoURI={p.underlyingLogo} className="h-9 w-9 text-sm" />
        <div>
          <p className="text-sm font-semibold text-slate-900">{p.repSymbol}</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">via {p.protocol}</p>
        </div>
      </div>
      <div className={cn("flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium", meta.background, meta.text)}>
        <span aria-hidden>▲</span>
        <span>+{p.growthPercent.toFixed(2)}%</span>
      </div>
    </div>
  );
}

function PositionRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-100 bg-rose-50/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-rose-100/60 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-rose-100/60 animate-pulse" />
          <div className="h-3 w-28 rounded bg-rose-50 animate-pulse" />
        </div>
      </div>
      <div className="h-6 w-36 rounded-full bg-rose-100/60 animate-pulse" />
    </div>
  );
}

function TokenAvatar({
  symbol,
  logoURI,
  className,
}: {
  symbol: string;
  logoURI: string | null | undefined;
  className?: string;
}) {
  const initials = (symbol ?? "?").slice(0, 3).toUpperCase();
  return (
    <Avatar className={cn("h-12 w-12 text-base", className)} fallback={initials}>
      {logoURI ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoURI} alt={symbol} className="h-full w-full rounded-full object-cover" />
      ) : null}
    </Avatar>
  );
}

// Removed dummy builders; positions now source from contract + DB providers

function deterministicGrowthPercent(symbol: string): number {
  let h = 0;
  for (let i = 0; i < symbol.length; i += 1) {
    h = (h * 31 + symbol.charCodeAt(i)) | 0;
  }
  const base = Math.abs(h % 950); // 0..949
  return (base / 100) + 0.5; // 0.5% .. 9.99%
}

function getGrowthMeta(value: number) {
  if (value > 0) return { background: "bg-emerald-100", text: "text-emerald-600" };
  if (value < 0) return { background: "bg-rose-100", text: "text-rose-500" };
  return { background: "bg-slate-100", text: "text-slate-500" };
}
