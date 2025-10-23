import { buildYoutubeEmbedUrl } from "@/lib/youtube";

type LandingVideoProps = {
  videoUrl: string;
  sectionId?: string;
};

export function LandingVideo({ videoUrl, sectionId = "landing-video" }: LandingVideoProps) {
  const embedUrl = buildYoutubeEmbedUrl(videoUrl);

  if (!embedUrl) {
    return null;
  }

  return (
    <section id={sectionId} className="bg-white/90">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-16 text-center">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full bg-rose-100 px-4 py-1 text-sm font-semibold uppercase tracking-wider text-rose-600 sm:text-base">
            Demo Video
          </span>
          <h2 className="text-4xl font-semibold text-slate-900 md:text-5xl">Quick Guides</h2>
          <p className="text-lg text-slate-600 md:text-xl">
            Watch a concise walkthrough of how Kubi helps streamers receive and manage Web3 donations.
          </p>
        </div>

        <div className="w-full rounded-2xl border border-rose-100/70 bg-white/90 p-4 shadow-lg shadow-rose-100/60">
          <div
            className="relative w-full overflow-hidden rounded-xl"
            style={{ paddingBottom: "56.25%" }}
          >
            <iframe
              className="absolute left-0 top-0 h-full w-full rounded-xl"
              src={embedUrl}
              title="Video demo Kubi"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
