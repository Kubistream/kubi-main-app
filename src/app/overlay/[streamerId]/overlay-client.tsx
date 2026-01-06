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
    usdValue?: number; // For filtering min amount
};

type OverlaySettings = {
    theme: string | null;
    animationPreset: string | null;
    displayDuration: number;
    showYieldApy: boolean;
    textToSpeech: boolean;
    minAmountUsd: number;
    minAudioAmountUsd: number;
    minVideoAmountUsd: number;
};

const normalizeWsBaseUrl = (url: string) => {
    if (!url.trim()) return "ws://localhost:3001";
    if (url.includes("://")) return url;
    if (typeof window !== "undefined") {
        const isHttp = window.location.protocol === "http:";
        return `${isHttp ? "ws" : "wss"}://${url}`;
    }
    return `wss://${url}`;
};

const WS_BASE_URL = normalizeWsBaseUrl(
    process.env.NEXT_PUBLIC_OVERLAY_WS_URL ?? "ws://localhost:3001",
).replace(/\/$/, "");

export default function OverlayClient({ settings, streamerId }: { settings: OverlaySettings | null, streamerId: string }) {
    const [queue, setQueue] = useState<OverlayMsg[]>([]);
    const [current, setCurrent] = useState<OverlayMsg | null>(null);
    const [visible, setVisible] = useState(false);
    const [playMedia, setPlayMedia] = useState(false); // Controls when video/audio starts playing

    const theme = (settings?.theme as "Vibrant Dark" | "Minimal Light") ?? "Vibrant Dark";
    const showYieldApy = settings?.showYieldApy ?? true;
    const textToSpeech = settings?.textToSpeech ?? false;
    const minAmountUsd = settings?.minAmountUsd ?? 0;
    const minAudioAmountUsd = settings?.minAudioAmountUsd ?? 0;
    const minVideoAmountUsd = settings?.minVideoAmountUsd ?? 0;

    useEffect(() => {
        // Force transparent background for OBS
        document.body.style.backgroundColor = "transparent";
        return () => {
            document.body.style.backgroundColor = "";
        };
    }, []);

    useEffect(() => {
        if (!streamerId) return;

        let socket: WebSocket | null = null;
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            console.log(`[Overlay] Connecting to WS: ${WS_BASE_URL}/ws/${streamerId}`);
            socket = new WebSocket(`${WS_BASE_URL}/ws/${streamerId}`);

            socket.onopen = () => {
                console.log("[Overlay] WS Connected");
            };

            socket.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);

                    // Filter donation based on Min Amount USD
                    // Support both "overlay" and "DONATION" types
                    if (msg.type === "overlay" || msg.type === "DONATION") {
                        const donationValue = typeof msg.usdValue === 'number' ? msg.usdValue : parseFloat(msg.usdValue || '0');
                        let processedMsg = { ...msg };

                        // Check Media Thresholds
                        // If VIDEO but value < minVideo -> Downgrade to TEXT
                        if (processedMsg.mediaType === 'VIDEO' && donationValue < minVideoAmountUsd) {
                            console.log(`[Overlay] ⚠️ Video donation ($${donationValue}) < Min Video ($${minVideoAmountUsd}). Downgrading to TEXT.`);
                            processedMsg.mediaType = 'TEXT';
                            processedMsg.mediaUrl = undefined;
                        }

                        // If AUDIO but value < minAudio -> Downgrade to TEXT
                        if (processedMsg.mediaType === 'AUDIO' && donationValue < minAudioAmountUsd) {
                            console.log(`[Overlay] ⚠️ Audio donation ($${donationValue}) < Min Audio ($${minAudioAmountUsd}). Downgrading to TEXT.`);
                            processedMsg.mediaType = 'TEXT';
                            processedMsg.mediaUrl = undefined;
                        }

                        console.log(`[Overlay] Donation Recv: $${donationValue} (Min: $${minAmountUsd})`, processedMsg);

                        if (donationValue >= minAmountUsd) {
                            console.log("[Overlay] ✅ Accepted -> Adding to Queue");
                            setQueue(prev => [...prev, processedMsg]);
                        } else {
                            console.warn(`[Overlay] ❌ Skipped: $${donationValue} is below minimum $${minAmountUsd}`);
                        }
                    } else {
                        console.log("[Overlay] Unknown msg type:", msg);
                    }
                } catch (e) {
                    console.error("[Overlay] Invalid JSON:", e);
                }
            };

            socket.onerror = (e) => {
                console.error("[Overlay] WS Error", e);
            };

            socket.onclose = () => {
                console.log("[Overlay] WS Closed. Reconnecting in 3s...");
                reconnectTimeout = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            if (socket) {
                socket.onclose = null; // Prevent reconnect loop on unmount
                socket.close();
            }
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, [streamerId, minAmountUsd, minAudioAmountUsd, minVideoAmountUsd]);

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
            setPlayMedia(false); // Reset media playback state

            const runSequence = async () => {
                setVisible(true);
                const startTime = Date.now();

                // 1. Play Sounds (alert sounds + server-side TTS)
                // If backend sends sounds, we assume it contains the necessary audio (SFX + TTS)
                if (next.sounds && next.sounds.length > 0) {
                    await playAudiosSequentially(next.sounds);
                } else if (textToSpeech && next.message && next.mediaType === 'TEXT') {
                    // Fallback: Browser TTS if no server sounds provided
                    await speakMessage(next.message);
                }

                // 2. Start Video/Audio Content (after sounds finish)
                setPlayMedia(true);

                // 3. Wait for duration
                const durationSec = calculateDuration(next);
                const elapsedMs = Date.now() - startTime;

                let remainingMs = 0;
                if (next.mediaType === 'VIDEO' || next.mediaType === 'AUDIO') {
                    // For media, we wait the FULL media duration starting NOW + small buffer for loading
                    remainingMs = ((next.mediaDuration || 10) * 1000) + 1000;
                } else {
                    remainingMs = (durationSec * 1000) - elapsedMs;
                }

                if (remainingMs > 0) {
                    await new Promise(r => setTimeout(r, remainingMs));
                }

                setVisible(false);
                setPlayMedia(false);
                setTimeout(() => setCurrent(null), 1000);
            };

            runSequence();
        }
    }, [queue, current, textToSpeech]);

    if (!visible || !current) return (
        <div suppressHydrationWarning className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"></div>
    );

    return (
        <div suppressHydrationWarning className="fixed inset-0 z-50 flex items-center justify-center p-4 font-display pointer-events-none">
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
                    playMedia={playMedia}
                />
            </div>
        </div>
    );
}
