"use client";

import Link from "next/link";
import Image from "next/image";

import { BrandButton, AccentPill } from "./brand";
import { useLaunchApp } from "@/hooks/use-launch-app";
import { Button } from "@/components/ui/button";

export const LANDING_GUIDES_SECTION_ID = "landing-guides";

export function LandingHero() {
  const { onLaunch, label, disabled } = useLaunchApp();

  const handleGuidesClick = () => {
    const guidesSection = document.getElementById(LANDING_GUIDES_SECTION_ID);
    guidesSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-transparent to-transparent" />
      <div className="mx-auto w-full max-w-4xl px-6 pb-20 pt-16 text-center">
        {/* Trust + positioning pills */}
        <div className="mb-4 flex items-center justify-center gap-3">
          <AccentPill className="px-4 py-2 text-[0.8rem] sm:text-sm tracking-wide text-rose-600 border-rose-200 bg-white/90 shadow-sm">
            <span className="flex items-center gap-2">
              <Image src="/assets/illustrations/lock.png" alt="Secure" width={11} height={11} />
              Onchain · Non-custodial
            </span>
          </AccentPill>
          <AccentPill className="px-4 py-2 text-[0.8rem] sm:text-sm tracking-wide text-rose-600 border-rose-200 bg-white/90 shadow-sm">
            <span className="flex items-center gap-2">
              <Image src="/assets/illustrations/base-logo.jpeg" alt="Base" width={18} height={18} />
              Base · Low fees
            </span>
          </AccentPill>
        </div>

        <h2 className="font-modak modak-readable modak-stroke-warm mx-auto max-w-4xl text-4xl font-extrabold tracking-wider sm:text-5xl md:text-6xl">
          <span className="block bg-gradient-to-b from-[#FF3D86] via-[#FF6D6D] to-[#FFA24C] bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]">
            Stream Smarter, Earn Epic Onchain
          </span>
          <span className="mt-2 block bg-gradient-to-b from-[#FF3D86] via-[#FF6D6D] to-[#FFA24C] bg-clip-text text-transparent tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]">
            Tips that grow on Base
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Fuse live streams with DeFi auto-yield, OBS alerts, and non-custodial security—
          supercharge tips that grow on Base's low-fee chain.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <BrandButton
            size="lg"
            type="button"
            onClick={onLaunch}
            disabled={disabled}
            aria-label="Join Kubi Beta"
          >
            Lets Stream & Earn
          </BrandButton>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            aria-label="Guides"
            onClick={handleGuidesClick}
          >
            Guides
          </Button>
          <Link href="#how" className="text-sm font-medium text-rose-600 underline-offset-4 hover:underline">
            How it works
          </Link>
        </div>
      </div>
    </section>
  );
}
