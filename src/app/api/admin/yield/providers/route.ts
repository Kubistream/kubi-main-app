import { NextRequest, NextResponse } from "next/server";
import { getAddress } from "ethers";

import { prisma } from "@/lib/prisma";
import {
  applySessionCookies,
  getAuthSession,
  resolveAuthenticatedUser,
} from "@/lib/auth/session";
import { DEFAULT_CHAIN_ID } from "@/config/chain-id";

function error(sessionResponse: NextResponse, status: number, message: string) {
  return applySessionCookies(
    sessionResponse,
    NextResponse.json({ error: message }, { status }),
  );
}

export async function GET(_request: NextRequest) {
  // Public GET: used to list auto-yield options in streamer profile
  try {
    const providers = await prisma.yieldProvider.findMany({
      include: {
        underlyingToken: true,
        representativeToken: true,
      },
      orderBy: [{ protocolName: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ providers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list providers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type PostBody = {
  representativeAddress?: unknown;
  underlyingAddress?: unknown;
  chainId?: unknown;
  allowed?: unknown;
  protocol?: unknown;
  protocolName?: unknown;
  protocolImageUrl?: unknown;
  adapterKey?: unknown;
  aprSource?: unknown;
  extraData?: unknown;
};

const isString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isBoolean = (v: unknown): v is boolean => typeof v === "boolean";
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export async function POST(request: NextRequest) {
  const { session, sessionResponse } = await getAuthSession(request);
  const sessionRecord = await resolveAuthenticatedUser(session);

  if (!sessionRecord) {
    return error(sessionResponse, 401, "Not authenticated");
  }
  if (sessionRecord.user.role !== "SUPERADMIN") {
    return error(sessionResponse, 403, "Only superadmins can upsert yield providers");
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return error(sessionResponse, 400, "Invalid JSON body");
  }

  if (!isString(body.representativeAddress)) return error(sessionResponse, 400, "representativeAddress is required");
  if (!isString(body.underlyingAddress)) return error(sessionResponse, 400, "underlyingAddress is required");

  const representativeAddress = getAddress(body.representativeAddress);
  const underlyingAddress = getAddress(body.underlyingAddress);
  const chainId = isNumber(body.chainId) ? body.chainId : DEFAULT_CHAIN_ID;
  const allowed = isBoolean(body.allowed) ? body.allowed : true;
  const status = allowed ? "ACTIVE" : "PAUSED";

  const protocol = isString(body.protocol) ? body.protocol : "";
  const protocolName = isString(body.protocolName) ? body.protocolName : "";
  const protocolImageUrl = isString(body.protocolImageUrl) ? body.protocolImageUrl : undefined;
  const adapterKey = isString(body.adapterKey) ? body.adapterKey : undefined;
  const aprSource = isString(body.aprSource) ? body.aprSource : undefined;
  const extraData = body.extraData as any | undefined;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const repToken = await tx.token.findUnique({
        where: { chainId_address: { chainId, address: representativeAddress } },
        select: { id: true },
      });
      const undToken = await tx.token.findUnique({
        where: { chainId_address: { chainId, address: underlyingAddress } },
        select: { id: true },
      });

      if (!repToken || !undToken) {
        throw new Error("Token(s) not found in registry. Ensure both tokens exist and are whitelisted.");
      }

      const provider = await tx.yieldProvider.upsert({
        where: { representativeTokenId: repToken.id },
        update: {
          chainId,
          protocol,
          protocolName,
          protocolImageUrl,
          underlyingTokenId: undToken.id,
          status,
          adapterKey,
          aprSource: aprSource as any,
          extraData: extraData ?? undefined,
        },
        create: {
          chainId,
          protocol,
          protocolName,
          protocolImageUrl,
          underlyingTokenId: undToken.id,
          representativeTokenId: repToken.id,
          status,
          adapterKey,
          aprSource: (aprSource as any) ?? "ONCHAIN",
          extraData: extraData ?? undefined,
        },
        include: {
          underlyingToken: true,
          representativeToken: true,
        },
      });

      return provider;
    });

    return applySessionCookies(sessionResponse, NextResponse.json({ provider: result }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upsert yield provider";
    return error(sessionResponse, 400, message);
  }
}
