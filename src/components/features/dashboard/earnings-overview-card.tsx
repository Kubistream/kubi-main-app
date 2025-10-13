import { cn } from "@/lib/utils";

const TIMEFRAMES = ["1D", "7D", "30D", "All"] as const;

interface EarningsOverviewCardProps {
  primaryTotal?: string;
  secondaryTotal?: string;
  growthPercent?: number;
}

export function EarningsOverviewCard({
  primaryTotal = "1.830 wETH",
  secondaryTotal = "0.642 wETH",
  growthPercent = 10,
}: EarningsOverviewCardProps) {
  return (
    <section className="rounded-3xl border border-white/60 bg-white/90 px-8 py-10 shadow-[0_24px_48px_-30px_rgba(47,42,44,0.45)]">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-400">Total earnings</p>
          <h3 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-[2.1rem]">Track your growth</h3>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-rose-400">
          {TIMEFRAMES.map((timeframe) => (
            <span
              key={timeframe}
              className={cn(
                "rounded-full px-3 py-1",
                timeframe === "1D"
                  ? "bg-white text-rose-500 shadow-sm shadow-rose-200"
                  : "text-rose-300",
              )}
            >
              {timeframe}
            </span>
          ))}
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.7fr,1fr]">
        <div className="space-y-6 rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-rose-100 px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-900">Primary</p>
              <p className="text-sm text-slate-500">Direct tips in wETH</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
              <span aria-hidden="true">▲</span>
              {growthPercent}%
            </div>
          </div>
          <div>
            <p className="text-4xl font-semibold text-[#FF6D6D]">{primaryTotal}</p>
            <Sparkline ariaLabel="Primary earnings trend" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-rose-100 bg-white px-6 py-6 shadow-sm shadow-rose-200/40">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-300">Secondary</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{secondaryTotal}</p>
            <p className="mt-2 text-xs text-slate-500">Stablecoins, subscriptions, and partner boosts.</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 px-6 py-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">Payout health</p>
            <p className="mt-2 text-lg font-semibold text-emerald-700">All good — last withdrawal cleared 2h ago.</p>
            <p className="mt-1 text-xs text-emerald-600/80">Next auto-withdrawal once you reach 3.0 wETH.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Sparkline({ ariaLabel }: { ariaLabel: string }) {
  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox="0 0 320 120"
      className="mt-6 h-24 w-full"
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
      <path
        d="M0 95 C 45 80, 90 110, 135 70 C 180 40, 225 85, 270 60 C 300 45, 320 55, 320 55"
        stroke="url(#sparklineStroke)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M0 95 C 45 80, 90 110, 135 70 C 180 40, 225 85, 270 60 C 300 45, 320 55, 320 55 L 320 120 L 0 120 Z"
        fill="url(#sparklineGradient)"
      />
    </svg>
  );
}
