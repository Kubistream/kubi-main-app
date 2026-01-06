import { SupportersLeaderboard } from "@/components/features/dashboard/supporters-leaderboard";

export default function LeaderboardPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-accent-cyan">Leaderboard</p>
        <h1 className="text-3xl font-black text-white font-display">Top supporters</h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Celebrate your biggest fans with live donation rankings. Filter by timeframe, currency, and sort order to understand who&apos;s powering your channel.
        </p>
      </header>

      <SupportersLeaderboard />
    </div>
  );
}

