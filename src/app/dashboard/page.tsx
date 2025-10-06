import Link from "next/link";

export default function DashboardLandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-16 text-slate-100">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center">
        <h1 className="text-3xl font-semibold text-white">Dashboard coming soon</h1>
        <p className="mt-4 text-sm text-slate-300">
          We&apos;re getting your analytics and overlays ready. In the meantime,
          update your streamer profile or share your donation link.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/onboarding"
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
          >
            Edit profile
          </Link>
          <Link
            href="/donate/demo"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:border-indigo-400"
          >
            Preview donation page
          </Link>
        </div>
      </div>
    </main>
  );
}
