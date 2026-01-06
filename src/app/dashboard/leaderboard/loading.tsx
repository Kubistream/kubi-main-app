export default function LeaderboardLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <header className="space-y-3">
                <div className="h-4 w-24 bg-accent-pink/30 rounded-md" />
                <div className="h-8 w-48 bg-white/10 rounded-lg" />
                <div className="h-4 w-full max-w-2xl bg-slate-700/50 rounded-md" />
            </header>

            {/* Filters Skeleton */}
            <section className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* Range Options */}
                    <div className="flex flex-wrap gap-2">
                        {["1D", "7D", "1W", "1M", "YTD", "1Y", "5Y", "All"].map((label) => (
                            <div
                                key={label}
                                className="h-9 w-12 bg-slate-700/50 rounded-lg"
                            />
                        ))}
                    </div>

                    {/* Currency & Sort */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex gap-2 rounded-full border border-slate-600/50 bg-slate-800/30 p-1">
                            <div className="h-8 w-14 bg-slate-700/50 rounded-full" />
                            <div className="h-8 w-14 bg-slate-700/50 rounded-full" />
                        </div>
                        <div className="h-9 w-20 bg-slate-700/50 rounded-lg" />
                    </div>
                </div>

                {/* Leaderboard Card */}
                <div className="rounded-3xl border-2 border-[var(--color-border-dark)] bg-surface-dark shadow-fun">
                    {/* Loading State with Spinner */}
                    <div className="flex flex-col items-center justify-center gap-4 py-16">
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-accent-pink/20 rounded-full" />
                            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-accent-pink rounded-full animate-spin" />
                        </div>
                        <p className="text-sm text-slate-400 font-medium">Loading supporter rankings...</p>
                    </div>

                    {/* Skeleton Rows */}
                    <div className="space-y-4 px-4 py-5 sm:px-6 border-t border-[var(--color-border-dark)]">
                        {[1, 2, 3, 4, 5].map((index) => (
                            <div
                                key={index}
                                className="rounded-2xl border border-[var(--color-border-dark)] bg-surface-dark/50 p-4 flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Rank Badge */}
                                    <div
                                        className={`rounded-full bg-slate-700/50 ${index === 1
                                                ? "h-12 w-12"
                                                : index === 2
                                                    ? "h-11 w-11"
                                                    : index === 3
                                                        ? "h-10 w-10"
                                                        : "h-9 w-9"
                                            }`}
                                    />
                                    {/* Name & Stats */}
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-slate-700/50 rounded" />
                                        <div className="h-3 w-20 bg-slate-800/50 rounded" />
                                    </div>
                                </div>
                                {/* Amount */}
                                <div className="flex items-center gap-3">
                                    <div className="h-4 w-12 bg-slate-700/50 rounded" />
                                    <div className="h-6 w-24 bg-slate-700/50 rounded-lg" />
                                    <div className="h-5 w-5 bg-slate-700/50 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
