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
};

type OverlaySettings = {
    theme: string | null;
    animationPreset: string | null;
    displayDuration: number; // we set default in actions if possible, or here
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

    // Defaults
    const displayDuration = settings?.displayDuration ?? 8;
    const theme = (settings?.theme as "Vibrant Dark" | "Minimal Light") ?? "Vibrant Dark";
    const showYieldApy = settings?.showYieldApy ?? true;
    const textToSpeech = settings?.textToSpeech ?? false;
    const minAmountUsd = settings?.minAmountUsd ?? 0;


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

                // Filter by min amount if applicable (msg usually has raw amount, we might need value in USD)
                // For now, assuming backend filters or we accept all since msg format is simple

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

    // helper untuk memutar semua audio secara berurutan
    const playAudiosSequentially = async (sounds: string[]) => {
        for (const sound of sounds) {
            await new Promise<void>((resolve) => {
                const audio = new Audio(sound);
                audio.onended = () => resolve();
                audio.onerror = () => resolve(); // Skip if error
                audio.play().catch(() => {
                    console.log("Autoplay blocked, skip this audio");
                    resolve();
                });
            });
        }
    };

    // TTS Helper
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

    // Dynamic Duration Calculation
    const calculateDuration = (msg: string | undefined) => {
        const baseDuration = 5; // minimum 5 seconds
        const charDuration = (msg?.length || 0) * 0.1; // 100ms per character
        return Math.max(baseDuration, baseDuration + charDuration);
    };

    useEffect(() => {
        if (!current && queue.length > 0) {
            const next = queue[0];
            setCurrent(next);
            setQueue(prev => prev.slice(1));

            // Start processing immediately
            const runSequence = async () => {
                setVisible(true);
                const startTime = Date.now();

                // 1. Play Sounds
                if (next.sounds && next.sounds.length > 0) {
                    await playAudiosSequentially(next.sounds);
                }

                // 2. TTS
                if (textToSpeech && next.message) {
                    await speakMessage(next.message);
                }

                // 3. Ensure minimum display time based on message length
                const minDurationSec = calculateDuration(next.message);
                const elapsedMs = Date.now() - startTime;
                const remainingMs = (minDurationSec * 1000) - elapsedMs;

                if (remainingMs > 0) {
                    await new Promise(r => setTimeout(r, remainingMs));
                }

                // 4. Hide and cleanup
                setVisible(false);
                setTimeout(() => setCurrent(null), 1000); // Wait for exit animation
            };

            runSequence();
        }
    }, [queue, current, textToSpeech]);

    if (!visible || !current) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        </div>
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
                />
            </div>
        </div>
    );
}
