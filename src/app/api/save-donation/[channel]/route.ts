import { JsonRpcProvider, ethers } from "ethers";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  applySessionCookies,
  getAuthSession,
  resolveAuthenticatedUser,
} from "@/lib/auth/session";
import { getDonationContractAddress } from "@/services/contracts/addresses";

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

    // 🔗 Verifikasi transaksi di chain
    const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://base-sepolia.drpc.org");
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1) {
      return NextResponse.json({ error: "Invalid or failed transaction" }, { status: 400 });
    }
    const block = await provider.getBlock(receipt.blockNumber);
    if (!block) {
      return NextResponse.json({ error: "Block not found" }, { status: 400 });
    }

    const blockNumber = receipt.blockNumber;
    const chainId = Number((await provider.getNetwork()).chainId);
    const logIndex = 0;
    const timestamp = new Date(block.timestamp * 1000);

    // 🔍 Parse event Donation
    const abi = [
      "event Donation(address indexed donor, address indexed streamer, address indexed tokenIn, uint256 amountIn, uint256 feeAmount, address tokenOut, uint256 amountOutToStreamer, uint256 timestamp)"
    ];
    const iface = new ethers.Interface(abi);
    const donationAddress = getDonationContractAddress().toLowerCase();
    const donationTopic = ethers.id(
      "Donation(address,address,address,uint256,uint256,address,uint256,uint256)"
    );
    const donationLog = receipt.logs.find(
      (log) =>
        log.address.toLowerCase() === donationAddress &&
        log.topics[0] === donationTopic
    );

    if (!donationLog) {
      return NextResponse.json({ error: "Donation log not found" }, { status: 400 });
    }

    let parsed: ethers.LogDescription | null = null;
    try {
      parsed = iface.parseLog(donationLog);
    } catch (parseError) {
      console.error("Failed to parse donation log", parseError);
      return NextResponse.json({ error: "Invalid donation log" }, { status: 400 });
    }

    if (!parsed) {
      return NextResponse.json({ error: "Invalid donation log" }, { status: 400 });
    }

    const { donor, streamer, tokenIn, amountIn, feeAmount, tokenOut, amountOutToStreamer } = parsed.args;

    let donorAddress: string;
    let streamerAddress: string;
    let tokenInAddress: string;
    let tokenOutAddress: string;

    try {
      donorAddress = ethers.getAddress(donor as string);
      streamerAddress = ethers.getAddress(streamer as string);
      tokenInAddress = ethers.getAddress(tokenIn as string);
      tokenOutAddress = ethers.getAddress(tokenOut as string);
    } catch {
      return NextResponse.json({ error: "Malformed donation event addresses" }, { status: 400 });
    }

    if (donorAddress !== donorWallet) {
      return NextResponse.json({ error: "Donor address does not match session wallet" }, { status: 400 });
    }

    console.log("✅ Transaction verified on chain:", txHash);
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

    // 💰 Mapping harga USD dummy per token
    const tokenPricesUsd: Record<string, number> = {
      "0x57b78b98b9dd06e06de145b83aedf6f04e4c5500": 2400, // WETHkb
      "0x1fe9a4e25caa2a22fc0b61010fdb0db462fb5b29": 1,    // USDCkb
      "0x5e1e8043381f3a21a1a64f46073daf7e74fedc1e": 1,    // USDTkb
      "0x06c1e044d5beb614faa6128001f519e6c693a044": 0.000067, // IDRXkb
      "0x80d27901053b1cd4adca21897558385a793e0092": 0.1,  // ASTERkb
      "0x455360debc0b144e38065234a860d4556c5d6445": 1.2,  // MANTAkb
      "0x2f79e1034c83947b52765a04c62a817f4a73341b": 65000, // Bitcoinkb
      "0x7392e9e58f202da3877776c41683ac457dfd4cd7": 2400, // ETHkb
      "0x3328022076881220148d5818d125edbf1e8fa450": 0.05, // PENGUkb
      "0x7a8ad6e64ee7298d5ab2a4617cc9bc121abd6a5d": 0.4,  // LUNAkb
      "0x22d5b0261adea67737ace9570704fbdd1a4eecba": 1200,  // BNBkb
    };

    // 💵 Hitung nilai USD dan IDR
    const priceInUsd = tokenPricesUsd[tokenInAddress.toLowerCase()] || 0;
    const priceOutUsd = tokenPricesUsd[tokenOutAddress.toLowerCase()] || 0;
    const amountInFloat = parseFloat(ethers.formatUnits(amountIn, 18));
    const amountOutFloat = parseFloat(ethers.formatUnits(amountOutToStreamer, 18));
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
        feeRaw: new Prisma.Decimal(feeAmount.toString()),
        logIndex,
        blockNumber,
        chainId,
        timestamp,
        status: "PENDING",
      },
    });

    console.log("✅ Donation saved successfully with txHash:", donation.txHash);
    return NextResponse.json({ success: true, donation });
  } catch (err: any) {
    console.error("❌ Error saving donation:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
