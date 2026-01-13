import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const text = searchParams.get("text");
  const lang = searchParams.get("lang") || "id";

  if (!text) {
    return NextResponse.json({ error: "Missing 'text' parameter" }, { status: 400 });
  }

  // Build Google TTS URL
  const escapedMessage = encodeURIComponent(text);
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${escapedMessage}&tl=${lang}&client=tw-ob`;

  try {
    // Fetch audio from Google with headers to emulate browser
    const response = await fetch(ttsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": "https://translate.google.com/"
      }
    });

    if (!response.ok) {
      console.error(`[TTS Proxy] Failed to fetch audio: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: "Failed to fetch audio from provider" }, { status: 502 });
    }

    // Stream the audio back to the client
    const audioForClient = response.body;

    return new NextResponse(audioForClient, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable", // Cache heavily
      },
    });

  } catch (error: any) {
    console.error("[TTS Proxy] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
