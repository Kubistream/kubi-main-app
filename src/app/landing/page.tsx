export const revalidate = 0;
export const dynamic = "force-dynamic";

import { LandingHero, LANDING_GUIDES_SECTION_ID } from "@/components/features/landing/landing-hero";
import { LandingBenefits } from "@/components/features/landing/landing-benefits";
import { LandingHowItWorks } from "@/components/features/landing/landing-how-it-works";
import { LandingFaq } from "@/components/features/landing/landing-faq";
import { LandingFooter } from "@/components/features/landing/landing-footer";
import { LandingCallout } from "@/components/features/landing/landing-callout";
import { LandingAutoFeatures } from "@/components/features/landing/landing-auto-features";
import { LandingTokenFlow } from "@/components/features/landing/landing-token-flow";
import { LandingVideo } from "@/components/features/landing/landing-video";
import { prisma } from "@/lib/prisma";

export default async function LandingPage() {
  const landingVideo = await prisma.utils.findFirst({
    where: { name: "video-landing-page" },
  });

  return (
    <main className="bg-[#0f0919] text-white min-h-screen">
      <LandingHero />
      <LandingBenefits />
      <LandingHowItWorks />
      <LandingAutoFeatures />
      <LandingTokenFlow />
      {landingVideo?.value ? (
        <LandingVideo videoUrl={landingVideo.value} sectionId={LANDING_GUIDES_SECTION_ID} />
      ) : null}
      {/* <LandingSecurityAndCommunity /> */}
      <LandingFaq />
      <LandingCallout />
      <LandingFooter />
    </main>
  );
}
