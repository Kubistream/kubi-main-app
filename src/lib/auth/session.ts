import { randomBytes } from "node:crypto";
import type { IronSession } from "iron-session";
import { getIronSession, type SessionOptions } from "iron-session";
import { NextRequest, NextResponse } from "next/server";

import { env, isProduction } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type SessionData = {
  sessionToken?: string;
  userId?: string;
  walletAddress?: string;
};

declare module "iron-session" {
  // Augment iron-session's data type with our session fields
  interface IronSessionData {
    sessionToken?: string;
    userId?: string;
    walletAddress?: string;
  }
}

const SESSION_COOKIE_NAME = "kubi.session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

if (!env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set in the environment");
}
const SESSION_PASSWORD = env.SESSION_SECRET;

export const sessionOptions: SessionOptions = {
  cookieName: SESSION_COOKIE_NAME,
  password: SESSION_PASSWORD,
  ttl: SESSION_TTL_SECONDS,
  cookieOptions: {
    secure: isProduction,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  },
};

export type SessionWithUser = NonNullable<
  Awaited<ReturnType<typeof findSessionByToken>>
>;

export async function getAuthSession(request: NextRequest) {
  const sessionResponse = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    sessionResponse,
    sessionOptions,
  );

  return { session, sessionResponse };
}

// Helper for routes that need to mutate cookies on the exact response
// that will be returned (ensures Set-Cookie is attached correctly).
export async function getAuthSessionForResponse(
  request: NextRequest,
  response: NextResponse,
) {
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions,
  );
  return session;
}

export function applySessionCookies(
  sessionResponse: NextResponse,
  response: NextResponse,
) {
  sessionResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}

export async function findSessionByToken(sessionToken?: string) {
  if (!sessionToken) return null;

  const record = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: { include: { streamer: true } } },
  });

  if (!record) {
    return null;
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { sessionToken } }).catch(() => null);
    return null;
  }

  return record;
}

export async function establishUserSession({
  session,
  userId,
  walletAddress,
  userAgent,
  ipAddress,
  expiresAt,
}: {
  session: IronSession<SessionData>;
  userId: string;
  walletAddress: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt?: Date;
}) {
  const existingToken = session.sessionToken;
  if (existingToken) {
    await prisma.session.delete({ where: { sessionToken: existingToken } }).catch(() => null);
  }

  const sessionToken = randomBytes(32).toString("hex");
  const calculatedExpiry =
    expiresAt ?? new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expiresAt: calculatedExpiry,
      userAgent: userAgent ?? undefined,
      ipAddress: ipAddress ?? undefined,
    },
  });

  session.sessionToken = sessionToken;
  session.userId = userId;
  session.walletAddress = walletAddress;

  await session.save();

  return sessionToken;
}

export async function destroyUserSession(session: IronSession<SessionData>) {
  const sessionToken = session.sessionToken;
  if (sessionToken) {
    await prisma.session.delete({ where: { sessionToken } }).catch(() => null);
  }

  await session.destroy();
}

export async function resolveAuthenticatedUser(session: IronSession<SessionData>) {
  const record = await findSessionByToken(session.sessionToken);
  if (!record) {
    if (session.sessionToken) {
      await session.destroy();
    }
    return null;
  }

  session.userId = record.userId;
  session.walletAddress = record.user.wallet;

  return record;
}

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [first] = forwardedFor.split(",");
    if (first) return first.trim();
  }

  const realIp =
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-client-ip");
  if (realIp) return realIp;

  return null;
}

export function getUserAgent(request: NextRequest) {
  return request.headers.get("user-agent") ?? null;
}
