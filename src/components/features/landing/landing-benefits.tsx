import { ShieldCheck, Wallet, RefreshCw, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { brandPalette } from "./brand";

const benefits = [
  {
    title: "Non-Custodial",
    description: "Donations go directly to your wallet. We never hold funds.",
    icon: ShieldCheck,
  },
  {
    title: "Flexible",
    description: "Supporters can use any supported ERC-20 — no lock-in.",
    icon: Wallet,
  },
  {
    title: "Auto-Swap",
    description: "Donations can auto-convert to your preferred token on-chain.",
    icon: RefreshCw,
  },
  {
    title: "Auto-Yield",
    description: "Earn yield via top Mantle lending protocols; you keep custody.",
    icon: TrendingUp,
  },
];

export function LandingBenefits() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 pb-20">
      <header className="mb-10 space-y-2 text-center">
        <h2 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl text-white">
          <span className="bg-gradient-to-r from-[#5EEAD4] to-[#A78BFA] bg-clip-text text-transparent">
            Why Kubi?
          </span>
        </h2>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit, i) => (
          <Card
            key={benefit.title}
            className="flex h-full flex-col border border-white/10 bg-[#181033] shadow-[6px_6px_0px_0px_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none rounded-2xl overflow-hidden"
          >
            <CardHeader className="flex flex-col items-center gap-4 text-center pb-2">
              <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                <benefit.icon className="h-10 w-10 text-white" />
              </div>
              <CardTitle
                className="text-2xl font-bold tracking-tight text-white"
              >
                {benefit.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-auto pt-2 pb-6 px-6">
              <CardDescription className="text-center text-base leading-relaxed text-slate-400 font-medium">
                {benefit.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
