"use client";

import Link from "next/link";

import { BrandButton, AccentPill } from "./brand";
import { useLaunchApp } from "@/hooks/use-launch-app";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  const { onLaunch, label, disabled } = useLaunchApp();

  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-transparent to-transparent" />
      <div className="mx-auto w-full max-w-4xl px-6 pb-20 pt-16 text-center">
        {/* <div className="mb-4 flex items-center justify-center gap-2">
          <AccentPill>
            <span className="flex items-center gap-2 text-rose-500">
              <span aria-hidden>🛡️</span>
              Non-custodial · On-chain
            </span>
          </AccentPill>
          <AccentPill>
            <span className="flex items-center gap-2 text-rose-500">
              <span aria-hidden>⚡</span>
              Fast & transparent
            </span>
          </AccentPill>
        </div> */}

        <h2 className="font-modak modak-readable modak-stroke-warm mx-auto max-w-4xl text-4xl font-extrabold tracking-wider sm:text-5xl md:text-6xl">
          <span className="block bg-gradient-to-b from-[#FF3D86] via-[#FF6D6D] to-[#FFA24C] bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]">
            Effortless On-Chain Creators Support
          </span>
          <span className="mt-2 block bg-gradient-to-b from-[#FF3D86] via-[#FF6D6D] to-[#FFA24C] bg-clip-text text-transparent tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]">
            in Attention Economy
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Kubi enables creators to receive any ERC-20 token straight into their personal
          wallet — and supporters can donate directly from their own wallet.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <BrandButton
            size="lg"
            type="button"
            onClick={onLaunch}
            disabled={disabled}
            aria-label="Launch Kubi"
          >
            Start as Creator
          </BrandButton>
          <Button type="button" variant="secondary" aria-label="Preview Alerts" onClick={() => {}}>
            Preview Alerts
          </Button>
          <Link href="#how" className="text-sm font-medium text-rose-600 underline-offset-4 hover:underline">
            How it works
          </Link>
        </div>
      </div>
    </section>
  );
}
