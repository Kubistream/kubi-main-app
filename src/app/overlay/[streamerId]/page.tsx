"use client";
import { useEffect, useState } from "react";

export default function OverlayPage() {
  const [data, setData] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const streamerId = window.location.pathname.split("/").pop();
    if (!streamerId) return;

    const socket = new WebSocket(`ws://localhost:8080/ws/${streamerId}`);

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "overlay") {
        setData(msg);
        setVisible(true);

        const audio = new Audio(msg.sound);
        audio.play().catch(() => console.log("Autoplay blocked"));

        setTimeout(() => setVisible(false), 10000);
      }
    };

    return () => socket.close();
  }, []);

  if (!visible || !data) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
      <img src={data.gif} alt="Overlay Animation" className="w-80 h-80" />
      <div className="absolute mt-4 text-black text-2xl drop-shadow-lg animate-pulse">
        {data.message}
      </div>
    </div>
  );
}
