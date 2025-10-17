import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-20 text-slate-100">
      <div className="max-w-md space-y-6 text-center">
        <div className="rounded-full border border-emerald-300/40 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300/80">
          404
        </div>
        <h1 className="text-4xl font-semibold text-white">Channel not found</h1>
        <p className="text-sm text-slate-300">
          We couldn’t find the streamer you were looking for. The link might be wrong, or the creator hasn’t set up
          their donation page yet.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-emerald-400/60 bg-emerald-400/10 px-5 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
          >
            Go to homepage
          </Link>
          <Link
            href="/discover"
            className="inline-flex items-center justify-center rounded-full border border-slate-500/60 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/80"
          >
            Discover creators
          </Link>
        </div>
      </div>
    </main>
  );
}
