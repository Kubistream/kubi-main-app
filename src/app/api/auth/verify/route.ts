import { randomBytes } from "node:crypto";

import { Role, type Streamer, type User } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getAddress } from "ethers";
// Zod removed per request; using manual checks

import { SiweError, verifySiweMessage } from "@/lib/auth/siwe";
import {
  establishUserSession,
  getAuthSessionForResponse,
  getClientIp,
  getUserAgent,
  applySessionCookies,
  getAuthSession,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

interface VerifyPayload {
  message: string;
  signature: string;
  createStreamerProfile?: boolean;
}

type PrismaClientOrTx = typeof prisma | Prisma.TransactionClient;

const FALLBACK_DISPLAY_PREFIX = "Creator";

function buildDisplayFallback(wallet: string) {
  const suffix = wallet.replace(/^0x/i, "").slice(0, 4).toUpperCase();
  return `${FALLBACK_DISPLAY_PREFIX} ${suffix}`;
}

async function generateAvailableUsername(
  wallet: string,
  client: PrismaClientOrTx,
) {
  const baseHandle = wallet.replace(/^0x/i, "").slice(0, 8).toLowerCase();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt}`;
    const candidate = `creator-${baseHandle}${suffix}`;

    const existing = await client.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  return `creator-${baseHandle}-${randomBytes(2).toString("hex")}`;
}

type UserWithStreamer = User & { streamer: Streamer | null };

async function ensureStreamerSetup(
  userId: string,
  wallet: string,
): Promise<UserWithStreamer | null> {
  await prisma.$transaction(async (tx) => {
    const existingStreamer = await tx.streamer.findUnique({
      where: { userId },
    });

    if (!existingStreamer) {
      await tx.streamer.create({ data: { userId } });
    }

    const userRecord = await tx.user.findUnique({
      where: { id: userId },
      select: { username: true, displayName: true },
    });

    if (!userRecord) {
      return;
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (!userRecord.username) {
      updateData.username = await generateAvailableUsername(wallet, tx);
    }

    if (!userRecord.displayName) {
      const fallback =
        typeof updateData.username === "string"
          ? (updateData.username as string)
          : userRecord.username ?? buildDisplayFallback(wallet);
      updateData.displayName = fallback;
    }

    if (Object.keys(updateData).length > 0) {
      await tx.user.update({
        where: { id: userId },
        data: updateData,
      });
    }
  });

  return prisma.user.findUnique({
    where: { id: userId },
    include: { streamer: true },
  });
}

function serializeAuthUser(user: UserWithStreamer, chainId?: number) {
  if (!user) {
    throw new Error("Unable to serialize user for session response.");
  }

  return {
    id: user.id,
    wallet: user.wallet,
    role: user.role,
    chainId,
    streamerId: user.streamer?.id ?? null,
    profile: {
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isComplete: user.streamer?.profileCompleted ?? false,
      completedAt: user.streamer?.profileCompletedAt?.toISOString() ?? null,
    },
  };
}

export async function POST(request: NextRequest) {
  const { session, sessionResponse } = await getAuthSession(request);
  let payload: VerifyPayload;
  try {
    const body = (await request.json()) as Partial<VerifyPayload>;
    if (
      !body ||
      typeof body.message !== "string" ||
      typeof body.signature !== "string"
    ) {
      const response = NextResponse.json(
        { error: "Invalid request payload" },
        { status: 422 },
      );
      return applySessionCookies(sessionResponse, response);
    }
    payload = {
      message: body.message,
      signature: body.signature,
      createStreamerProfile:
        typeof body.createStreamerProfile === "boolean"
          ? body.createStreamerProfile
          : undefined,
    };
  } catch {
    const response = NextResponse.json(
      { error: "Unable to parse request" },
      { status: 400 },
    );
    return applySessionCookies(sessionResponse, response);
  }

  try {
    const verification = await verifySiweMessage({
      message: payload.message,
      signature: payload.signature,
    });

    const wallet = getAddress(verification.address);
    const legacyWallet = wallet.toLowerCase();

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { wallet },
          { wallet: legacyWallet },
        ],
      },
      include: { streamer: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          wallet,
          role: payload.createStreamerProfile ? Role.STREAMER : Role.USER,
        },
        include: { streamer: true },
      });
    } else if (
      payload.createStreamerProfile &&
      user.role === Role.USER
    ) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: Role.STREAMER },
        include: { streamer: true },
      });
    } else if (user.wallet !== wallet) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { wallet },
        include: { streamer: true },
      });
    }

    if (
      payload.createStreamerProfile ||
      user.role === Role.STREAMER ||
      user.role === Role.SUPERADMIN
    ) {
      user = await ensureStreamerSetup(user.id, wallet);
    }

    if (!user) {
      throw new Error("Failed to resolve authenticated user after verification.");
    }

    // Bind the session to the actual response that will be returned
    const response = NextResponse.json({
      user: serializeAuthUser(user, verification.chainId),
    });

    const session = await getAuthSessionForResponse(request, response);
    await establishUserSession({
      session,
      userId: user.id,
      walletAddress: user.wallet,
      userAgent: getUserAgent(request),
      ipAddress: getClientIp(request),
    });

    return response;
  } catch (error) {
    if (error instanceof SiweError) {
      const response = NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
      return response;
    }

    console.error("Failed to verify SIWE message", error);
    const response = NextResponse.json(
      { error: "Failed to verify SIWE signature" },
      { status: 500 },
    );
    return response;
  }
}
