export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-400">Leaderboard</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Top supporters</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Track the most engaged members of your community. Each supporter metric refreshes in near real time as on-chain donations settle.
        </p>
      </header>

      <div className="rounded-3xl border border-white/60 bg-white/95 px-8 py-12 text-center shadow-[0_18px_32px_-26px_rgba(47,42,44,0.35)]">
        <p className="text-sm text-slate-600">
          Leaderboard analytics are coming soon. Connect your wallet and complete profile setup to unlock early access.
        </p>
      </div>
    </div>
  );
}
