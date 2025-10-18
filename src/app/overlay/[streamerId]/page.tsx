"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

type OverlayMsg = {
  type: string;
  amount: string;
  donorAddress: string;
  donorName: string;
  message: string;
  sounds: string[];
  streamerName: string;
  tokenSymbol: string;
  txHash: string;
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

export default function OverlayPage() {
  const [queue, setQueue] = useState<OverlayMsg[]>([]);
  const [current, setCurrent] = useState<OverlayMsg | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const streamerId = window.location.pathname.split("/").pop();
    if (!streamerId) return;

    const socket = new WebSocket(`${WS_BASE_URL}/ws/${streamerId}`);

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log("Received message:", msg)
      if (msg.type === "overlay") {
        setQueue(prev => [...prev, msg]);
      }
    };

    return () => socket.close();
  }, []);

  // helper untuk memutar semua audio secara berurutan
  const playAudiosSequentially = async (sounds: string[]) => {
    for (const sound of sounds) {
      await new Promise<void>((resolve) => {
        const audio = new Audio(sound);
        audio.onended = () => resolve();
        audio.play().catch(() => {
          console.log("Autoplay blocked, skip this audio");
          resolve();
        });
      });
    }
  };

  useEffect(() => {
    if (!current && queue.length > 0) {
      const next = queue[0];
      setCurrent(next);
      setQueue(prev => prev.slice(1));
      setVisible(true);

      playAudiosSequentially(next.sounds).then(() => {
        setVisible(false);
        setCurrent(null);
      });
    }
  }, [queue, current]);

  if (!visible || !current) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Gradient border card */}
      <div className="w-full max-w-5xl animated-gradient p-[10px] rounded-2xl shadow-2xl">
        <div className="bg-white rounded-[14px] sm:rounded-[14px] md:rounded-[14px] px-5 sm:px-7 md:px-10 py-5 sm:py-6 md:py-8">
          <div className="flex items-center gap-6 sm:gap-8 md:gap-10">
            {/* Text content */}
            <div className="flex-1 min-w-0 text-neutral-900 animate-pulse">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-medium leading-snug tracking-tight">
                <span className="font-extrabold">{current.donorName}</span> has given you <span className="font-extrabold">{current.amount} {current.tokenSymbol}</span>
              </h1>
              <p className="mt-3 text-base sm:text-lg md:text-xl leading-relaxed text-neutral-700">
                {current.message}
              </p>
            </div>

            {/* Mascot image */}
            <div className="shrink-0 -mb-2 sm:-mb-3 md:-mb-4">
              <Image
                src="/overlay/mascot_overlay.png"
                alt="Mascot"
                width={256}
                height={256}
                priority
                className="h-24 w-auto sm:h-28 md:h-36 lg:h-40 drop-shadow-md"
              />
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-gradient {
          background-image: linear-gradient(90deg, #fb923c, #ec4899, #d946ef);
          background-size: 200% 200%;
          animation: gradientMove 1s ease infinite;
        }
      `}</style>
    </div>
  );
}
