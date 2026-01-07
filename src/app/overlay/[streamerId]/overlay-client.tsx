"use client";

import { useEffect, useState } from "react";
import Pusher from "pusher-js";
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
  mediaType?: "TEXT" | "AUDIO" | "VIDEO";
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

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

export default function OverlayClient({
  settings,
  streamerId,
}: {
  settings: OverlaySettings | null;
  streamerId: string;
}) {
  const [queue, setQueue] = useState<OverlayMsg[]>([]);
  const [current, setCurrent] = useState<OverlayMsg | null>(null);
  const [visible, setVisible] = useState(false);
  const [playMedia, setPlayMedia] = useState(false); // Controls when video/audio starts playing

  const theme = (settings?.theme as "Vibrant Dark" | "Minimal Light") ?? "Vibrant Dark";
  const showYieldApy = settings?.showYieldApy ?? true;
  const textToSpeech = settings?.textToSpeech ?? true;
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
    if (!PUSHER_KEY || !PUSHER_CLUSTER) {
      console.warn("[Overlay] Missing NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER");
      return;
    }

    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
    });

    const channelName = `overlay-${streamerId}`;
    console.log(`[Overlay] Subscribing to Pusher channel ${channelName}`);

    const channel = pusher.subscribe(channelName);

    const handler = (msg: any) => {
      try {
        const parsed = typeof msg === "string" ? JSON.parse(msg) : msg;

        if (parsed.type === "overlay" || parsed.type === "DONATION") {
          const donationValue =
            typeof parsed.usdValue === "number" ? parsed.usdValue : parseFloat(parsed.usdValue || "0");
          let processedMsg = { ...parsed };

          if (processedMsg.mediaType === "VIDEO" && donationValue < minVideoAmountUsd) {
            console.log(
              `[Overlay] ƒsÿ‹,? Video donation ($${donationValue}) < Min Video ($${minVideoAmountUsd}). Downgrading to TEXT.`,
            );
            processedMsg.mediaType = "TEXT";
            processedMsg.mediaUrl = undefined;
          }

          if (processedMsg.mediaType === "AUDIO" && donationValue < minAudioAmountUsd) {
            console.log(
              `[Overlay] ƒsÿ‹,? Audio donation ($${donationValue}) < Min Audio ($${minAudioAmountUsd}). Downgrading to TEXT.`,
            );
            processedMsg.mediaType = "TEXT";
            processedMsg.mediaUrl = undefined;
          }

          console.log(`[Overlay] Donation Recv: $${donationValue} (Min: $${minAmountUsd})`, processedMsg);

          if (donationValue >= minAmountUsd) {
            console.log("[Overlay] ƒo. Accepted -> Adding to Queue");
            setQueue((prev) => [...prev, processedMsg]);
          } else {
            console.warn(`[Overlay] ƒ?O Skipped: $${donationValue} is below minimum $${minAmountUsd}`);
          }
        } else {
          console.log("[Overlay] Unknown msg type:", parsed);
        }
      } catch (e) {
        console.error("[Overlay] Invalid message:", e);
      }
    };

    channel.bind("donation", handler);

    return () => {
      channel.unbind("donation", handler);
      pusher.unsubscribe(channelName);
      pusher.disconnect();
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
    if (msg.mediaType === "VIDEO" || msg.mediaType === "AUDIO") {
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
      setQueue((prev) => prev.slice(1));
      setPlayMedia(false); // Reset media playback state

      const runSequence = async () => {
        setVisible(true);
        const startTime = Date.now();

        // 1. Play Sounds (alert sounds + server-side TTS)
        // If backend sends sounds, we assume it contains the necessary audio (SFX + TTS)
        if (next.sounds && next.sounds.length > 0) {
          await playAudiosSequentially(next.sounds);
        } else {
          // Fallback: Play client-side alert sound + browser TTS
          // Alert sound from public folder
          try {
            const alertAudio = new Audio("/overlay/sound.mp3");
            await new Promise<void>((resolve) => {
              alertAudio.onended = () => resolve();
              alertAudio.onerror = () => resolve();
              alertAudio.play().catch(() => resolve());
            });
          } catch (e) {
            console.warn("[Overlay] Failed to play alert sound:", e);
          }

          // Browser TTS if enabled and has message
          // Note: Don't restrict to TEXT only, allow TTS for any mediaType with message
          if (textToSpeech && next.message) {
            console.log(`[Overlay] Playing browser TTS: "${next.message}"`);
            await speakMessage(next.message);
          } else {
            console.log(`[Overlay] TTS skipped: textToSpeech=${textToSpeech}, message="${next.message}"`);
          }
        }

        // 2. Start Video/Audio Content (after sounds finish)
        setPlayMedia(true);

        // 3. Wait for duration
        const durationSec = calculateDuration(next);
        const elapsedMs = Date.now() - startTime;

        let remainingMs = 0;
        if (next.mediaType === "VIDEO" || next.mediaType === "AUDIO") {
          // For media, we wait the FULL media duration starting NOW + small buffer for loading
          remainingMs = (next.mediaDuration || 10) * 1000 + 1000;
        } else {
          remainingMs = durationSec * 1000 - elapsedMs;
        }

        if (remainingMs > 0) {
          await new Promise((r) => setTimeout(r, remainingMs));
        }

        setVisible(false);
        setPlayMedia(false);
        setTimeout(() => setCurrent(null), 1000);
      };

      runSequence();
    }
  }, [queue, current, textToSpeech]);

  if (!visible || !current)
    return (
      <div
        suppressHydrationWarning
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      ></div>
    );

  return (
    <div
      suppressHydrationWarning
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-display pointer-events-none"
    >
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
