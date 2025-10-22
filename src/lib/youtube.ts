export function buildYoutubeEmbedUrl(videoUrl: string) {
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
