import { LandingHero } from "@/components/features/landing/landing-hero";

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35),_transparent_60%)]" />
      <div className="relative z-10 flex flex-1 flex-col items-center px-6 py-16 sm:px-10">
        <LandingHero />
        <section className="mt-20 w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-left">
          <h2 className="text-2xl font-semibold text-white">How it works</h2>
          <ol className="mt-6 space-y-3 text-sm text-slate-300">
            <li>
              <span className="font-medium text-indigo-300">1. Connect wallet:</span>
              {" "}Start from this landing page or a donation link. We use RainbowKit
              for a seamless multi-wallet experience.
            </li>
            <li>
              <span className="font-medium text-indigo-300">2. Onboard as a streamer:</span>
              {" "}Reserve your handle, set a profile image, and copy your unique
              donation link.
            </li>
            <li>
              <span className="font-medium text-indigo-300">3. Share & collect:</span>
              {" "}Supporters connect a wallet from your link and submit tips that
              power realtime alerts in OBS.
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}
