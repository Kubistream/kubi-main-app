"use client";

import { useEffect, useState } from "react";
import { DonationCard } from "@/components/overlay/donation-card";

type OverlayMsg = {
    type: string;
    amount: string;
    donorAddress: string;
    donorName: string;
    message: string;
    sounds: string[];
    streamerName: string;
    tokenSymbol: string;
    tokenLogo?: string;
    txHash: string;
    mediaType?: 'TEXT' | 'AUDIO' | 'VIDEO';
    mediaUrl?: string;
    mediaDuration?: number; // in seconds
};

type OverlaySettings = {
    theme: string | null;
    animationPreset: string | null;
    displayDuration: number;
    showYieldApy: boolean;
    textToSpeech: boolean;
    minAmountUsd: number;
};

const normalizeWsBaseUrl = (url: string) => {
    if (!url.trim()) return "ws://localhost:8080";
    if (url.includes("://")) return url;
    if (typeof window !== "undefined") {
        const isHttp = window.location.protocol === "http:";
        return `${isHttp ? "ws" : "wss"}://${url}`;
    }
    return `wss://${url}`;
};

const WS_BASE_URL = normalizeWsBaseUrl(
    process.env.NEXT_PUBLIC_OVERLAY_WS_URL ?? "ws://localhost:8080",
).replace(/\/$/, "");

export default function OverlayClient({ settings, streamerId }: { settings: OverlaySettings | null, streamerId: string }) {
    const [queue, setQueue] = useState<OverlayMsg[]>([]);
    const [current, setCurrent] = useState<OverlayMsg | null>(null);
    const [visible, setVisible] = useState(false);

    const theme = (settings?.theme as "Vibrant Dark" | "Minimal Light") ?? "Vibrant Dark";
    const showYieldApy = settings?.showYieldApy ?? true;
    const textToSpeech = settings?.textToSpeech ?? false;

    useEffect(() => {
        // Force transparent background for OBS
        document.body.style.backgroundColor = "transparent";
        return () => {
            document.body.style.backgroundColor = "";
        };
    }, []);

    useEffect(() => {
        if (!streamerId) return;

        const socket = new WebSocket(`${WS_BASE_URL}/ws/${streamerId}`);

        socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                console.log("Received message:", msg)
                if (msg.type === "overlay") {
                    setQueue(prev => [...prev, msg]);
                }
            } catch (e) {
                console.error("Invalid WS message", e);
            }
        };

        socket.onerror = (e) => console.error("WS Error", e);
        socket.onclose = () => console.log("WS Closed");

        return () => socket.close();
    }, [streamerId]);

    const playAudiosSequentially = async (sounds: string[]) => {
        for (const sound of sounds) {
            await new Promise<void>((resolve) => {
                const audio = new Audio(sound);
                audio.onended = () => resolve();
                audio.onerror = () => resolve();
                audio.play().catch(() => resolve());
            });
        }
    };

    const speakMessage = (text: string) => {
        if (!textToSpeech) return Promise.resolve();
        return new Promise<void>((resolve) => {
            if (!window.speechSynthesis) {
                resolve();
                return;
            }
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
        });
    };

    const calculateDuration = (msg: OverlayMsg) => {
        if (msg.mediaType === 'VIDEO' || msg.mediaType === 'AUDIO') {
            // Use media duration + minimal buffer, or default 10s if missing
            return (msg.mediaDuration || 10) + 2;
        }
        const baseDuration = 5;
        const charDuration = (msg.message?.length || 0) * 0.1;
        return Math.max(baseDuration, baseDuration + charDuration);
    };

    useEffect(() => {
        if (!current && queue.length > 0) {
            const next = queue[0];
            setCurrent(next);
            setQueue(prev => prev.slice(1));

            const runSequence = async () => {
                setVisible(true);
                const startTime = Date.now();

                // 1. Play Sounds (alert sounds)
                if (next.sounds && next.sounds.length > 0) {
                    await playAudiosSequentially(next.sounds);
                }

                // 2. TTS (only if not playing audio media, to avoid clash?)
                // Or TTS runs in parallel or before media? Usually before or parallel.
                // Let's run TTS first if no audio media.
                if (textToSpeech && next.message && next.mediaType !== 'AUDIO') {
                    speakMessage(next.message); // don't await to let media auto-play?
                    // actually safer to await if we want to hear it clearly
                    // await speakMessage(next.message);
                }

                // 3. Wait for duration
                const durationSec = calculateDuration(next);
                const elapsedMs = Date.now() - startTime;
                const remainingMs = (durationSec * 1000) - elapsedMs;

                if (remainingMs > 0) {
                    await new Promise(r => setTimeout(r, remainingMs));
                }

                setVisible(false);
                setTimeout(() => setCurrent(null), 1000);
            };

            runSequence();
        }
    }, [queue, current, textToSpeech]);

    if (!visible || !current) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"></div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-display pointer-events-none">
            <div className="pointer-events-auto">
                <DonationCard
                    donorName={current.donorName}
                    amount={current.amount}
                    tokenSymbol={current.tokenSymbol}
                    message={current.message}
                    theme={theme}
                    animationPreset={settings?.animationPreset ?? undefined}
                    showYieldApy={showYieldApy}
                    tokenLogo={current.tokenLogo}
                    mediaType={current.mediaType}
                    mediaUrl={current.mediaUrl}
                />
            </div>
        </div>
    );
}
