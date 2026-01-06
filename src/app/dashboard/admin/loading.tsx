export default function AdminLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <header className="space-y-3">
                <div className="h-4 w-24 bg-accent-pink/20 rounded-md" />
                <div className="h-8 w-48 bg-white/10 rounded-lg" />
                <div className="h-4 w-80 max-w-full bg-slate-700/50 rounded-md" />
            </header>

            {/* Cards Grid Skeleton */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-surface-dark border-2 border-[var(--color-border-dark)] rounded-2xl p-6 shadow-fun"
                    >
                        <div className="space-y-2 mb-6">
                            <div className="h-6 w-48 bg-slate-700/50 rounded-lg" />
                            <div className="h-4 w-64 bg-slate-800/50 rounded" />
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="h-4 w-16 bg-slate-700/50 rounded" />
                                    <div className="h-10 w-full bg-slate-700/30 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-4 w-20 bg-slate-700/50 rounded" />
                                    <div className="h-10 w-full bg-slate-700/30 rounded-xl" />
                                </div>
                            </div>
                            <div className="h-10 w-24 bg-accent-pink/30 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
