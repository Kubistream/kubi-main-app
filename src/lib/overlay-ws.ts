import Pusher from "pusher";

let pusher: Pusher | null = null;

type PusherEnv = {
  appId?: string;
  key?: string;
  secret?: string;
  cluster?: string;
};

function loadEnv(): PusherEnv {
  return {
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
  };
}

function getPusher(): Pusher | null {
  if (pusher) return pusher;

  const { appId, key, secret, cluster } = loadEnv();
  if (!appId || !key || !secret || !cluster) {
    console.error(
      "[Overlay] Missing Pusher configuration. Please set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER.",
    );
    return null;
  }

  pusher = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return pusher;
}

/**
 * Initialize Pusher (kept for API compatibility with previous WS init).
 * Port parameter is ignored; Pusher handles connections via its service.
 */
export function initOverlayWebSocket(_port: number = 3001): void {
  const client = getPusher();
  if (client) {
    console.log("[Overlay] Pusher initialized for overlay broadcasting (WS server disabled).");
  }
}

/**
 * Broadcast message to a streamer channel via Pusher.
 * Channel: overlay-{streamerId}
 * Event: "overlay"
 */
export async function broadcastToStreamer(streamerId: string, data: object): Promise<void> {
  const client = getPusher();
  if (!client) return;

  try {
    await client.trigger(`overlay-${streamerId}`, "overlay", data);
    console.log(`[Overlay] Pushed donation event to overlay-${streamerId}`);
  } catch (error) {
    console.error(`[Overlay] Failed to push event for streamerId=${streamerId}:`, error);
  }
}

/**
 * Close Pusher client (noop for compatibility)
 */
export function closeOverlayWebSocket(): void {
  pusher = null;
}
