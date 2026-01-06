import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            streamerId,
            mediaType = "TEXT",
            message,
            mediaUrl,
            mediaDuration = 0
        } = body;

        if (!streamerId) {
            return NextResponse.json({ error: "Missing streamerId" }, { status: 400 });
        }

        // 🔊 Simulasi Generate Sound Effect / TTS
        // Di real implementation, ini bisa memanggil API TTS external (e.g. OpenAI TTS, Google TTS)
        const mockTtsUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

        // Payload yang akan dikirim ke Overlay
        const overlayPayload = {
            type: "overlay", // Gunakan type yang sama dengan save-donation agar ditangkap client
            streamerId,
            message,
            mediaType,
            mediaUrl,
            mediaDuration,
            audioUrl: mockTtsUrl,
            // Field tambahan agar kompatibel dengan overlay-client type definition jika perlu
            donorName: "Test User",
            amount: "0.00",
            tokenSymbol: "TEST",
            timestamp: new Date().toISOString(),
        };

        // 📡 Kirim ke WebSocket Server (Local Proxy)
        // Pastikan WS Server berjalan di port 8080 atau sesuaikan URL
        const wsUrl = process.env.NEXT_PUBLIC_OVERLAY_WS_URL || "http://localhost:8080/broadcast";

        // Note: save-donation hardcodes to http://localhost:8080/broadcast. 
        // But for this test endpoint, we target the specific test route on the backend.
        const broadcastUrl = "http://localhost:8080/overlay/test";

        console.log(`🚀 Sending broadcast to ${broadcastUrl} for streamer ${streamerId}`);

        const wsResponse = await fetch(broadcastUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ streamerId, message: overlayPayload }),
        });

        if (!wsResponse.ok) {
            console.error("Failed to send to WS server", await wsResponse.text());
            // We don't throw to caller, but we log it
        } else {
            console.log("✅ Payload sent to WebSocket server");
        }

        return NextResponse.json({
            success: true,
            message: "Test payload processed",
            data: overlayPayload
        });

    } catch (error: any) {
        console.error("❌ Error in /overlay/test:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
