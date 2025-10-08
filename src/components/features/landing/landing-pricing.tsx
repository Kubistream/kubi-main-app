import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrandButton, brandPalette } from "./brand";

export function LandingPricing() {
  return (
    <section id="pricing" className="bg-white/80">
      <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-16">
        <header className="mb-10 text-center">
          <h2 className="text-3xl font-semibold" style={{ color: brandPalette.ink }}>
            Fair & simple pricing
          </h2>
          <p className="mt-2 text-base text-slate-600">
            We help creators grow—not shave off your earnings.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-white/70 bg-white shadow-lg shadow-rose-200/40">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">0% platform fee (beta)</CardTitle>
              <CardDescription>
                Every donation goes to you—we don’t take a cut.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrandButton className="w-full sm:w-auto">Sign up free</BrandButton>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">Only gas fees</CardTitle>
              <CardDescription>
                You only pay the blockchain network fee per transaction.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Available across supported networks (Ethereum L2, Base, Optimism, Arbitrum, Polygon, and more).
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
