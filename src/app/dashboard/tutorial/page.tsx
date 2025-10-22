export const revalidate = 0;

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { buildYoutubeEmbedUrl } from "@/lib/youtube";

export default async function DashboardTutorialPage() {
  const tutorialVideo = await prisma.utils.findFirst({
    where: { name: "video-dashboard-tutorial" },
  });

  const embedUrl = tutorialVideo?.value ? buildYoutubeEmbedUrl(tutorialVideo.value) : null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Tutorial</h1>
        <p className="text-sm text-slate-600">
          Learn how to get the most out of the Kubi dashboard with this step-by-step walkthrough.
        </p>
        <p className="text-sm text-slate-600">
           Follow this short guide to set up your profile, connect overlays, and start receiving donations.
        </p>
      </div>

      <Card className="border border-rose-100/80 bg-white/95 shadow-lg shadow-rose-100/60">
        <CardContent>
          {embedUrl ? (
            <div className="aspect-video overflow-hidden rounded-xl border border-rose-100/70">
              <iframe
                className="h-full w-full"
                src={embedUrl}
                title="Kubi dashboard tutorial video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/60 p-8 text-center text-slate-600">
              The tutorial video is not available yet. Please check back soon.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
