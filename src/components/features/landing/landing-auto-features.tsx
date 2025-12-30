import { RefreshCw, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LandingAutoFeatures() {
  return (
    <section className="bg-[#0f0919]">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-6 pb-20 pt-12 md:grid-cols-2">
        <Card className="flex flex-col border border-white/10 bg-[#181033] shadow-[6px_6px_0_0_#000] rounded-2xl overflow-hidden hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all group">
          <CardHeader className="flex flex-row items-start gap-5 pb-2">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group-hover:bg-white/10 transition-colors">
              <RefreshCw className="h-8 w-8 text-[#5EEAD4]" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white sm:text-3xl">Auto-Swap</CardTitle>
              <CardDescription className="text-base leading-relaxed text-slate-300 sm:text-lg font-medium mt-2">
                Let supporters pay with whatever ERC-20 they have. Kubi swaps on-the-fly to your
                preferred token using on-chain liquidity, so your balance stays consistent.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-6 text-slate-300 font-medium marker:text-[#5EEAD4]">
              <li>Set your preferred token once.</li>
              <li>Donors use any supported ERC-20.</li>
              <li>Swaps are on-chain and visible on the explorer.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="flex flex-col border border-white/10 bg-[#181033] shadow-[6px_6px_0_0_#000] rounded-2xl overflow-hidden hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all group">
          <CardHeader className="flex flex-row items-start gap-5 pb-2">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group-hover:bg-white/10 transition-colors">
              <TrendingUp className="h-8 w-8 text-[#FBBF24]" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl font-bold text-white sm:text-3xl">Auto-Yield</CardTitle>
                <span className="rounded-lg bg-[#FBBF24] px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-black shadow-sm">
                  optional
                </span>
              </div>
              <CardDescription className="text-base leading-relaxed text-slate-300 sm:text-lg font-medium">
                Opt-in to route received tokens into a yield strategy via leading lending protocols on Base. You keep custody at all times while funds remain in your wallet.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-6 text-slate-300 font-medium marker:text-[#FBBF24]">
              <li>Enable per token; disable anytime.</li>
              <li>APR displayed; claims available anytime.</li>
              <li>Works alongside Auto-Swap.</li>
              <li>You hold the yield in your wallet and can withdraw at the chosen lending protocol.</li>
            </ul>
            <p className="mt-6 text-xs text-slate-500 font-mono border-t border-white/5 pt-4 leading-relaxed">
              Powered by top lending providers on Base; more providers will be added over time. Risk note: Yield is optional and involves smart-contract and market risk. Returns vary and are not guaranteed.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
