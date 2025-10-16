"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { useEarningsOverview } from "@/hooks/use-earnings-overview";
import { cn } from "@/lib/utils";
import { formatTokenAmount } from "@/lib/format/token-amount";
import {
  EARNINGS_CURRENCIES,
  EARNINGS_TIMEFRAMES,
  type EarningsTokenSummary,
} from "@/types/earnings";

const TIMEFRAMES = EARNINGS_TIMEFRAMES;
type Timeframe = (typeof TIMEFRAMES)[number];

const CURRENCIES = EARNINGS_CURRENCIES;
type Currency = (typeof CURRENCIES)[number];

export function EarningsOverviewCard() {
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [currency, setCurrency] = useState<Currency>("USD");
  const sparklineContainerRef = useRef<HTMLDivElement | null>(null);
  const [sparklineWidth, setSparklineWidth] = useState<number>(320);
  const sparklineHeight = 160;

  const { data, loading, error } = useEarningsOverview(timeframe, currency);

  const primaryTotal = data?.primaryTotal ?? "0";
  const growthPercent = data?.growthPercent ?? 0;
  const primaryToken = data?.primaryToken ?? null;
  const otherTokens = data?.tokenBreakdown ?? [];

  useEffect(() => {
    if (!sparklineContainerRef.current || typeof ResizeObserver === "undefined") return;
    const element = sparklineContainerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const nextWidth = Math.round(entry.contentRect.width);
        if (nextWidth > 0) {
          setSparklineWidth((prev) => (Math.abs(prev - nextWidth) > 1 ? nextWidth : prev));
        }
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const sparkValues = useMemo(() => {
    const points = data?.sparkline ?? [];
    return points.map((point) => safeNumeric(point.v));
  }, [data?.sparkline]);

  const { linePath, areaPath } = useMemo(
    () => buildSparklinePaths(sparkValues, sparklineWidth, sparklineHeight),
    [sparkValues, sparklineWidth],
  );

  const primaryTotalFormatted = useMemo(
    () => formatFiat(primaryTotal, currency),
    [primaryTotal, currency],
  );

  const subtitle = currency === "USD" ? "Total earnings in USD" : "Total earnings in IDR";

  return (
    <section className="rounded-3xl border border-white/60 bg-white/90 px-8 py-10 shadow-[0_24px_48px_-30px_rgba(47,42,44,0.45)]">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-400">Total earnings</p>
          <h3 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-[2.1rem]">Track your growth</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-rose-400">
            <label className="mr-2 hidden sm:inline" htmlFor="currency">Currency</label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="rounded-full bg-white px-3 py-1 text-rose-500 shadow-sm shadow-rose-200 focus:outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-rose-400">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "rounded-full px-3 py-1",
                  tf === timeframe
                    ? "bg-white text-rose-500 shadow-sm shadow-rose-200"
                    : "text-rose-300 hover:text-rose-500",
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.7fr,1fr]">
        <div className="space-y-6">
          <div className="space-y-6 rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-rose-100 px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">Total Earnings</p>
                <p className="text-sm text-slate-500">{subtitle}</p>
              </div>
              <GrowthBadge value={growthPercent} loading={loading} />
            </div>
            <div>
              <p className="text-4xl font-semibold text-[#FF6D6D]">
                {loading ? (currency === "USD" ? "$—" : "Rp —") : primaryTotalFormatted}
              </p>
              <div ref={sparklineContainerRef} className="mt-8">
                <Sparkline
                  ariaLabel="Primary earnings trend"
                  linePath={linePath}
                  areaPath={areaPath}
                  width={sparklineWidth}
                  height={sparklineHeight}
                />
              </div>
              {error && (
                <p className="mt-2 text-xs text-rose-500">{error}</p>
              )}
            </div>
          </div>

          <PrimaryTokenHighlightCard token={primaryToken} currency={currency} loading={loading} />

          <TokenBreakdownCard tokens={otherTokens} currency={currency} loading={loading} />
        </div>

        {/* <div className="space-y-4">
          <div className="rounded-3xl border border-rose-100 bg-white px-6 py-6 shadow-sm shadow-rose-200/40">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-300">Secondary</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 opacity-50">Coming soon</p>
            <p className="mt-2 text-xs text-slate-500">Breakdown by other tokens will appear here.</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 px-6 py-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">Payout health</p>
            <p className="mt-2 text-lg font-semibold text-emerald-700">All good — last withdrawal cleared 2h ago.</p>
            <p className="mt-1 text-xs text-emerald-600/80">Next auto-withdrawal once you reach 3.0 wETH.</p>
          </div>
        </div> */}
      </div>
    </section>
  );
}

function PrimaryTokenHighlightCard({
  token,
  currency,
  loading,
}: {
  token: EarningsTokenSummary | null;
  currency: Currency;
  loading: boolean;
}) {
  if (!token) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-white px-6 py-6 shadow-sm shadow-rose-200/40">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-300">Primary token</p>
        <p className="mt-3 text-sm text-slate-500">
          {loading ? "Loading primary token earnings…" : "Set a primary token to start tracking token earnings."}
        </p>
      </div>
    );
  }

  const fiatFormatted = formatFiat(token.fiatValue, currency);
  const amountFormatted = `${formatTokenAmount(token.amount, token.decimals)} ${token.symbol}`;

  return (
    <div className="rounded-3xl border border-rose-100 bg-white px-6 py-6 shadow-sm shadow-rose-200/40">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <TokenAvatar symbol={token.symbol} logoURI={token.logoURI} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-300">Primary token</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{loading ? "—" : amountFormatted}</p>
            <p className="mt-1 text-xs text-slate-500">{loading ? "—" : `${fiatFormatted} total`}</p>
          </div>
        </div>
        <GrowthBadge value={token.growthPercent} loading={loading} compact />
      </div>
    </div>
  );
}

