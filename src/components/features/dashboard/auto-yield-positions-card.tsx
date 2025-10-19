"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { fetchTokens, type TokenDto } from "@/services/tokens/token-service";

type AutoYieldPosition = {
  id: string;
  repSymbol: string;
  underlyingSymbol: string;
  underlyingLogo: string | null | undefined;
  protocol: string;
  growthPercent: number;
};

const FIXED_UNDERLYINGS: Array<{ key: string; protocol: string }> = [
  { key: "BitcoinKb", protocol: "Aave v3" },
  { key: "ETHkb", protocol: "Aave v3" },
  { key: "USDCkb", protocol: "Compound v3" },
];

export function AutoYieldPositionsCard() {
  const [tokens, setTokens] = useState<TokenDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await fetchTokens();
        if (mounted) setTokens(list);
      } catch (e) {
        if (mounted) setError("Failed to load tokens");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const positions = useMemo(() => buildDummyPositions(tokens), [tokens]);

  return (
    <section className="rounded-3xl border border-white/60 bg-white/90 px-8 py-8 shadow-[0_18px_32px_-26px_rgba(47,42,44,0.35)]">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-400">Auto Yield</p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-900">Subscribed representative tokens</h3>
        </div>
        <Link
          href="#"
          className="text-xs font-semibold text-rose-400 transition hover:text-rose-600"
          aria-disabled
        >
          View all
        </Link>
      </header>

      <div className="mt-6 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <PositionRowSkeleton key={i} />)
        ) : error ? (
          <p className="text-xs text-rose-500">{error}</p>
        ) : positions.length === 0 ? (
          <p className="text-xs text-slate-500">No positions yet. Connect lending to start earning auto yield.</p>
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

function buildDummyPositions(tokens: TokenDto[]): AutoYieldPosition[] {
  if (!Array.isArray(tokens) || tokens.length === 0) return [];

  const picked: Array<{ base: TokenDto; protocol: string }> = [];

  for (const pref of FIXED_UNDERLYINGS) {
    const t = findTokenByPreference(tokens, pref.key);
    if (t) picked.push({ base: t, protocol: pref.protocol });
  }

  if (picked.length === 0) {
    for (const t of tokens.slice(0, 3)) {
      picked.push({ base: t, protocol: "Aave v3" });
    }
  }

  return picked.map(({ base, protocol }) => {
    const repSymbol = `s${base.symbol}`;
    const growthPercent = deterministicGrowthPercent(repSymbol);
    return {
      id: `${base.chainId}:${base.address}:rep`,
      repSymbol,
      underlyingSymbol: base.symbol,
      underlyingLogo: base.logoURI ?? null,
      protocol,
      growthPercent,
    } satisfies AutoYieldPosition;
  });
}

function findTokenByPreference(tokens: TokenDto[], key: string): TokenDto | null {
  const wanted = key.toLowerCase();
  const exact = tokens.find((t) => t.symbol.toLowerCase() === wanted || (t.name ?? "").toLowerCase() === wanted);
  if (exact) return exact;
  const loose = tokens.find((t) => t.symbol.toLowerCase().includes(wanted) || (t.name ?? "").toLowerCase().includes(wanted));
  if (loose) return loose;
  if (wanted.includes("eth")) {
    const ethish = tokens.find((t) => /eth/i.test(t.symbol));
    if (ethish) return ethish;
  }
  if (wanted.includes("usdc")) {
    const usdcish = tokens.find((t) => /usdc/i.test(t.symbol));
    if (usdcish) return usdcish;
  }
  if (wanted.includes("btc") || wanted.includes("bitcoin")) {
    const btcish = tokens.find((t) => /btc/i.test(t.symbol) || /btc/i.test(t.name ?? ""));
    if (btcish) return btcish;
  }
  return null;
}

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
