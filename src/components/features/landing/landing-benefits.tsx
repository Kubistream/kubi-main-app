import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { brandPalette } from "./brand";

const benefits = [
  {
    title: "Secure",
    description: "Every donations from supporters will be sent directly to your wallet",
    image: "/assets/illustrations/secure.png",
  },
  {
    title: "Instant",
    description: "Quick on-chain transactions with real-time on-stream alerts",
    image: "/assets/illustrations/quick.png",
  },
  {
    title: "Flexible",
    description: "Support any ERC-20 tokens or your token preferences",
    image: "/assets/illustrations/flexible.png",
  },
  {
    title: "Low-Fees",
    description: "Enjoy minimal fees for streaming donations in our platform",
    image: "/assets/illustrations/low-fees.png",
  },
];

export function   LandingBenefits() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 pb-20">
      <header className="mb-10 space-y-2 text-center">
        <h2 className="font-modak modak-readable modak-stroke-warm text-3xl font-extrabold tracking-wider sm:text-4xl md:text-5xl">
          <span className="bg-gradient-to-b from-[#FF3D86] via-[#FF6D6D] to-[#FFA24C] bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]">
            Why Kubi?
          </span>
        </h2>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit) => (
          <Card
            key={benefit.title}
            className="flex h-full flex-col border-white/70 bg-white/90 shadow-sm shadow-rose-100/60"
          >
            <CardHeader className="flex flex-col items-center gap-4 text-center">
              <Image
                src={benefit.image}
                alt={benefit.title}
                width={96}
                height={96}
                className="h-16 w-auto"
              />
              <CardTitle
                className="font-modak modak-readable modak-stroke-pink modak-stroke-strong text-2xl sm:text-3xl leading-none tracking-wider drop-shadow-[0_2px_1px_rgba(217,30,88,0.25)]"
                style={{ color: brandPalette.pink }}
              >
                {benefit.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-auto pt-0">
              <CardDescription className="text-center text-base leading-relaxed text-slate-600">
                {benefit.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
