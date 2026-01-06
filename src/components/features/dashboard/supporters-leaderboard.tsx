"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type RangeValue = "1d" | "7d" | "1w" | "1m" | "ytd" | "1y" | "5y" | "all";
type CurrencyValue = "usd" | "idr";
type SortDirection = "asc" | "desc";

interface TokenBreakdown {
  tokenId: string | null;
  symbol: string | null;
  name: string | null;
  logoURI: string | null;
  decimals: number | null;
  amount: number;
  amountRaw: number;
}

interface SupporterEntry {
  wallet: string | null;
  displayName: string | null;
  totalAmount: number;
  donationCount: number;
  tokens: TokenBreakdown[];
}

interface LeaderboardResponse {
  supporters: SupporterEntry[];
  meta: {
    range: RangeValue;
    currency: CurrencyValue;
    sort: SortDirection;
    generatedAt: string;
  };
}

const RANGE_OPTIONS: Array<{ label: string; value: RangeValue }> = [
  { label: "1D", value: "1d" },
  { label: "7D", value: "7d" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "YTD", value: "ytd" },
  { label: "1Y", value: "1y" },
  { label: "5Y", value: "5y" },
  { label: "All", value: "all" },
];

const CURRENCY_OPTIONS: Array<{ label: string; value: CurrencyValue }> = [
  { label: "USD", value: "usd" },
  { label: "IDR", value: "idr" },
];

const currencyFormatter = (currency: CurrencyValue) =>
  new Intl.NumberFormat(currency === "usd" ? "en-US" : "id-ID", {
    style: "currency",
    currency: currency === "usd" ? "USD" : "IDR",
    maximumFractionDigits: currency === "usd" ? 2 : 0,
  });

const tokenAmountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
  minimumFractionDigits: 0,
});

function getRankBadgeClasses(index: number, isDescending: boolean) {
  const base =
    "flex items-center justify-center rounded-full font-bold transition-shadow shadow-sm border-2 border-black";

  if (!isDescending) {
    return cn(
      base,
      "h-9 w-9 bg-[var(--color-border-dark)] text-sm text-white",
    );
  }

  switch (index) {
    case 0:
      return cn(
        base,
        "h-12 w-12 bg-gradient-to-br from-[var(--color-secondary)] to-[#FB923C] text-base text-black shadow-lg",
      );
    case 1:
      return cn(
        base,
        "h-11 w-11 bg-gradient-to-br from-slate-300 to-slate-400 text-sm text-black shadow-md",
      );
    case 2:
      return cn(
        base,
        "h-10 w-10 bg-gradient-to-br from-orange-300 to-amber-400 text-sm text-black shadow-md",
      );
    default:
      return cn(
        base,
        "h-9 w-9 bg-[var(--color-border-dark)] text-sm text-white",
      );
  }
}

function formatWallet(address: string | null) {
  if (!address) return "Anonymous supporter";
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTokenName(token: TokenBreakdown) {
  return token.symbol ?? token.name ?? "Unknown token";
}

function useLeaderboardData(range: RangeValue, currency: CurrencyValue, sort: SortDirection) {
  const [data, setData] = useState<SupporterEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const search = new URLSearchParams({
          range,
          currency,
          sort,
        });
        const response = await fetch(`/api/leaderboard/supporters?${search.toString()}`, {
          signal: controller.signal,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load leaderboard");
        }

        const payload = (await response.json()) as LeaderboardResponse;
        setData(payload.supporters ?? []);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error(err);
        setError("Unable to load supporters right now. Please try again shortly.");
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    void run();

    return () => controller.abort();
  }, [range, currency, sort]);

  return {
    supporters: data,
    isLoading,
    error,
  };
}

