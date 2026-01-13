/**
 * Donation Queue Processor (Database-Based)
 *
 * Processes donation events from database queue (no RabbitMQ needed).
 * Uses Prisma + PostgreSQL as the queue backend.
 *
 * Usage:
 *   tsx src/workers/donation-queue-processor.ts
 *
 * Environment Variables:
 *   DATABASE_URL -> PostgreSQL connection string
 *   PUSHER_APP_ID -> Pusher app ID for overlay broadcast
 *   PUSHER_KEY -> Pusher key
 *   PUSHER_SECRET -> Pusher secret
 *   PUSHER_CLUSTER -> Pusher cluster
 *
 * How it works:
 *   1. Poll QueueOverlay table for pending donations
 *   2. Process each donation (enrich with metadata)
 *   3. Broadcast to overlay via Pusher
 *   4. Mark as processed
 */

import * as dotenv from "dotenv";
import path from "path";

// Load environment variables before other imports
dotenv.config({ path: path.resolve(process.cwd(), "env", ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import Pusher from "pusher";
import { MediaType, OverlayStatus } from "@prisma/client";

const { prisma } = await import("../lib/prisma");
const { textToSpeechUrl, generateDonationMessage } = await import("../services/tts");

const { loadAlertSound } = await import("../utils/sound");
const { sanitizeMediaUrl } = await import("../utils/media-validation");

// Initialize Pusher for overlay broadcast
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.PUSHER_CLUSTER || "mt1",
  useTLS: true,
});

// Polling interval (milliseconds)
const POLL_INTERVAL = 1000; // 1 second
const BATCH_SIZE = 10; // Process 10 items at a time

/**
 * Get user display name by wallet address
 */
async function getUserDisplayNameByWallet(address: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { wallet: address.toLowerCase() },
    select: { displayName: true },
  });
  return user?.displayName || "";
}

/**
 * Get token data by ID
 */
async function getTokenData(tokenId: string): Promise<{
  symbol: string;
  logoURI: string;
  decimals: number;
}> {
  const token = await prisma.token.findUnique({
    where: { id: tokenId },
    select: { symbol: true, logoURI: true, decimals: true },
  });
  return {
    symbol: token?.symbol || "",
    logoURI: token?.logoURI || "",
    decimals: token?.decimals || 18,
  };
}

/**
 * Process a single QueueOverlay item
 */
async function processQueueOverlay(queueId: string): Promise<void> {
  // Get queue item with related data
  const queueItem = await prisma.queueOverlay.findUnique({
    where: { id: queueId },
    include: {
      tokenIn: true,
      streamer: {
        include: {
          user: true,
        },
      },
      link: true,
    },
  });

  if (!queueItem) {
    console.warn(`⚠️ QueueOverlay ${queueId} not found`);
    return;
  }

  try {
    // Get donation details for enrichment
    const donation = await prisma.donation.findFirst({
      where: { txHash: queueItem.txHash },
      select: {
        donorWallet: true,
        mediaType: true,
        mediaUrl: true,
        mediaDuration: true,
        amountInUsd: true,
        message: true,
      },
    });

    // Get streamer info
    let streamerName = "";
    if (queueItem.streamer?.userId) {
      const streamerUser = await prisma.user.findUnique({
        where: { id: queueItem.streamer.userId },
        select: { wallet: true, displayName: true },
      });
      if (streamerUser) {
        streamerName = streamerUser.displayName || "";
      }
    }

    // Get donor name
    const donorName = donation?.donorWallet
      ? await getUserDisplayNameByWallet(donation.donorWallet)
      : "Anonymous";

    // Get token info
    const { symbol: tokenSymbol, logoURI: tokenLogo, decimals } = await getTokenData(queueItem.tokenInId);

    // Format amount
    const amountInRaw = queueItem.amountInRaw;
    const amountInFormatted = (parseFloat(amountInRaw) / Math.pow(10, decimals)).toLocaleString('en-US', {
      maximumFractionDigits: 4,
    });

    // Calculate USD value
    let amountInUsd = 0;
    if (donation?.amountInUsd) {
      amountInUsd = Number(donation.amountInUsd);
    }

    // Build sounds array
    const sounds: string[] = [];

    try {
      // 1. Mandatory Alert Sound (Always first)
      const alertSound = await loadAlertSound();
      sounds.push(alertSound);

      // 2. TTS Logic (Only for TEXT type with message)
      if (donation?.mediaType === MediaType.TEXT && donation.message) {
        // A. System Notification TTS (e.g. "User has donated...")
        const notificationMessage = generateDonationMessage(
          donorName,
          amountInFormatted,
          tokenSymbol
        );
        try {
          const notificationTts = await textToSpeechUrl(notificationMessage, "en");
          sounds.push(notificationTts);
        } catch (ttsError) {
          console.warn("[TTS] Failed to generate notification TTS:", ttsError);
        }

        // B. User Message TTS (Indonesian)
        try {
          const messageTts = await textToSpeechUrl(donation.message, "id");
          sounds.push(messageTts);
        } catch (ttsError) {
          console.warn("[TTS] Failed to generate message TTS:", ttsError);
        }
      }
    } catch (soundError) {
      console.error("[Sound] Failed to load sounds:", soundError);
    }

    // Build overlay payload
    const overlayPayload = {
      type: "overlay",
      amount: amountInFormatted,
      donorAddress: donation?.donorWallet || "",
      donorName: donorName,
      message: donation?.message || queueItem.message || "",
      sounds: sounds,
      streamerName: streamerName,
      tokenSymbol: tokenSymbol,
      tokenLogo: tokenLogo,
      txHash: queueItem.txHash,
      mediaType: donation?.mediaType || MediaType.TEXT,
      mediaUrl: sanitizeMediaUrl(donation?.mediaUrl),
      mediaDuration: donation?.mediaDuration || 0,
      usdValue: amountInUsd,
    };

    // Broadcast via Pusher
    const streamerId = queueItem.streamerId;
    if (streamerId) {
      await pusher.trigger(`overlay-${streamerId}`, "overlay", overlayPayload);
    }

    // Mark as processed
    await prisma.queueOverlay.update({
      where: { id: queueId },
      data: { status: OverlayStatus.DISPLAYED },
    });
  } catch (error: any) {
    console.error(`❌ Error processing QueueOverlay ${queueId}:`, error);

    // Mark as ON_PROCESS (failed)
    await prisma.queueOverlay.update({
      where: { id: queueId },
      data: { status: OverlayStatus.ON_PROCESS },
    });
  }
}

/**
 * Main polling loop
 */
async function processPendingQueueOverlays(): Promise<void> {
  try {
    // Fetch pending items
    const pendingItems = await prisma.queueOverlay.findMany({
      where: { status: OverlayStatus.PENDING },
      take: BATCH_SIZE,
      orderBy: { timestamp: "asc" },
    });

    if (pendingItems.length === 0) {
      // No items to process
      return;
    }

    // Process each item
    for (const item of pendingItems) {
      await processQueueOverlay(item.id);
    }
  } catch (error: any) {
    console.error("❌ Error in polling loop:", error);
  }
}

/**
 * Main function to start the processor
 */
async function main() {
  console.log("🚀 Starting Kubi Donation Queue Processor...");



  // Start polling loop
  const interval = setInterval(async () => {
    await processPendingQueueOverlays();
  }, POLL_INTERVAL);

  // Run once immediately on startup
  await processPendingQueueOverlays();


  console.log("✅ Donation queue processor started");

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down gracefully...");
    clearInterval(interval);

    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Shutting down gracefully...");
    clearInterval(interval);

    process.exit(0);
  });
}

// Start the processor
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
