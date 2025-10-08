import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { benefitCards } from "./data";
import { brandPalette } from "./brand";

export function LandingBenefits() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 pb-20">
      <header className="mb-10 space-y-2 text-center">
        <h2 className="text-3xl font-semibold" style={{ color: brandPalette.ink }}>
          Key benefits
        </h2>
        <p className="text-base text-slate-600">
          Everything you need to collect tips without relying on web2 payment processors.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {benefitCards.map((benefit) => (
          <Card
            key={benefit.title}
            className="flex h-full flex-col border-white/70 bg-white/90 shadow-sm shadow-rose-100/60"
          >
            <CardHeader className="flex flex-row items-start gap-4">
              <span className="text-3xl" aria-hidden>
                {benefit.icon}
              </span>
              <div>
                <CardTitle className="text-lg text-slate-900">{benefit.title}</CardTitle>
                <CardDescription className="mt-2 text-sm text-slate-500">
                  {benefit.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="mt-auto pt-0">
              <p className="text-xs uppercase tracking-[0.25em] text-rose-300">Web3 native</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
