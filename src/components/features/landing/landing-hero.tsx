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
      className="relative"
      style={{ minHeight: "calc(100vh - var(--landing-nav-height, 0px))" }}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-transparent to-transparent" />
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col items-center justify-center px-6 py-16 text-center sm:py-20 lg:py-24 xl:max-w-6xl xl:py-28 2xl:py-32">
        <div className="flex w-full flex-col items-center gap-6">
          {/* Trust + positioning pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <AccentPill className="px-4 py-2 text-[0.8rem] tracking-wide text-rose-600 border-rose-200 bg-white/90 shadow-sm sm:text-sm xl:text-base">
              <span className="flex items-center gap-2">
                <Image src="/assets/illustrations/lock.png" alt="Secure" width={11} height={11} />
                Onchain · Non-custodial
              </span>
            </AccentPill>
            <AccentPill className="px-4 py-2 text-[0.8rem] tracking-wide text-rose-600 border-rose-200 bg-white/90 shadow-sm sm:text-sm xl:text-base">
              <span className="flex items-center gap-2">
                <Image src="/assets/illustrations/base-logo.jpeg" alt="Base" width={18} height={18} />
                Base · Low fees
              </span>
            </AccentPill>
          </div>

          <h2 className="font-modak modak-readable modak-stroke-warm mx-auto max-w-4xl text-5xl font-extrabold tracking-wider sm:text-6xl md:text-7xl xl:text-7xl 2xl:text-7xl">
            <span className="block bg-gradient-to-b from-[#FF3D86] via-[#FF6D6D] to-[#FFA24C] bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]">
              Stream Smarter, Earn Epic Onchain
            </span>
            <span className="mt-2 block bg-gradient-to-b from-[#FF3D86] via-[#FF6D6D] to-[#FFA24C] bg-clip-text text-transparent tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]">
              Tips that grow on Base
            </span>
          </h2>

          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-600 sm:text-lg md:text-xl xl:text-2xl">
            Fuse live streams with DeFi auto-yield, OBS alerts, and non-custodial security—
            supercharge tips that grow on Base's low-fee chain.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <BrandButton
              size="lg"
              type="button"
              onClick={onLaunch}
              disabled={disabled}
              aria-label="Join Kubi Beta"
            >
              Lets Stream & Earn
            </BrandButton>
            <button
              type="button"
              aria-label="Guides"
              onClick={handleGuidesClick}
              className="inline-flex h-11 items-center rounded-full border border-rose-200 px-5 text-base font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Guides
            </button>
            <Link
              href="#how"
              className="text-sm font-medium text-rose-600 underline-offset-4 hover:underline"
              onClick={handleHowItWorksClick}
            >
              How it works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
