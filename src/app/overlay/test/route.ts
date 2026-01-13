import { NextRequest, NextResponse } from "next/server";
import { broadcastToStreamer } from "@/lib/overlay-ws";
// Audio storage is handled inside the handler to avoid cold start issues if needed, or just standard import


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      streamerId,
      mediaType = "TEXT",
      message,
      mediaUrl,
      mediaDuration = 0,
    } = body;

    if (!streamerId) {
      return NextResponse.json({ error: "Missing streamerId" }, { status: 400 });
    }

    // Generate real audio using the new URL system
    const { loadAlertSound } = await import("@/utils/sound");
    const { textToSpeechUrl, generateDonationMessage } = await import("@/services/tts");

    const sounds: string[] = [];
    
    // 1. Alert Sound
    const alertSound = await loadAlertSound();
    sounds.push(alertSound);

    // 2. TTS
    if (mediaType === "TEXT" && message) {
        try {
            const notificationMsg = generateDonationMessage("Test User", "100", "TEST");
            const notificationTts = await textToSpeechUrl(notificationMsg, "en");
            sounds.push(notificationTts);

            const messageTts = await textToSpeechUrl(message, "id");
            sounds.push(messageTts);
        } catch (error) {
            console.warn("Failed to generate test TTS:", error);
        }
    }

    const overlayPayload = {
      type: "overlay",
      streamerId,
      message,
      mediaType,
      mediaUrl,
      mediaDuration,
      audioUrl: undefined, // Deprecated in favor of sounds array
      donorName: "Test User",
      amount: "100",
      tokenSymbol: "TEST",
      tokenLogo: undefined,
      donorAddress: "0x0000000000000000000000000000000000000000",
      sounds: sounds,
      streamerName: "Streamer",
      txHash: "0xTEST",
      mediaDurationSeconds: mediaDuration,
      usdValue: 10,
    };

    await broadcastToStreamer(streamerId, overlayPayload);
    console.log(`ƒo. Test payload pushed to overlay channel for ${streamerId}`);

    return NextResponse.json({
      success: true,
      message: "Test payload processed",
      data: overlayPayload,
    });
  } catch (error: any) {
    console.error("ƒ?O Error in /overlay/test:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
