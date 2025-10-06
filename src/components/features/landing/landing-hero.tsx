"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";
import { useWallet } from "@/hooks/use-wallet";

export function LandingHero() {
  const { isConnected, address } = useWallet();

  const primaryCta = useMemo(() => {
    if (!isConnected) {
      return {
        href: "#connect",
        label: "Connect Wallet",
      };
    }

    return {
      href: "/onboarding",
      label: "Continue onboarding",
    };
  }, [isConnected]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 text-center">
      <div className="flex flex-col gap-4">
        <span className="rounded-full border border-slate-800 bg-slate-900/70 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-400">
          Web3 Donations for Streamers
        </span>
        <h1 className="text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
          Turn supporter tips into on-chain alerts in seconds
        </h1>
        <p className="mx-auto max-w-2xl text-base text-slate-300 sm:text-lg">
          Kubi lets your community donate without leaving the stream. Connect
          your wallet, personalise your streamer profile, and drop an OBS-ready
          overlay with live notifications.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4" id="connect">
        <ConnectWalletButton label="Connect wallet" />
        <Link
          href={primaryCta.href}
          className="rounded-full bg-indigo-500 px-6 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400"
        >
          {primaryCta.label}
        </Link>
        {isConnected && address && (
          <p className="text-xs text-slate-400">
            Connected as {address.slice(0, 6)}…{address.slice(-4)}
          </p>
        )}
      </div>

      <div className="grid w-full gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:grid-cols-3">
        {landingHighlights.map((highlight) => (
          <div key={highlight.title} className="text-left">
            <div className="text-sm font-medium text-indigo-200">
              {highlight.title}
            </div>
            <p className="mt-1 text-sm text-slate-400">{highlight.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const landingHighlights = [
  {
    title: "Plug-and-play overlays",
    description:
      "Generate a donation link and browser source that syncs to OBS with realtime alerts.",
  },
  {
    title: "Wallet-first onboarding",
    description:
      "Use your wallet to register, reserve a streamer handle, and track on-chain earnings.",
  },
  {
    title: "Supporter friendly",
    description:
      "Fans connect in one tap, tip in their favourite token, and share a message instantly.",
  },
];
