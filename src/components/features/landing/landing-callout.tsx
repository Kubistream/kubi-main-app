export function LandingCallout() {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 pb-20 pt-6 text-center bg-[#0f0919]">
      <div className="rounded-3xl border-2 border-white bg-[#181033] p-10 shadow-[8px_8px_0_0_#FFD166]">
        <p className="text-4xl font-black leading-tight sm:text-5xl md:text-6xl text-white drop-shadow-[4px_4px_0_#7C3AED]">
          <span className="block">
            Supercharge Tips That Grow on Mantle
          </span>
          <span className="mt-4 block bg-gradient-to-r from-[#06D6A0] via-[#FFD166] to-[#7C3AED] bg-clip-text text-transparent tracking-tighter drop-shadow-sm pb-2">
            Non-custodial, OBS-ready, built for streamers.
          </span>
        </p>

        <p className="mt-8 text-base font-bold text-slate-400 sm:text-lg uppercase tracking-widest flex items-center justify-center gap-2">
          Made with <span className="text-[#FFD166]">⚡️</span> by Kubi
        </p>
      </div>
    </section>
  );
}
