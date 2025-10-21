import Image from "next/image";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LandingAutoFeatures() {
  return (
    <section className="bg-rose-50/50">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-6 pb-20 pt-12 md:grid-cols-2">
        <Card className="border-white/70 bg-white/90 shadow-sm shadow-rose-100/60">
          <CardHeader className="flex flex-row items-start gap-4">
            <Image src="/assets/illustrations/auto-swap.png" alt="Auto-Swap" width={44} height={44} />
            <div>
              <CardTitle>Auto-Swap</CardTitle>
              <CardDescription>
                Let supporters pay with whatever ERC-20 they have. Kubi swaps on-the-fly to your
                preferred token using on-chain liquidity, so your balance stays consistent.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-6 text-slate-700">
              <li>Set your preferred token once.</li>
              <li>Donors use any supported ERC-20.</li>
              <li>Swaps are on-chain and visible on the explorer.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/90 shadow-sm shadow-rose-100/60">
          <CardHeader className="flex flex-row items-start gap-4">
            <Image src="/assets/illustrations/auto-yield.png" alt="Auto-Yield" width={44} height={44} />
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Auto-Yield</CardTitle>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600">optional</span>
              </div>
              <CardDescription>
                Opt-in to route received tokens into a yield strategy via leading lending protocols on Base. You keep custody at all times while funds remain in your wallet.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-6 text-slate-700">
              <li>Enable per token; disable anytime.</li>
              <li>APR displayed; claims available anytime.</li>
              <li>Works alongside Auto-Swap.</li>
              <li>You hold the yield in your wallet and can withdraw at the chosen lending protocol.</li>
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              Powered by top lending providers on Base; more providers will be added over time. Risk note: Yield is optional and involves smart-contract and market risk. Returns vary and are not guaranteed.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
