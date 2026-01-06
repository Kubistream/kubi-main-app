export default function TutorialLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <header className="space-y-3">
                <div className="h-4 w-20 bg-accent-pink/20 rounded-md" />
                <div className="h-8 w-48 bg-white/10 rounded-lg" />
                <div className="h-4 w-[500px] max-w-full bg-slate-700/50 rounded-md" />
            </header>

            {/* Video Card Skeleton */}
            <div className="bg-surface-dark border-2 border-[var(--color-border-dark)] rounded-2xl p-6 shadow-fun">
                <div className="aspect-video bg-[#130c29] rounded-xl border-2 border-[var(--color-border-dark)] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-accent-pink/20 rounded-full" />
                            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-accent-pink rounded-full animate-spin" />
                        </div>
                        <div className="h-4 w-32 bg-slate-700/50 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}
