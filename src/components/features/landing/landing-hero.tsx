"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";

import { BrandButton, AccentPill } from "./brand";
import { useLaunchApp } from "@/hooks/use-launch-app";

export const LANDING_GUIDES_SECTION_ID = "landing-guides";

export function LandingHero() {
  const { onLaunch, disabled } = useLaunchApp();

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleGuidesClick = (
    event?: MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
  ) => {
    event?.preventDefault();
    scrollToSection(LANDING_GUIDES_SECTION_ID);
  };

  const handleHowItWorksClick = (event?: MouseEvent<HTMLAnchorElement>) => {
    event?.preventDefault();
    scrollToSection("how");
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "calc(100vh - var(--landing-nav-height, 0px))" }}
    >
      {/* Background Decor - softer glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#7C3AED]/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#06D6A0]/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="mx-auto flex h-full w-full max-w-5xl flex-col items-center justify-center px-6 py-16 text-center sm:py-20 lg:py-24 xl:max-w-6xl xl:py-28 2xl:py-32">
        <div className="flex w-full flex-col items-center gap-8">
          {/* Trust + positioning pills */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <AccentPill className="border border-white/20 bg-white/5 text-slate-300">
              <span className="flex items-center gap-2">
                <Image src="/assets/illustrations/lock.png" alt="Secure" width={14} height={14} className="brightness-0 invert opacity-80" />
                Onchain · Non-custodial
              </span>
            </AccentPill>
            <AccentPill className="border border-white/20 bg-white/5 text-slate-300">
              <span className="flex items-center gap-2">
                <Image src="/assets/illustrations/base-logo.jpeg" alt="Base" width={18} height={18} className="rounded-full opacity-80" />
                Base · Low fees
              </span>
            </AccentPill>
          </div>

          <h2 className="mx-auto max-w-5xl text-6xl font-black tracking-tighter text-white sm:text-7xl md:text-8xl xl:text-9xl leading-[0.95]">
            <span className="block drop-shadow-lg">
              Stream Smarter,
            </span>
            <span className="mt-2 block bg-gradient-to-r from-[#5EEAD4] to-[#A78BFA] bg-clip-text text-transparent pb-4 drop-shadow-sm">
              Earn Epic Onchain
            </span>
          </h2>

          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-400 sm:text-xl md:text-2xl font-medium">
            Fuse live streams with DeFi auto-yield, OBS alerts, and non-custodial security—
            supercharge tips that grow on Base's low-fee chain.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6">
            <BrandButton
              size="lg"
              type="button"
              onClick={onLaunch}
              disabled={disabled}
              className="h-14 px-8 text-lg font-bold bg-[#7C3AED] text-white shadow-[4px_4px_0_0_#5EEAD4] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] border-2 border-white"
              aria-label="Join Kubi Beta"
            >
              Start Streaming
            </BrandButton>

            <button
              type="button"
              aria-label="Guides"
              onClick={handleGuidesClick}
              className="inline-flex h-14 items-center rounded-xl border border-white/20 bg-white/5 px-8 text-lg font-bold text-white transition-all hover:bg-white hover:text-black hover:-translate-y-1"
            >
              Read Guides
            </button>
          </div>

          <Link
            href="#how"
            className="mt-6 text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
            onClick={handleHowItWorksClick}
          >
            How it works ↓
          </Link>
        </div>
      </div>
    </section>
  );
}
