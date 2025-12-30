"use server";

import { cookies } from "next/headers";
import { getIronSession, IronSession } from "iron-session";
import { sessionOptions, resolveAuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type OverlaySettingsData = {
    theme: string;
    animationPreset: string;
    minAmountUsd: number;
    showYieldApy: boolean;
    textToSpeech: boolean;
    obsUrl?: string;
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
                // @ts-ignore
                showYieldApy: true,
                // @ts-ignore
                textToSpeech: false,
            },
        });
    }

    return {
        theme: settings.theme ?? "Vibrant Dark",
        animationPreset: settings.animationPreset ?? "Slide In Left",
        minAmountUsd: settings.minAmountUsd,
        // @ts-ignore
        showYieldApy: settings.showYieldApy ?? true,
        // @ts-ignore
        textToSpeech: settings.textToSpeech ?? false,
        obsUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://cryptostream.io"}/overlay/${streamerId}`,
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
            // @ts-ignore
            showYieldApy: data.showYieldApy,
            // @ts-ignore
            textToSpeech: data.textToSpeech,
        },
    });

    return updated;
}

export async function sendTestAlert() {
    const session = await getIronSession(await cookies(), sessionOptions);
    const sessionRecord = await resolveAuthenticatedUser(session);

    if (!sessionRecord || sessionRecord.user.role !== "STREAMER" || !sessionRecord.user.streamer) {
        throw new Error("Unauthorized");
    }

    const streamerId = sessionRecord.user.streamer.id;

    // Construct a mock donation message
    const message = {
        type: "overlay",
        amount: "50000",
        donorAddress: "0x123...abc",
        donorName: "Satoshi_Naka",
        message: "Great stream! HODL forever. Can you check out the new L2 chain?",
        sounds: [], // Add sounds if needed
        streamerName: sessionRecord.user.displayName,
        tokenSymbol: "IDRXkb",
        tokenLogo: "https://s2.coinmarketcap.com/static/img/coins/128x128/26732.png",
        txHash: "0xmockhash",
    };

    try {
        await fetch("http://localhost:8080/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ streamerId, message }),
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
