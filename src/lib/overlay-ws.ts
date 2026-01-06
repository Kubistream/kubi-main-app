import { WebSocketServer, WebSocket } from "ws";

// Map streamerId -> Set of connected clients
const streamerClients = new Map<string, Set<WebSocket>>();

let wss: WebSocketServer | null = null;

/**
 * Initialize WebSocket server for overlay notifications
 * @param port - Port to run WebSocket server on (default: 3001)
 */
export function initOverlayWebSocket(port: number = 3001): WebSocketServer {
  if (wss) return wss;

  wss = new WebSocketServer({ port });

  wss.on("connection", (ws, req) => {
    // Extract streamerId from URL: /ws/overlay/:streamerId
    const urlParts = req.url?.split("/") || [];
    const streamerId = urlParts[urlParts.length - 1];
    
    if (!streamerId || streamerId === "ws" || streamerId === "overlay") {
      ws.close(1008, "Missing streamerId in URL. Use: ws://host:port/ws/overlay/{streamerId}");
      return;
    }

    console.log(`🔌 Overlay client connected: streamerId=${streamerId}`);

    // Register client
    if (!streamerClients.has(streamerId)) {
      streamerClients.set(streamerId, new Set());
    }
    streamerClients.get(streamerId)!.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
      type: "CONNECTED",
      data: { streamerId, timestamp: Date.now() },
    }));

    // Handle ping/pong for connection health
    ws.on("ping", () => {
      ws.pong();
    });

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "PING") {
          ws.send(JSON.stringify({ type: "PONG", timestamp: Date.now() }));
        }
      } catch {
        // Ignore non-JSON messages
      }
    });

    ws.on("close", () => {
      console.log(`🔌 Overlay client disconnected: streamerId=${streamerId}`);
      streamerClients.get(streamerId)?.delete(ws);
      
      // Clean up empty sets
      if (streamerClients.get(streamerId)?.size === 0) {
        streamerClients.delete(streamerId);
      }
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error for streamerId=${streamerId}:`, error);
    });
  });

  console.log(`🔌 Overlay WebSocket server running on port ${port}`);
  return wss;
}

/**
 * Broadcast message to all clients listening to a streamer
 * @param streamerId - The streamer ID to broadcast to
 * @param data - The data object to send
 */
export function broadcastToStreamer(streamerId: string, data: object): void {
  const clients = streamerClients.get(streamerId);
  if (!clients || clients.size === 0) {
    return;
  }

  const message = JSON.stringify(data);
  let sentCount = 0;

  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
      sentCount++;
    }
  });

  if (sentCount > 0) {
    console.log(`📤 Broadcast to ${sentCount} clients for streamerId=${streamerId}`);
  }
}

/**
 * Get count of connected clients for a streamer
 */
export function getClientCount(streamerId: string): number {
  return streamerClients.get(streamerId)?.size || 0;
}

/**
 * Get total connected clients across all streamers
 */
export function getTotalClientCount(): number {
  let total = 0;
  streamerClients.forEach((clients) => {
    total += clients.size;
  });
  return total;
}

/**
 * Close the WebSocket server
 */
export function closeOverlayWebSocket(): void {
  if (wss) {
    wss.close();
    wss = null;
    streamerClients.clear();
    console.log("🔌 Overlay WebSocket server closed");
  }
}
