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
    <section id={sectionId} className="bg-[#0f0919]">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-16 text-center">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-lg bg-[#7C3AED] border border-white px-4 py-1 text-sm font-bold uppercase tracking-wider text-white shadow-[2px_2px_0_0_#fff]">
            Demo Video
          </span>
          <h2 className="text-4xl font-black text-white md:text-5xl drop-shadow-[2px_2px_0_#7C3AED]">Quick Guides</h2>
          <p className="text-lg text-slate-300 md:text-xl font-medium max-w-2xl mx-auto">
            Watch a concise walkthrough of how Kubi helps streamers receive and manage Web3 donations.
          </p>
        </div>

        <div className="w-full rounded-2xl border-2 border-white bg-[#181033] p-2 shadow-[8px_8px_0_0_#7C3AED]">
          <div
            className="relative w-full overflow-hidden rounded-xl bg-black"
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
