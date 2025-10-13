const SUPPORTER_FEED = [
  { name: "aria.eth", amount: "0.42 wETH", message: "Keep the vibe going!" },
  { name: "streamking", amount: "0.18 wETH", message: "Loved the latest collab." },
  { name: "0x9c2...af", amount: "0.10 wETH", message: "GM!" },
];

export function SupporterHighlightsCard() {
  return (
    <section className="rounded-3xl border border-white/60 bg-white px-8 py-8 shadow-[0_18px_32px_-26px_rgba(47,42,44,0.35)]">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-400">Community pulse</p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-900">Recent supporters</h3>
        </div>
        <span className="rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
          Live
        </span>
      </header>

      <ul className="mt-6 space-y-4">
        {SUPPORTER_FEED.map((supporter) => (
          <li
            key={`${supporter.name}-${supporter.amount}`}
            className="flex items-center justify-between rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-sm text-slate-700"
          >
            <div>
              <p className="font-semibold text-slate-900">{supporter.name}</p>
              <p className="text-xs text-slate-500">“{supporter.message}”</p>
            </div>
            <span className="rounded-full bg-white px-4 py-1 text-xs font-semibold text-rose-500">
              {supporter.amount}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
