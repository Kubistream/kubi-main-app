import { ethers } from "ethers";
import { Prisma, DonationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  applySessionCookies,
  getAuthSession,
  resolveAuthenticatedUser,
} from "@/lib/auth/session";
import { getDonationContractAddress } from "@/services/contracts/addresses";
import { TOKEN_PRICES_USD } from "@/constants/token-prices";
import { FallbackJsonRpcProvider } from "@/services/contracts/server-provider";
import { getRpcUrls } from "@/config/rpc-config";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ channel: string }> }
) {
  const { channel } = await context.params;
  if (!channel) {
    return NextResponse.json({ error: "Missing channel parameter" }, { status: 400 });
  }
  try {
    const body = await req.json();
    const {
      txHash,
      message,
      streamerId,
      name,
      avatarUrl,
      mediaType = "TEXT",
      mediaUrl,
      mediaDuration = 0,
      chainId: bodyChainId,
    } = body;

    const { session, sessionResponse } = await getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized - No session provided" }, { status: 401 });
    }

    const user = await resolveAuthenticatedUser(session);
    if (!user || !user.user.wallet) {
      return NextResponse.json({ error: "Invalid session - Missing wallet address" }, { status: 401 });
    }

    let donorWallet: string;
    try {
      donorWallet = ethers.getAddress(user.user.wallet);
    } catch {
      return NextResponse.json({ error: "Invalid session wallet address" }, { status: 400 });
    }

    // Validasi data dasar
    if (!txHash || !streamerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const txHashRecord = await prisma.donation.findFirst({
      where: { txHash },
    });

    if (txHashRecord) {
      return NextResponse.json({ error: "Transaction already recorded" }, { status: 400 });
    }

    // Determine Chain
    const txChainId = Number(bodyChainId || 84532);

    // Check if chain is supported
    const rpcUrls = getRpcUrls(txChainId);
    if (rpcUrls.length === 0) {
      return NextResponse.json({ error: `Unsupported chain ID: ${txChainId}` }, { status: 400 });
    }

    // 🔗 Verifikasi transaksi di chain using FallbackJsonRpcProvider
    const fallbackProvider = new FallbackJsonRpcProvider(txChainId);
    const tx = await fallbackProvider.getTransaction(txHash);
    const receipt = await fallbackProvider.getTransactionReceipt(txHash);

    if (!receipt || receipt.status !== 1) {
      return NextResponse.json({ error: "Invalid or failed transaction" }, { status: 400 });
    }
    // Retry fetching the block a few times to handle RPC latency
    let block = await fallbackProvider.getBlock(receipt.blockNumber);
    let attempts = 0;
    while (!block && attempts < 3) {
      console.log(`⚠️ Block ${receipt.blockNumber} not found, retrying... (${attempts + 1}/3)`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      block = await fallbackProvider.getBlock(receipt.blockNumber);
      attempts++;
    }

    if (!block) {
      return NextResponse.json({ error: "Block not found after retries" }, { status: 400 });
    }

    const blockNumber = receipt.blockNumber;
    // const chainId = Number((await provider.getNetwork()).chainId); // Use parsed chainID
    const chainId = txChainId;

    const logIndex = 0;
    const timestamp = new Date(block.timestamp * 1000);

    // 🔍 Parse event Donation or DonationBridged
    // NOTE: Event signature MUST match the actual smart contract event
    // From KubiStreamerDonation.sol line 131-140
    const donationContractAbi = [
      "event Donation(address indexed donor, address indexed streamer, address indexed tokenIn, uint256 amountIn, uint256 feeAmount, address tokenOut, uint256 amountOutToStreamer, uint256 timestamp)",
      "event DonationBridged(address indexed donor, address indexed streamer, uint32 indexed destinationChain, address tokenBridged, uint256 amount, bytes32 messageId)",
      "function feeBps() view returns (uint16)"
    ];
    const iface = new ethers.Interface(donationContractAbi);

    // Get correct contract address for this chain
    const donationAddress = getDonationContractAddress(chainId).toLowerCase();

    // Read feeBps from contract to calculate original amount for bridged donations
    const feeBpsContract = new ethers.Contract(donationAddress, donationContractAbi, fallbackProvider.getProvider());
    const feeBps = await feeBpsContract.feeBps();

    console.log("📊 Contract feeBps:", feeBps.toString(), `(${Number(feeBps) / 100}%)`);

    // Calculate Topics - MUST match the smart contract exactly
    const donationTopic = ethers.id(
      "Donation(address,address,address,uint256,uint256,address,uint256,uint256)"
    );
    const donationBridgedTopic = ethers.id(
      "DonationBridged(address,address,uint32,address,uint256,bytes32)"
    );

    // Find ALL logs from this contract address
    const logsFromContract = receipt.logs.filter(
      (log) => log.address.toLowerCase() === donationAddress
    );

    if (logsFromContract.length === 0) {
      console.error("❌ No logs found from contract address:", donationAddress);
      return NextResponse.json({
        error: "Donation log not found (no log from contract)",
        details: {
          expectedAddress: donationAddress,
          foundLogs: receipt.logs.map(l => l.address)
        }
      }, { status: 400 });
    }

    // Try to find one with matching topic (either Donation or DonationBridged)
    const donationLog = logsFromContract.find(l =>
      l.topics[0] === donationTopic || l.topics[0] === donationBridgedTopic
    );

    if (!donationLog) {
      console.error("❌ Donation log topic mismatch");
      console.error("   Expected:", donationTopic, "OR", donationBridgedTopic);
      console.error("   Found Topics:", logsFromContract.map(l => l.topics[0]));

      return NextResponse.json({
        error: "Donation log found but topic mismatch",
        details: {
          expectedTopics: [donationTopic, donationBridgedTopic],
          foundTopics: logsFromContract.map(l => l.topics[0]),
          foundLogs: logsFromContract.map(l => l.address)
        }
      }, { status: 400 });
    }

    let parsed: ethers.LogDescription | null = null;
    try {
      parsed = iface.parseLog(donationLog);
    } catch (parseError) {
      console.error("Failed to parse donation log", parseError);
      return NextResponse.json({ error: "Invalid donation log (parse failed)" }, { status: 400 });
    }

    if (!parsed) {
      return NextResponse.json({ error: "Invalid donation log" }, { status: 400 });
    }

    // Extract args based on event type
    let donorAddress: string;
    let streamerAddress: string;
    let tokenInAddress: string;
    let tokenOutAddress: string;
    let amountInVal: bigint;
    let amountOutVal: bigint;
    let feeVal: bigint;

    try {
      if (parsed.name === "DonationBridged") {
        const { donor, streamer, tokenBridged, amount } = parsed.args;

        // For bridged donations, the event emits amount AFTER fee was deducted
        // We need to reverse calculate to get the original amountIn and fee
        // Smart contract: amountAfterFee = amountIn - (amountIn * feeBps / 10000)
        // Reverse: amountIn = (amountAfterFee * 10000) / (10000 - feeBps)
        const amountAfterFee = amount;
        const amountInOriginal = (amountAfterFee * BigInt(10000)) / (BigInt(10000) - BigInt(feeBps));
        const calculatedFee = amountInOriginal - amountAfterFee;

        donorAddress = ethers.getAddress(donor);
        streamerAddress = ethers.getAddress(streamer);
        tokenInAddress = ethers.getAddress(tokenBridged);
        tokenOutAddress = ethers.getAddress(tokenBridged); // In bridged, we assume same token or just track it as is
        amountInVal = amountInOriginal;  // ← Original amount before fee
        amountOutVal = amountAfterFee;   // ← Amount after fee (what was bridged)
        feeVal = calculatedFee;          // ← Calculated fee

        console.log("🌉 Bridged Donation - Reverse Calculation:");
        console.log("   Amount After Fee (bridged):", amountAfterFee.toString());
        console.log("   Calculated Original Amount:", amountInOriginal.toString());
        console.log("   Calculated Fee:", calculatedFee.toString());
      } else {
        const { donor, streamer, tokenIn, amountIn, feeAmount, tokenOut, amountOutToStreamer } = parsed.args;
        donorAddress = ethers.getAddress(donor);
        streamerAddress = ethers.getAddress(streamer);
        tokenInAddress = ethers.getAddress(tokenIn);
        tokenOutAddress = ethers.getAddress(tokenOut);
        amountInVal = amountIn;
        amountOutVal = amountOutToStreamer;
        feeVal = feeAmount;
      }
    } catch {
      return NextResponse.json({ error: "Malformed donation event addresses/args" }, { status: 400 });
    }

    // Variables for downstream logic (mapped to what was there before)
    const amountIn = amountInVal;
    const feeAmount = feeVal;
    const amountOutToStreamer = amountOutVal;

    if (donorAddress !== donorWallet) {
      // Allow slight mismatch if user signed in with checksummed vs lower, but ethers.getAddress should handle it.
      // If donorWallet is from session and donorAddress is from chain, they must match.
      console.warn(`⚠️ Wallet mismatch: Session(${donorWallet}) vs Chain(${donorAddress})`);
      return NextResponse.json({
        error: "Donor address does not match session wallet",
        sessionVal: donorWallet,
        chainVal: donorAddress
      }, { status: 400 });
    }

    console.log("✅ Transaction verified on chain:", txHash);
    console.log("   Event Type:", parsed.name);
    console.log("   Donor:", donorAddress);
    console.log("   Streamer:", streamerAddress);
    console.log("   Token In:", tokenInAddress);
    console.log("   Amount In:", amountIn.toString());
    console.log("   Fee Amount:", feeAmount.toString());
    console.log("   Token Out:", tokenOutAddress);
    console.log("   Amount Out To Streamer:", amountOutToStreamer.toString());

    const tokenInRecord = await prisma.token.findFirst({
      where: {
        address: {
          equals: tokenInAddress,
          mode: "insensitive", // ⬅️ ini yang bikin case-insensitive
        },
      },
    });

    const tokenOutRecord = await prisma.token.findFirst({
      where: {
        address: {
          equals: tokenOutAddress,
          mode: "insensitive"
        },
      },
    });

    if (!tokenInRecord || !tokenOutRecord) {
      return NextResponse.json({ error: "Token not found in database" }, { status: 400 });
    }

    // 💵 Hitung nilai USD dan IDR
    const priceInUsd = TOKEN_PRICES_USD[tokenInAddress.toLowerCase()] || 0;
    const priceOutUsd = TOKEN_PRICES_USD[tokenOutAddress.toLowerCase()] || 0;
    // Use actual token decimals from database, not hardcoded 18
    const amountInFloat = parseFloat(ethers.formatUnits(amountIn, tokenInRecord.decimals));
    const amountOutFloat = parseFloat(ethers.formatUnits(amountOutToStreamer, tokenOutRecord.decimals));
    const amountInUsd = amountInFloat * priceInUsd;
    const amountOutUsd = amountOutFloat * priceOutUsd;
    const usdToIdr = 16000;
    const amountInIdr = amountInUsd * usdToIdr;
    const amountOutIdr = amountOutUsd * usdToIdr;

    const userDonor = await prisma.user.findFirst({
      where: { wallet: { equals: donorAddress, mode: "insensitive" } },
    });

    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (userDonor) {
      const updates: Prisma.UserUpdateInput = {};
      if (trimmedName && trimmedName !== (userDonor.displayName ?? "")) {
        updates.displayName = trimmedName;
      }
      if (avatarUrl && avatarUrl !== userDonor.avatarUrl) {
        updates.avatarUrl = avatarUrl;
      }
      if (Object.keys(updates).length > 0) {
        await prisma.user.update({
          where: { id: userDonor.id },
          data: updates,
        });
      }
    } else {
      console.log("ℹ️ Donor wallet not found in users, creating new user:", donorAddress);
      await prisma.user.create({
        data: {
          wallet: donorAddress,
          displayName: trimmedName || undefined,
          avatarUrl: avatarUrl || undefined,
        },
      });
    }


    // 🧾 Simpan ke database Donation
    const donation = await prisma.donation.create({
      data: {
        txHash,
        message,
        donorWallet: donorAddress,
        streamerId,
        tokenInId: tokenInRecord.id,
        tokenOutId: tokenOutRecord.id,
        amountInRaw: amountIn.toString(),
        amountOutRaw: amountOutToStreamer.toString(),
        amountInUsd: new Prisma.Decimal(amountInUsd.toFixed(8)),
        amountOutUsd: new Prisma.Decimal(amountOutUsd.toFixed(8)),
        amountInIdr: new Prisma.Decimal(amountInIdr.toFixed(2)),
        amountOutIdr: new Prisma.Decimal(amountOutIdr.toFixed(2)),
        feeRaw: feeVal.toString(),
        logIndex,
        blockNumber,
        chainId,
        timestamp,
        status: DonationStatus.CONFIRMED,
        mediaType,
        mediaUrl,
        mediaDuration,
      },
    });

    // 📡 Broadcast to Overlay via WebSocket (Pusher)
    // Generate sounds via URL system (Test endpoint style)
    const sounds: string[] = [];
    try {
      const { loadAlertSound } = await import("@/utils/sound");
      const { textToSpeechUrl, generateDonationMessage } = await import("@/services/tts");

      // 1. Alert Sound
      const alertSound = await loadAlertSound();
      sounds.push(alertSound);

      // 2. TTS Logic
      if (mediaType === "TEXT" && message) {
        const formattedAmount = parseFloat(ethers.formatUnits(amountIn, tokenInRecord.decimals)).toLocaleString('en-US', { maximumFractionDigits: 4 });
        const notificationMsg = generateDonationMessage(trimmedName || "Anonymous", formattedAmount, tokenInRecord.symbol);
        
        try {
          console.log("[API] Generatin Notif TTS for:", notificationMsg);
          const notifAudio = await textToSpeechUrl(notificationMsg, "en");
          console.log(`[API] ✅ Notif TTS generated: ${notifAudio}`);
          sounds.push(notifAudio);
        } catch (e: any) { 
          console.log("❌ [API] TTS Notif failed:", e.message); 
        }

        try {
          console.log("[API] Generatin Message TTS for:", message);
          const msgAudio = await textToSpeechUrl(message, "id");
          console.log(`[API] ✅ Message TTS generated: ${msgAudio}`);
          sounds.push(msgAudio);
        } catch (e: any) { 
          console.log("❌ [API] TTS Message failed:", e.message); 
        }
      }
    } catch (soundError: any) {
      console.log("❌ [API] Sound generation failed:", soundError.message);
    }

    try {
      const overlayMessage = {
        type: "overlay",
        amount: parseFloat(ethers.formatUnits(amountIn, tokenInRecord.decimals)).toLocaleString('en-US', { maximumFractionDigits: 4 }),
        donorAddress: donorAddress,
        donorName: trimmedName || "Anonymous",
        message: message || "",
        sounds: sounds, // Now populated with URLs
        streamerName: "", // Optional
        tokenSymbol: tokenInRecord.symbol,
        tokenLogo: tokenInRecord.logoURI,
        txHash: txHash,
        mediaType,
        mediaUrl,
        mediaDuration,
        usdValue: amountInUsd,
      };

      // Use our WebSocket server for overlay broadcast
      const { broadcastToStreamer } = await import("@/lib/overlay-ws");
      await broadcastToStreamer(streamerId, overlayMessage);
      console.log("✅ Overlay alert broadcasted via WebSocket");
    } catch (wsError) {
      console.error("❌ Failed to broadcast overlay alert:", wsError);
      // Don't fail the request, just log error
    }

    console.log("✅ Donation saved successfully with txHash:", donation.txHash);
    return NextResponse.json({ success: true, donation });
  } catch (err: any) {
    console.error("❌ Error saving donation:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
