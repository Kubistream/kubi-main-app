export default function ProfileLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <header className="space-y-3">
                <div className="h-4 w-16 bg-accent-pink/30 rounded-md" />
                <div className="h-8 w-40 bg-white/10 rounded-lg" />
                <div className="h-4 w-full max-w-md bg-slate-700/50 rounded-md" />
            </header>

            {/* Profile Card Skeleton */}
            <div className="bg-surface-dark border-2 border-[var(--color-border-dark)] rounded-2xl p-8 shadow-fun">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Avatar Skeleton */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="size-32 rounded-full bg-slate-700/50 border-4 border-[var(--color-border-dark)]" />
                        <div className="h-9 w-32 bg-slate-700/50 rounded-lg" />
                    </div>

                    {/* Form Skeleton */}
                    <div className="flex-1 space-y-6">
                        {/* Loading Indicator */}
                        <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border-dark)]">
                            <div className="relative">
                                <div className="w-8 h-8 border-4 border-accent-pink/20 rounded-full" />
                                <div className="absolute top-0 left-0 w-8 h-8 border-4 border-transparent border-t-accent-pink rounded-full animate-spin" />
                            </div>
                            <span className="text-sm text-slate-400 font-medium">Loading profile...</span>
                        </div>

                        {/* Input Fields Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-4 w-24 bg-slate-700/30 rounded" />
                                    <div className="h-11 w-full bg-slate-700/50 rounded-lg" />
                                </div>
                            ))}
                        </div>

                        {/* Bio Skeleton */}
                        <div className="space-y-2">
                            <div className="h-4 w-16 bg-slate-700/30 rounded" />
                            <div className="h-24 w-full bg-slate-700/50 rounded-lg" />
                        </div>

                        {/* Button Skeleton */}
                        <div className="flex justify-end">
                            <div className="h-11 w-32 bg-slate-700/50 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
