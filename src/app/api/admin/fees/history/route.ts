import { NextRequest, NextResponse } from "next/server";
import { getAddress } from "ethers";

import { prisma } from "@/lib/prisma";
import {
  applySessionCookies,
  getAuthSession,
  resolveAuthenticatedUser,
} from "@/lib/auth/session";

type PostBody = {
  feeBps?: unknown;
  feeRecipient?: unknown;
  txHash?: unknown;
};

const isString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function error(sessionResponse: NextResponse, status: number, message: string) {
  return applySessionCookies(
    sessionResponse,
    NextResponse.json({ error: message }, { status }),
  );
}

export async function POST(request: NextRequest) {
  const { session, sessionResponse } = await getAuthSession(request);
  const sessionRecord = await resolveAuthenticatedUser(session);

  if (!sessionRecord) {
    return error(sessionResponse, 401, "Not authenticated");
  }
  if (sessionRecord.user.role !== "SUPERADMIN") {
    return error(sessionResponse, 403, "Only superadmins can record platform fee changes");
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return error(sessionResponse, 400, "Invalid JSON body");
  }

  if (!isNumber(body.feeBps)) return error(sessionResponse, 400, "feeBps is required");
  if (!isString(body.feeRecipient)) return error(sessionResponse, 400, "feeRecipient is required");
  const feeBps = body.feeBps;
  if (feeBps < 0 || feeBps > 10000) return error(sessionResponse, 400, "feeBps must be 0..10000");

  let recipient: string;
  try {
    recipient = getAddress(body.feeRecipient);
  } catch {
    return error(sessionResponse, 400, "Invalid feeRecipient address");
  }

  try {
    const record = await prisma.platformFeeHistory.create({
      data: {
        feeBps,
        feeRecipient: recipient,
        txHash: isString(body.txHash) ? body.txHash : undefined,
        changedBy: sessionRecord.user.id,
      },
    });

    return applySessionCookies(sessionResponse, NextResponse.json(record));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record platform fee change";
    return error(sessionResponse, 400, message);
  }
}

