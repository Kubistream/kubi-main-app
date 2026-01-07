import { NextRequest, NextResponse } from "next/server";
import { broadcastToStreamer } from "@/lib/overlay-ws";

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

    const mockTtsUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

    const overlayPayload = {
      type: "overlay",
      streamerId,
      message,
      mediaType,
      mediaUrl,
      mediaDuration,
      audioUrl: mockTtsUrl,
      donorName: "Test User",
      amount: "0.00",
      tokenSymbol: "TEST",
      tokenLogo: undefined,
      donorAddress: "0x0000000000000000000000000000000000000000",
      sounds: [],
      streamerName: "",
      txHash: "0xTEST",
      mediaDurationSeconds: mediaDuration,
      usdValue: 0,
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
