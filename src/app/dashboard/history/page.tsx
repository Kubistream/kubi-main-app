export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-400">Transaction history</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">All your payouts in one place</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Monitor on-chain donations, settlement status, and automated withdrawals. Export CSV reports once the module ships.
        </p>
      </header>

      <div className="rounded-3xl border border-white/60 bg-white/95 px-8 py-12 text-center shadow-[0_18px_32px_-26px_rgba(47,42,44,0.35)]">
        <p className="text-sm text-slate-600">
          We&apos;re finalising the activity log. Check back soon for full transaction reporting.
        </p>
      </div>
    </div>
  );
}
