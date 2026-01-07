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

import { prisma } from "../lib/prisma";
import Pusher from "pusher";
import { MediaType, OverlayStatus } from "@prisma/client";

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
      streamer: true,
      link: true,
    },
  });

  if (!queueItem) {
    console.warn(`⚠️ QueueOverlay ${queueId} not found`);
    return;
  }

  console.log(`📩 Processing QueueOverlay: ${queueId} (TxHash=${queueItem.txHash})`);

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
    const streamerName = queueItem.streamer?.user
      ? (await getUserDisplayNameByWallet(queueItem.streamer.user.wallet))
      : "";

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

    // Build overlay payload
    const overlayPayload = {
      type: "overlay",
      amount: amountInFormatted,
      donorAddress: donation?.donorWallet || "",
      donorName: donorName,
      message: donation?.message || queueItem.message || "",
      sounds: [],
      streamerName: streamerName,
      tokenSymbol: tokenSymbol,
      tokenLogo: tokenLogo,
      txHash: queueItem.txHash,
      mediaType: donation?.mediaType || MediaType.TEXT,
      mediaUrl: donation?.mediaUrl,
      mediaDuration: donation?.mediaDuration || 0,
      usdValue: amountInUsd,
    };

    // Broadcast via Pusher
    const streamerId = queueItem.streamerId;
    if (streamerId) {
      await pusher.trigger(`overlay-${streamerId}`, "overlay", overlayPayload);
      console.log(`✅ Overlay alert broadcasted via Pusher to streamer ${streamerId}`);
    }

    // Mark as processed
    await prisma.queueOverlay.update({
      where: { id: queueId },
      data: { status: OverlayStatus.DISPLAYED },
    });

    console.log(`✅ QueueOverlay ${queueId} processed successfully`);
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

    console.log(`📦 Found ${pendingItems.length} pending QueueOverlay items`);

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
  console.log("🚀 Starting Kubi Donation Queue Processor (Database-Based)...");
  console.log("=====================================");
  console.log("📊 Polling QueueOverlay table for pending donations...");
  console.log(`⏱️  Poll interval: ${POLL_INTERVAL}ms`);
  console.log(`📦 Batch size: ${BATCH_SIZE}`);
  console.log("=====================================");

  // Start polling loop
  const interval = setInterval(async () => {
    await processPendingQueueOverlays();
  }, POLL_INTERVAL);

  // Run once immediately on startup
  await processPendingQueueOverlays();

  console.log("✅ Donation queue processor started");
  console.log("🎧 Processing pending donations...");
  console.log("Press Ctrl+C to stop");

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
