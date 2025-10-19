import { NextRequest, NextResponse } from "next/server";
import { getAddress } from "ethers";

import { prisma } from "@/lib/prisma";
import {
  applySessionCookies,
  getAuthSession,
  resolveAuthenticatedUser,
} from "@/lib/auth/session";
import { DEFAULT_CHAIN_ID } from "@/config/chain-id";

type PatchBody = {
  address?: unknown;
  allowed?: unknown;
  chainId?: unknown;
  symbol?: unknown;
  decimals?: unknown;
  name?: unknown;
};

const isString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isBoolean = (v: unknown): v is boolean => typeof v === "boolean";
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function error(sessionResponse: NextResponse, status: number, message: string) {
  return applySessionCookies(
    sessionResponse,
    NextResponse.json({ error: message }, { status }),
  );
}

export async function PATCH(request: NextRequest) {
  const { session, sessionResponse } = await getAuthSession(request);
  const sessionRecord = await resolveAuthenticatedUser(session);

  if (!sessionRecord) {
    return error(sessionResponse, 401, "Not authenticated");
  }
  if (sessionRecord.user.role !== "SUPERADMIN") {
    return error(sessionResponse, 403, "Only superadmins can modify global whitelist");
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return error(sessionResponse, 400, "Invalid JSON body");
  }

  if (!isString(body.address)) return error(sessionResponse, 400, "address is required");
  if (!isBoolean(body.allowed)) return error(sessionResponse, 400, "allowed is required");

  const address = getAddress(body.address);
  const chainId = isNumber(body.chainId) ? body.chainId : DEFAULT_CHAIN_ID;
  const symbol = isString(body.symbol) ? body.symbol : undefined;
  const name = isString(body.name) ? body.name : undefined;
  const decimals = isNumber(body.decimals) ? body.decimals : undefined;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Ensure token exists by (chainId, address)
      let token = await tx.token.findUnique({
        where: { chainId_address: { chainId, address } },
        select: { id: true },
      });

      if (!token) {
        if (!symbol || typeof decimals !== "number") {
          throw new Error("Token not found in registry. Provide symbol and decimals to create it.");
        }
        token = await tx.token.create({
          data: {
            chainId,
            address,
            symbol,
            name: name ?? symbol,
            decimals,
            isNative: false,
          },
          select: { id: true },
        });
      }

      const whitelist = await tx.globalTokenWhitelist.upsert({
        where: { tokenId: token.id },
        create: {
          tokenId: token.id,
          allowed: body.allowed as boolean,
          updatedBy: sessionRecord.user.id,
        },
        update: {
          allowed: body.allowed as boolean,
          updatedBy: sessionRecord.user.id,
        },
        select: { allowed: true },
      });

      return { tokenId: token.id, allowed: whitelist.allowed };
    });

    return applySessionCookies(sessionResponse, NextResponse.json(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update whitelist";
    return error(sessionResponse, 400, message);
  }
}

