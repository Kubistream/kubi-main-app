"use client";
import { useEffect, useState } from "react";

type OverlayMsg = {
  id: string;
  gif: string;
  sounds: string[]; // array audio URL/base64
  message: string;
  amount: number;
  txHash: string;
};

export default function OverlayPage() {
  const [queue, setQueue] = useState<OverlayMsg[]>([]);
  const [current, setCurrent] = useState<OverlayMsg | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const streamerId = window.location.pathname.split("/").pop();
    if (!streamerId) return;

    const socket = new WebSocket(`ws://localhost:8080/ws/${streamerId}`);

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
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
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
      <img src={current.gif} alt="Overlay Animation" className="w-80 h-80" />
      <div className="absolute mt-4 text-black text-2xl drop-shadow-lg animate-pulse">
        {current.message}
      </div>
    </div>
  );
}
