export default function HistoryLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <header className="space-y-3">
                <div className="h-4 w-20 bg-accent-cyan/30 rounded-md" />
                <div className="h-8 w-56 bg-white/10 rounded-lg" />
                <div className="h-4 w-full max-w-xl bg-slate-700/50 rounded-md" />
            </header>

            {/* Filters Skeleton */}
            <div className="flex flex-wrap gap-3">
                <div className="h-10 w-32 bg-slate-700/50 rounded-lg" />
                <div className="h-10 w-40 bg-slate-700/50 rounded-lg" />
                <div className="h-10 w-28 bg-slate-700/50 rounded-lg" />
            </div>

            {/* Table Skeleton */}
            <div className="bg-surface-dark border-2 border-[var(--color-border-dark)] rounded-2xl p-6 shadow-fun">
                {/* Loading Indicator */}
                <div className="flex items-center justify-center gap-3 py-8 border-b border-[var(--color-border-dark)]">
                    <div className="relative">
                        <div className="w-10 h-10 border-4 border-accent-cyan/20 rounded-full" />
                        <div className="absolute top-0 left-0 w-10 h-10 border-4 border-transparent border-t-accent-cyan rounded-full animate-spin" />
                    </div>
                    <span className="text-sm text-slate-400 font-medium">Loading transaction history...</span>
                </div>

                {/* Table Header Skeleton */}
                <div className="flex gap-4 py-4 border-b border-[var(--color-border-dark)]">
                    {["Date", "Donor", "Amount", "USD", "TX Hash", "Status"].map((_, i) => (
                        <div key={i} className="h-3 w-20 bg-slate-700/30 rounded flex-1" />
                    ))}
                </div>

                {/* Table Rows Skeleton */}
                {[1, 2, 3, 4, 5, 6].map((index) => (
                    <div
                        key={index}
                        className="flex items-center gap-4 py-4 border-b border-[var(--color-border-dark)]/50"
                    >
                        <div className="h-4 w-24 bg-slate-700/50 rounded flex-1" />
                        <div className="flex items-center gap-2 flex-1">
                            <div className="size-8 rounded-full bg-slate-700/50" />
                            <div className="h-4 w-24 bg-slate-700/50 rounded" />
                        </div>
                        <div className="h-4 w-20 bg-slate-700/50 rounded flex-1" />
                        <div className="h-4 w-16 bg-slate-700/50 rounded flex-1" />
                        <div className="h-4 w-20 bg-slate-700/50 rounded flex-1" />
                        <div className="h-6 w-20 bg-slate-700/50 rounded-lg flex-1" />
                    </div>
                ))}
            </div>
        </div>
    );
}
