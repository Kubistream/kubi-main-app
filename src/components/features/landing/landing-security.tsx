import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrandButton, brandPalette } from "./brand";
import { testimonials, securityBullets } from "./data";
import { Avatar } from "@/components/ui/avatar";

export function LandingSecurityAndCommunity() {
  return (
    <section className="bg-gradient-to-b from-rose-50/60 to-white">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-24 pt-16 lg:grid-cols-[1.1fr,0.9fr]">
        <Card className="border-white/70 bg-white/85 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl" style={{ color: brandPalette.ink }}>
              Secure by design
            </CardTitle>
            <CardDescription>
              Non-custodial payments, verified signing, and anti-spam protections.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <ul className="list-inside list-disc space-y-2">
              {securityBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <BrandButton className="w-full sm:w-auto">View security details</BrandButton>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/85 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl" style={{ color: brandPalette.ink }}>
              Loved by the community
            </CardTitle>
            <CardDescription>Friendly, inclusive, and built for every creator.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-white/90 p-4"
              >
                <Avatar className="h-10 w-10">
                  <span className="text-base" aria-hidden>
                    {testimonial.name.charAt(0)}
                  </span>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {testimonial.name}
                    <span className="ml-2 text-xs font-normal uppercase tracking-[0.25em] text-rose-300">
                      {testimonial.role}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-500">“{testimonial.quote}”</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
