import { LandingHero } from "@/components/features/landing/landing-hero";
import { LandingBenefits } from "@/components/features/landing/landing-benefits";
import { LandingHowItWorks } from "@/components/features/landing/landing-how-it-works";
import { LandingFaq } from "@/components/features/landing/landing-faq";
import { LandingFooter } from "@/components/features/landing/landing-footer";
import { LandingCallout } from "@/components/features/landing/landing-callout";
import { LandingAutoFeatures } from "@/components/features/landing/landing-auto-features";

export default function LandingPage() {
  return (
    <main className="bg-gradient-to-b from-rose-100 via-rose-50 to-white text-slate-900">
      <LandingHero />
      <LandingBenefits />
      <LandingHowItWorks />
      <LandingAutoFeatures />
      {/* <LandingSecurityAndCommunity /> */}
      <LandingFaq />
      <LandingCallout />
      <LandingFooter />
    </main>
  );
}
