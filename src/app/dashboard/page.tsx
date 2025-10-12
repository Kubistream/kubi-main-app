import { DonationLinkCard } from "@/components/features/dashboard/donation-link-card";
import { EarningsOverviewCard } from "@/components/features/dashboard/earnings-overview-card";
import { QuickActionsCard } from "@/components/features/dashboard/quick-actions-card";
import { SupporterHighlightsCard } from "@/components/features/dashboard/supporter-highlights-card";

const SAMPLE_DONATION_LINK = "https://kubistream.link/AS421SKJA";

export default function DashboardLandingPage() {
  return (
    <div className="space-y-10">
      <div className="grid gap-8 xl:grid-cols-[2fr,1fr]">
        <DonationLinkCard link={SAMPLE_DONATION_LINK} />
        <QuickActionsCard />
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <EarningsOverviewCard />
        <SupporterHighlightsCard />
      </div>
    </div>
  );
}
