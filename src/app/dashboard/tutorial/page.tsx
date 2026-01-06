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
      <header className="space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-accent-cyan">Tutorial</p>
        <h1 className="text-3xl font-black text-white font-display">Learn the basics</h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Learn how to get the most out of the Kubi dashboard with this step-by-step walkthrough.
          Follow this short guide to set up your profile, connect overlays, and start receiving donations.
        </p>
      </header>

      <Card>
        <CardContent>
          {embedUrl ? (
            <div className="aspect-video overflow-hidden rounded-xl border-2 border-[#2D2452]">
              <iframe
                className="h-full w-full"
                src={embedUrl}
                title="Kubi dashboard tutorial video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-[#2D2452] bg-[#0B061D] p-8 text-center text-slate-400">
              The tutorial video is not available yet. Please check back soon.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

