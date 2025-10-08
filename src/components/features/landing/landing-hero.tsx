import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { AccentPill, BeeLogo, BrandButton, brandPalette } from "./brand";
import {
  donationFeed,
  pressLogos,
  stats,
  supportedWallets,
} from "./data";

export function LandingHero() {
  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-transparent to-transparent" />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-20 pt-16 md:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-2">
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
          </div>

          <div className="space-y-6">
            <h1
              className="text-4xl font-extrabold tracking-tight sm:text-5xl"
              style={{ color: brandPalette.ink }}
            >
              Decentralised crypto donations for
              <span className="ml-2 bg-gradient-to-r from-[#FF3D86] to-[#FFA24C] bg-clip-text text-transparent">
                streamers
              </span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Receive ERC-20 tokens directly in your wallet from supporters anywhere in the world. Kubi gives you instant alerts, shareable donation links, and OBS overlays built for web3-native communities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <BrandButton size="lg" asChild>
              <Link href="/onboarding" aria-label="Get started with Kubi">
                Get started
              </Link>
            </BrandButton>
            <Button
              variant="secondary"
              size="lg"
              className="text-slate-900"
              asChild
            >
              <Link href="#how">How it works</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
            {pressLogos.map((logo) => (
              <span key={logo}>{logo}</span>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm shadow-rose-200/40"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-rose-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[3rem] bg-gradient-to-br from-rose-200 via-rose-100 to-indigo-100 blur-3xl" />
          <Card className="mx-auto w-full max-w-md border-none bg-white/85 p-8 shadow-[0_30px_80px_-40px_rgba(244,63,94,0.35)]">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BeeLogo size={26} />
                Kubi Live Widget
              </CardTitle>
              <CardDescription>Real-time donation preview</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex items-center gap-3">
                <Input placeholder="0xYourStreamerWallet…" aria-label="Streamer wallet address" />
                <Button variant="secondary" className="h-11">
                  Connect
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {supportedWallets.map((wallet) => (
                  <Button key={wallet} variant="outline" className="justify-start">
                    <span aria-hidden className="mr-2">🪟</span>
                    {wallet}
                  </Button>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                {donationFeed.map((donation) => (
                  <div
                    key={donation.name}
                    className="flex items-center justify-between rounded-2xl border border-rose-100 bg-white/80 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <span className="text-base">🌟</span>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {donation.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {donation.token} · {donation.amount}
                        </p>
                      </div>
                    </div>
                    <Badge className="rounded-full border border-rose-200 bg-rose-50 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-rose-500">
                      on-chain
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
