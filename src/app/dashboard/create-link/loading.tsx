export default function CreateLinkLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <header className="space-y-3">
                <div className="h-4 w-24 bg-accent-pink/20 rounded-md" />
                <div className="h-8 w-80 bg-white/10 rounded-lg" />
                <div className="h-4 w-96 max-w-full bg-slate-700/50 rounded-md" />
            </header>

            {/* Cards Grid Skeleton */}
            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                {/* Main Card Skeleton */}
                <div className="bg-surface-dark border-2 border-[var(--color-border-dark)] rounded-2xl p-6 shadow-fun">
                    <div className="space-y-2 mb-6">
                        <div className="h-6 w-48 bg-slate-700/50 rounded-lg" />
                        <div className="h-4 w-64 bg-slate-800/50 rounded" />
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="h-4 w-24 bg-slate-700/50 rounded" />
                            <div className="flex gap-2">
                                <div className="h-10 w-24 bg-accent-pink/20 rounded-xl" />
                                <div className="h-10 flex-1 bg-slate-700/50 rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-slate-700/50 rounded" />
                            <div className="h-24 w-full bg-slate-700/50 rounded-xl" />
                        </div>
                        <div className="h-12 w-full bg-accent-pink/30 rounded-xl" />
                    </div>
                </div>

                {/* QR Card Skeleton */}
                <div className="bg-surface-dark border-2 border-[var(--color-border-dark)] rounded-2xl p-6 shadow-fun flex flex-col items-center text-center">
                    <div className="space-y-2 mb-6 w-full">
                        <div className="h-5 w-24 bg-slate-700/50 rounded-lg mx-auto" />
                        <div className="h-4 w-48 bg-slate-800/50 rounded mx-auto" />
                    </div>
                    <div className="w-[180px] h-[180px] bg-slate-700/30 rounded-2xl border-2 border-[var(--color-border-dark)]" />
                    <div className="w-full h-px bg-[var(--color-border-dark)] my-6" />
                    <div className="space-y-2 w-full">
                        <div className="h-3 w-20 bg-accent-pink/20 rounded mx-auto" />
                        <div className="h-4 w-48 bg-slate-700/50 rounded mx-auto" />
                    </div>
                </div>
            </div>
        </div>
    );
}
