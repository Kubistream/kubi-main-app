"use client";
import { useEffect, useState } from "react";

export default function OverlayPage({ params }: { params: { streamerId: string } }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:8080?streamerId=${params.streamerId}`);

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "overlay") {
        setData(message);

        // mainkan audio
        const audio = new Audio(message.sound);
        audio.play();
      }
    };

    return () => socket.close();
  }, [params.streamerId]);

  if (!data) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <img src={data.gif} alt="Overlay Animation" className="w-80 h-80" />
      <div className="absolute bottom-10 text-white text-2xl">{data.message}</div>
    </div>
  );
}
