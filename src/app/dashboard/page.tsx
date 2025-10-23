import { cookies } from "next/headers";

import { DonationLinkCard } from "@/components/features/dashboard/donation-link-card";
import { EarningsOverviewCard } from "@/components/features/dashboard/earnings-overview-card";
import { AutoYieldPositionsCard } from "@/components/features/dashboard/auto-yield-positions-card";
import { QuickActionsCard } from "@/components/features/dashboard/quick-actions-card";
import { SupporterHighlightsCard } from "@/components/features/dashboard/supporter-highlights-card";
import { env } from "@/lib/env";

const SAMPLE_DONATION_LINK = "https://kubistream.link-sample-fail/AS421SKJA";
const API_TIMEOUT_MS = 4000;

async function resolveDonationLink(): Promise<string> {
  const baseUrl = env.NEXT_PUBLIC_APP_URL ?? env.APP_URL;
  if (!baseUrl) {
    return SAMPLE_DONATION_LINK;
  }

  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const cookieHeader = (await cookies())
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  if (!cookieHeader) {
    return SAMPLE_DONATION_LINK;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(`${normalizedBase}/api/streamers/me`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
      signal: controller.signal,
      credentials: "include",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return SAMPLE_DONATION_LINK;
    }

    const data = (await response.json()) as {
      streamer?: { id?: string | null; userId?: string | null } | null;
    };

    const userId = data.streamer?.userId ?? data.streamer?.id ?? null;
    if (!userId) {
      return SAMPLE_DONATION_LINK;
    }

    return `${normalizedBase}/donate/${userId}`;
  } catch (error) {
    console.error("Failed to resolve donation link", error);
    return SAMPLE_DONATION_LINK;
  }
}

export default async function DashboardLandingPage() {
  const donationLink = await resolveDonationLink();

  return (
    <div className="space-y-10">
      <div className="grid gap-8 xl:grid-cols-[2fr,1fr]">
        <DonationLinkCard link={donationLink} />
        {/* <QuickActionsCard /> */}
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <EarningsOverviewCard />
        {/* <SupporterHighlightsCard /> */}
      </div>

      <AutoYieldPositionsCard />
    </div>
  );
}
