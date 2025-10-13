import { WebSocketServer, WebSocket } from "ws";

type Client = {
  streamerId: string;
  socket: WebSocket;
};

const clients: Client[] = [];

export const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (socket, req) => {
  const url = new URL(req.url ?? "", `http://${req.headers.host}`);
  const streamerId = url.searchParams.get("streamerId");

  if (!streamerId) {
    socket.close();
    return;
  }

  clients.push({ streamerId, socket });

  socket.on("close", () => {
    const index = clients.findIndex((c) => c.socket === socket);
    if (index !== -1) clients.splice(index, 1);
  });
});

export function broadcastToStreamer(streamerId: string, data: any) {
  const json = JSON.stringify(data);
  clients
    .filter((c) => c.streamerId === streamerId)
    .forEach((c) => c.socket.send(json));
}
