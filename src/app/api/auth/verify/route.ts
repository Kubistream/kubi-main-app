import { randomBytes } from "node:crypto";

import { Prisma, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
// Zod removed per request; using manual checks

import { SiweError, verifySiweMessage } from "@/lib/auth/siwe";
import {
  applySessionCookies,
  establishUserSession,
  getAuthSession,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

interface VerifyPayload {
  message: string;
  signature: string;
  createStreamerProfile?: boolean;
}

async function ensureStreamerProfile(userId: string, wallet: string) {
  const existing = await prisma.streamer.findUnique({ where: { userId } });
  if (existing) {
    return existing;
  }

  const baseHandle = wallet.replace(/^0x/, "").slice(0, 8);
  let attempt = 0;

  while (attempt < 5) {
    const suffix = attempt === 0 ? "" : `-${attempt}`;
    const candidate = `creator-${baseHandle}${suffix}`.toLowerCase();

    try {
      return await prisma.streamer.create({
        data: {
          userId,
          username: candidate,
          displayName: candidate,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        attempt += 1;
        continue;
      }

      throw error;
    }
  }

  const fallback = `creator-${baseHandle}-${randomBytes(2).toString("hex")}`;
  return prisma.streamer.create({
    data: {
      userId,
      username: fallback,
      displayName: fallback,
    },
  });
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

    const wallet = verification.address.toLowerCase();

    const user = await prisma.user.upsert({
      where: { wallet },
      create: {
        wallet,
        role: payload.createStreamerProfile ? Role.STREAMER : Role.USER,
      },
      update: payload.createStreamerProfile ? { role: Role.STREAMER } : {},
    });

    const streamer = payload.createStreamerProfile
      ? await ensureStreamerProfile(user.id, wallet)
      : await prisma.streamer.findUnique({ where: { userId: user.id } });

    await establishUserSession({
      session,
      userId: user.id,
      walletAddress: user.wallet,
      userAgent: getUserAgent(request),
      ipAddress: getClientIp(request),
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        wallet: user.wallet,
        role: user.role,
        chainId: verification.chainId,
        streamerProfile: streamer
          ? {
              id: streamer.id,
              username: streamer.username,
              displayName: streamer.displayName,
              avatarUrl: streamer.avatarUrl,
            }
          : null,
      },
    });

    return applySessionCookies(sessionResponse, response);
  } catch (error) {
    if (error instanceof SiweError) {
      const response = NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
      return applySessionCookies(sessionResponse, response);
    }

    console.error("Failed to verify SIWE message", error);
    const response = NextResponse.json(
      { error: "Failed to verify SIWE signature" },
      { status: 500 },
    );
    return applySessionCookies(sessionResponse, response);
  }
}