function TokenBreakdownCard({
  tokens,
  currency,
  loading,
}: {
  tokens: EarningsTokenSummary[];
  currency: Currency;
  loading: boolean;
}) {
  return (
    <div className="rounded-3xl border border-rose-100 bg-white px-6 py-6 shadow-sm shadow-rose-200/40">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-300">Others</p>
        <Link
          href="/dashboard/history"
          className="text-xs font-semibold text-rose-400 transition hover:text-rose-600"
        >
          See more
        </Link>
      </div>
      <div className="mt-4 space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <TokenRowSkeleton key={index} />)
        ) : tokens.length === 0 ? (
          <p className="text-xs text-slate-500">No other token earnings yet.</p>
        ) : (
          tokens.map((token) => (
            <TokenRow key={token.tokenId} token={token} currency={currency} />
          ))
        )}
      </div>
    </div>
  );
}

function TokenRow({
  token,
  currency,
}: {
  token: EarningsTokenSummary;
  currency: Currency;
}) {
  const fiatFormatted = formatFiat(token.fiatValue, currency);
  const amountFormatted = `${formatTokenAmount(token.amount, token.decimals)} ${token.symbol}`;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-rose-100 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-3">
        <TokenAvatar symbol={token.symbol} logoURI={token.logoURI} className="h-9 w-9 text-sm" />
        <div>
          <p className="text-sm font-semibold text-slate-900">{token.symbol}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span>{fiatFormatted}</span>
            <TokenGrowthTag value={token.growthPercent} />
          </div>
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">{amountFormatted}</p>
    </div>
  );
}

function TokenRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-rose-100 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-rose-100/60 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-rose-100/60 animate-pulse" />
          <div className="h-3 w-28 rounded bg-rose-50 animate-pulse" />
        </div>
      </div>
      <div className="h-3 w-16 rounded bg-rose-50 animate-pulse" />
    </div>
  );
}

function TokenAvatar({
  symbol,
  logoURI,
  className,
}: {
  symbol: string;
  logoURI: string | null;
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

function GrowthBadge({
  value,
  loading,
  compact = false,
  className,
}: {
  value: number;
  loading?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const meta = getGrowthMeta(value);
  return (
    <div
      className={cn(
        compact
          ? "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
          : "flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
        meta.background,
        meta.text,
        className,
      )}
    >
      <span aria-hidden="true">{loading ? "…" : meta.icon}</span>
      {loading ? "—" : `${Math.abs(value)}%`}
    </div>
  );
}

function TokenGrowthTag({ value }: { value: number }) {
  const meta = getGrowthMeta(value);
  return (
    <span className={cn("flex items-center gap-1 text-xs font-semibold", meta.text)}>
      <span aria-hidden="true">{meta.icon}</span>
      {`${Math.abs(value)}%`}
    </span>
  );
}

function Sparkline({
  ariaLabel,
  linePath,
  areaPath,
  width,
  height,
}: {
  ariaLabel: string;
  linePath: string;
  areaPath: string;
  width: number;
  height: number;
}) {
  const viewWidth = Math.max(width, 1);
  const viewHeight = Math.max(height, 1);
  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      className="w-full"
      preserveAspectRatio="none"
      style={{ height }}
    >
      <defs>
        <linearGradient id="sparklineGradient" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor="#FFB15A" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FF3D86" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="sparklineStroke" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor="#FFB15A" />
          <stop offset="100%" stopColor="#FF3D86" />
        </linearGradient>
      </defs>
      <path d={linePath} stroke="url(#sparklineStroke)" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d={areaPath} fill="url(#sparklineGradient)" />
    </svg>
  );
}

function buildSparklinePaths(values: number[], width = 320, height = 120) {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);

  if (!values || values.length === 0) {
    const midY = safeHeight * 0.75;
    const linePath = `M0 ${midY} L ${safeWidth} ${midY}`;
    const areaPath = `M0 ${midY} L ${safeWidth} ${midY} L ${safeWidth} ${safeHeight} L 0 ${safeHeight} Z`;
    return { linePath, areaPath };
  }
  const n = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = n > 1 ? safeWidth / (n - 1) : safeWidth;
  const points = values.map((v, i) => {
    const x = Math.round(i * stepX);
    const norm = (v - min) / range;
    const y = Math.round(safeHeight - norm * safeHeight);
    return { x, y };
  });
  const linePath = points.reduce((acc, p, i) => acc + (i === 0 ? `M${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), "");
  const areaPath = `${linePath} L ${safeWidth} ${safeHeight} L 0 ${safeHeight} Z`;
  return { linePath, areaPath };
}

function formatFiat(value: string | null | undefined, currency: Currency) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) {
    return currency === "USD" ? "$0.00" : "Rp 0";
  }
  const formatter = new Intl.NumberFormat(currency === "USD" ? "en-US" : "id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "USD" ? 2 : 0,
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  });
  return formatter.format(amount);
}

function safeNumeric(value: string | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function getGrowthMeta(value: number) {
  if (value > 0) {
    return { icon: "▲", background: "bg-emerald-100", text: "text-emerald-600" };
  }
  if (value < 0) {
    return { icon: "▼", background: "bg-rose-100", text: "text-rose-500" };
  }
  return { icon: "→", background: "bg-slate-100", text: "text-slate-500" };
}
