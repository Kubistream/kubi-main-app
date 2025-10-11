import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { broadcastToStreamer } from "./websocket";

async function processQueue() {
  const pending = await prisma.queueOverlay.findMany({
    where: { status: "PENDING" },
    include: { streamer: true },
  });

  for (const item of pending) {
    const gifPath = path.join(process.cwd(), "public", "overlay", "sample.gif");
    const soundPath = path.join(process.cwd(), "public", "overlay", "sound.mp3");

    const gifBase64 = fs.readFileSync(gifPath, { encoding: "base64" });
    const soundBase64 = fs.readFileSync(soundPath, { encoding: "base64" });

    broadcastToStreamer(item.streamerId!, {
      type: "overlay",
      gif: `data:image/gif;base64,${gifBase64}`,
      sound: `data:audio/mp3;base64,${soundBase64}`,
      message: item.message,
      amount: item.amountInRaw,
      txHash: item.txHash,
    });

    await prisma.queueOverlay.update({
      where: { id: item.id },
      data: { status: "SENT" },
    });
  }
}

// jalan setiap 3 detik
setInterval(processQueue, 3000);
