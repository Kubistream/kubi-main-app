type LandingVideoProps = {
  videoUrl: string;
  sectionId?: string;
};

function buildYoutubeEmbedUrl(videoUrl: string) {
  try {
    const url = new URL(videoUrl);

    if (url.hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) {
        return videoUrl;
      }

      const videoId = url.searchParams.get("v");
      if (!videoId) return null;

      const params = new URLSearchParams();
      for (const key of url.searchParams.keys()) {
        if (key === "v") continue;
        const value = url.searchParams.get(key);
        if (value) params.set(key, value);
      }

      const query = params.toString();
      return `https://www.youtube.com/embed/${videoId}${query ? `?${query}` : ""}`;
    }

    if (url.hostname === "youtu.be") {
      const videoId = url.pathname.replace("/", "");
      if (!videoId) return null;

      const query = url.searchParams.toString();
      return `https://www.youtube.com/embed/${videoId}${query ? `?${query}` : ""}`;
    }

    return null;
  } catch {
    return null;
  }
}

export function LandingVideo({ videoUrl, sectionId = "landing-video" }: LandingVideoProps) {
  const embedUrl = buildYoutubeEmbedUrl(videoUrl);

  if (!embedUrl) {
    return null;
  }

  return (
    <section id={sectionId} className="bg-white/90">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-16 text-center">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-600">
            Demo Video
          </span>
          <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">Guides</h2>
          <p className="text-base text-slate-600 md:text-lg">
            Watch a brief explanation of how Kubi helps streamers receive and manage Web3 donations.
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
