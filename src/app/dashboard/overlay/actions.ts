"use server";

import { cookies } from "next/headers";
import { getIronSession, IronSession } from "iron-session";
import { sessionOptions, resolveAuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type OverlaySettingsData = {
    theme: string;
    animationPreset: string;
    minAmountUsd: number;
    minAudioAmountUsd: number;
    minVideoAmountUsd: number;
    showYieldApy: boolean;
    textToSpeech: boolean;
    obsUrl?: string;
    donateUrl?: string;
    streamerName?: string;
    streamerId?: string;
}

export async function getOverlaySettings() {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);
    const sessionRecord = await resolveAuthenticatedUser(session);

    if (!sessionRecord || sessionRecord.user.role !== "STREAMER" || !sessionRecord.user.streamer) {
        return null;
    }

    const streamerId = sessionRecord.user.streamer.id;

    let settings = await prisma.overlaySettings.findUnique({
        where: { streamerId },
    });

    if (!settings) {
        settings = await prisma.overlaySettings.create({
            data: {
                streamerId,
                theme: "Vibrant Dark",
                animationPreset: "Slide In Left",
                showLeaderboard: true,
                minAmountUsd: 5,
                minAudioAmountUsd: 10,
                minVideoAmountUsd: 20,
                // @ts-ignore
                showYieldApy: true,
                // @ts-ignore
                textToSpeech: false,
            },
        });
    }

    // Get user ID for donate URL
    const donateChannel = sessionRecord.user.id;

    return {
        theme: settings.theme ?? "Vibrant Dark",
        animationPreset: settings.animationPreset ?? "Slide In Left",
        minAmountUsd: settings.minAmountUsd,
        minAudioAmountUsd: settings.minAudioAmountUsd,
        minVideoAmountUsd: settings.minVideoAmountUsd,
        // @ts-ignore
        showYieldApy: settings.showYieldApy ?? true,
        // @ts-ignore
        textToSpeech: settings.textToSpeech ?? false,
        obsUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://cryptostream.io"}/overlay/${streamerId}`,
        donateUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://cryptostream.io"}/donate/${donateChannel}`,
        streamerName: sessionRecord.user.displayName || sessionRecord.user.username || "Streamer",
        streamerId
    };
}

export async function updateOverlaySettings(data: Partial<OverlaySettingsData>) {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);
    const sessionRecord = await resolveAuthenticatedUser(session);

    if (!sessionRecord || sessionRecord.user.role !== "STREAMER" || !sessionRecord.user.streamer) {
        throw new Error("Unauthorized");
    }

    const streamerId = sessionRecord.user.streamer.id;

    const updated = await prisma.overlaySettings.update({
        where: { streamerId },
        data: {
            theme: data.theme,
            animationPreset: data.animationPreset,
            minAmountUsd: data.minAmountUsd,
            minAudioAmountUsd: data.minAudioAmountUsd,
            minVideoAmountUsd: data.minVideoAmountUsd,
            // @ts-ignore
            showYieldApy: data.showYieldApy,
            // @ts-ignore
            textToSpeech: data.textToSpeech,
        },
    });

    return updated;
}

export async function sendTestAlert(type: "TEXT" | "AUDIO" | "VIDEO" = "TEXT") {
    const session = await getIronSession(await cookies(), sessionOptions);
    const sessionRecord = await resolveAuthenticatedUser(session);

    if (!sessionRecord || sessionRecord.user.role !== "STREAMER" || !sessionRecord.user.streamer) {
        throw new Error("Unauthorized");
    }

    const streamerId = sessionRecord.user.streamer.id;

    let mediaUrl: string | undefined;
    let mediaDuration = 0;
    const messageText = type === "TEXT"
        ? "Great stream! HODL forever. Can you check out the new L2 chain?"
        : "";

    if (type === "VIDEO") {
        mediaUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        mediaDuration = 15;
    } else if (type === "AUDIO") {
        mediaUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
        mediaDuration = 10;
    }

    // Use the backend test endpoint which handles TTS generation and overlay payload construction
    const payload = {
        streamerId,
        mediaType: type,
        message: messageText,
        mediaUrl,
        mediaDuration
    };

    try {
        // Change from /broadcast to /overlay/test per user request
        await fetch("http://localhost:3001/overlay/test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to send test alert to WS server:", error);
        return { success: false, error: "Failed to connect to Overlay Server" };
    }
}

export async function getPublicOverlaySettings(streamerId: string) {
    const settings = await prisma.overlaySettings.findUnique({
        where: { streamerId },
    });
    return settings;
}