export function SupportersLeaderboard() {
  const [range, setRange] = useState<RangeValue>("all");
  const [currency, setCurrency] = useState<CurrencyValue>("usd");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const { supporters, isLoading, error } = useLeaderboardData(range, currency, sortDirection);
  const formatter = useMemo(() => currencyFormatter(currency), [currency]);

  useEffect(() => {
    setExpandedKey(null);
  }, [range, currency, sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={option.value === range ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2 rounded-xl border-2 border-[var(--color-border-dark)] bg-[var(--color-surface-card)] p-1">
            {CURRENCY_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={option.value === currency ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrency(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={toggleSortDirection}>
            Sort {sortDirection === "desc" ? "\u2193" : "\u2191"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-[var(--color-border-dark)] bg-[var(--color-surface-card)] shadow-xl">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
            <p className="text-sm">Loading supporter rankings{"\u2026"}</p>
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 px-8 text-center text-sm text-[var(--color-primary)]">
            <p>{error}</p>
          </div>
        ) : supporters.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 px-8 text-center text-sm text-slate-400">
            <p>No donations found for the selected range yet.</p>
            <p>Share your link to see your top supporters here.</p>
          </div>
        ) : (
          <div className="space-y-4 px-4 py-5 sm:px-6">
            {supporters.map((supporter, index) => {
              const key = supporter.wallet ?? `anon-${index}`;
              const isExpanded = expandedKey === key;
              const rankBadgeClasses = getRankBadgeClasses(index, sortDirection === "desc");
              const trimmedDisplayName = supporter.displayName?.trim();
              const primaryLabel = trimmedDisplayName && trimmedDisplayName.length > 0
                ? trimmedDisplayName
                : formatWallet(supporter.wallet);

              return (
                <div
                  key={key}
                  className={cn(
                    "rounded-xl border-2 border-[var(--color-border-dark)] bg-[var(--color-surface-dark)] transition",
                    isExpanded ? "shadow-lg shadow-[var(--color-primary)]/20" : "hover:border-[var(--color-primary)]/50",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedKey(isExpanded ? null : key)}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <span className={rankBadgeClasses}>{index + 1}</span>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {primaryLabel}
                          {supporter.wallet ? (
                            <span className="ml-2 font-mono text-[11px] text-slate-500">
                              ({supporter.wallet})
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-slate-400">
                          {supporter.donationCount} donation{supporter.donationCount === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500">
                        {currency}
                      </span>
                      <span className="text-lg font-bold text-[var(--color-accent-cyan)]">
                        {formatter.format(supporter.totalAmount)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-[var(--color-primary)] transition" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-[var(--color-primary)] transition" />
                      )}
                    </div>
                  </button>

                  {isExpanded && supporter.tokens.length > 0 && (
                    <div className="border-t border-[var(--color-border-dark)] bg-[var(--color-surface-card)]/50 pb-4 pt-3">
                      <ul className="space-y-2 pl-12 pr-5">
                        {supporter.tokens.map((token) => (
                          <li
                            key={`${key}-${token.tokenId ?? token.symbol ?? token.name ?? "token"}`}
                            className="flex items-center justify-between gap-3 rounded-xl border-2 border-[var(--color-border-dark)] bg-[var(--color-surface-dark)] px-4 py-2 text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <TokenEmblem symbol={token.symbol} logoURI={token.logoURI} />
                              <div>
                                <p className="text-sm font-bold text-white">
                                  {formatTokenName(token)}
                                </p>
                                {token.name && token.symbol && token.name !== token.symbol && (
                                  <p className="text-xs text-slate-500">{token.name}</p>
                                )}
                              </div>
                            </div>
                            <div className="whitespace-nowrap text-sm font-bold text-[var(--color-accent-cyan)]">
                              {tokenAmountFormatter.format(token.amount)}{" "}
                              <span className="text-xs font-medium uppercase text-slate-400">
                                {token.symbol ?? token.name ?? ""}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function TokenEmblem({
  symbol,
  logoURI,
}: {
  symbol: string | null;
  logoURI: string | null;
}) {
  const initials = (symbol ?? "TOK").slice(0, 3).toUpperCase();
  return (
    <Avatar className="h-8 w-8 text-xs font-bold text-[var(--color-primary)] bg-[var(--color-border-dark)] border-2 border-[var(--color-border-dark)]" fallback={initials}>
      {logoURI ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoURI} alt={symbol ?? initials} className="h-full w-full rounded-full object-cover" />
      ) : null}
    </Avatar>
  );
}
