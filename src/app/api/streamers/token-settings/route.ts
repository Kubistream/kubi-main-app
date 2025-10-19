import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@prisma/client";

import {
  applySessionCookies,
  getAuthSession,
  resolveAuthenticatedUser,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type SettingsResponse = {
  primaryTokenId: string | null;
  autoswapEnabled: boolean;
  whitelistTokenIds: string[];
};

const errorResponse = (
  sessionResponse: NextResponse,
  status: number,
  message: string,
) => applySessionCookies(sessionResponse, NextResponse.json({ error: message }, { status }));

export async function GET(request: NextRequest) {
  const { session, sessionResponse } = await getAuthSession(request);
  const sessionRecord = await resolveAuthenticatedUser(session);

  if (!sessionRecord) {
    const response = NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    return applySessionCookies(sessionResponse, response);
  }

  if (
    sessionRecord.user.role !== "STREAMER" &&
    sessionRecord.user.role !== "SUPERADMIN"
  ) {
    return errorResponse(sessionResponse, 403, "Only streamer accounts can access settings");
  }

  try {
    // Ensure streamer exists (create minimal record if missing)
    const streamer = await prisma.streamer.upsert({
      where: { userId: sessionRecord.user.id },
      update: {},
      create: {
        userId: sessionRecord.user.id,
        profileCompleted: sessionRecord.user.streamer?.profileCompleted ?? false,
        profileCompletedAt: sessionRecord.user.streamer?.profileCompletedAt ?? null,
      },
      include: {
        whitelists: { select: { tokenId: true } },
      },
    });

    const payload: SettingsResponse = {
      primaryTokenId: streamer.primaryTokenId ?? null,
      autoswapEnabled: streamer.autoswapEnabled,
      whitelistTokenIds: streamer.whitelists.map((w) => w.tokenId),
    };

    const response = NextResponse.json(payload);
    return applySessionCookies(sessionResponse, response);
  } catch (error) {
    console.error("Failed to load token settings", error);
    return errorResponse(sessionResponse, 500, "Failed to load token settings");
  }
}

type PatchPayload = {
  primaryTokenId?: unknown;
  autoswapEnabled?: unknown;
  whitelistTokenIds?: unknown;
};

const isString = (v: unknown): v is string => typeof v === "string";
const isBoolean = (v: unknown): v is boolean => typeof v === "boolean";
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

export async function PATCH(request: NextRequest) {
  const { session, sessionResponse } = await getAuthSession(request);
  const sessionRecord = await resolveAuthenticatedUser(session);

  if (!sessionRecord) {
    return errorResponse(sessionResponse, 401, "Not authenticated");
  }

  if (
    sessionRecord.user.role !== "STREAMER" &&
    sessionRecord.user.role !== "SUPERADMIN"
  ) {
    return errorResponse(sessionResponse, 403, "Only streamer accounts can update settings");
  }

  let payload: PatchPayload;
  try {
    payload = (await request.json()) as PatchPayload;
  } catch {
    return errorResponse(sessionResponse, 400, "Unable to parse request");
  }

  const primaryTokenId = payload.primaryTokenId == null ? null : (isString(payload.primaryTokenId) ? payload.primaryTokenId : null);
  const autoswapEnabled = isBoolean(payload.autoswapEnabled) ? payload.autoswapEnabled : true;
  const whitelistTokenIds = isStringArray(payload.whitelistTokenIds) ? payload.whitelistTokenIds : [];

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Ensure streamer exists
      const streamer = await tx.streamer.upsert({
        where: { userId: sessionRecord.user.id },
        update: {},
        create: { userId: sessionRecord.user.id },
      });

      // Validate primary token: must exist, be globally whitelisted (allowed), and not native
      if (primaryTokenId) {
        const token = await tx.token.findUnique({
          where: { id: primaryTokenId },
          select: {
            id: true,
            isNative: true,
            globalWhitelist: { select: { allowed: true } },
          },
        });
        if (!token) {
          throw new Error("Primary token not found");
        }
        if (!token.globalWhitelist?.allowed) {
          throw new Error("Primary token is not globally whitelisted");
        }
        if (token.isNative) {
          throw new Error("Primary token cannot be native");
        }
      }

      // Validate whitelist tokens: all must exist, be globally whitelisted (allowed), and not native
      if (whitelistTokenIds.length > 0) {
        const allowed = await tx.token.findMany({
          where: {
            id: { in: whitelistTokenIds },
            isNative: false,
            globalWhitelist: { is: { allowed: true } },
          },
          select: { id: true },
        });
        if (allowed.length !== whitelistTokenIds.length) {
          throw new Error("One or more whitelist tokens are not globally allowed");
        }
      }

      // Update core streamer settings
      await tx.streamer.update({
        where: { id: streamer.id },
        data: {
          primaryTokenId: primaryTokenId,
          autoswapEnabled: autoswapEnabled,
        },
      });

      // Reconcile whitelist by diff
      const current = await tx.streamerTokenWhitelist.findMany({
        where: { streamerId: streamer.id },
        select: { tokenId: true },
      });
      const currentSet = new Set(current.map((c) => c.tokenId));
      const nextSet = new Set(whitelistTokenIds);

      const toAdd = [...nextSet].filter((id) => !currentSet.has(id));
      const toRemove = [...currentSet].filter((id) => !nextSet.has(id));

      for (const tokenId of toAdd) {
        await tx.streamerTokenWhitelist.upsert({
          where: {
            streamerId_tokenId: { streamerId: streamer.id, tokenId },
          },
          create: {
            streamerId: streamer.id,
            tokenId,
            allowed: true,
            updatedBy: sessionRecord.user.id,
          },
          update: {
            allowed: true,
            updatedBy: sessionRecord.user.id,
          },
        });
      }

      if (toRemove.length > 0) {
        await tx.streamerTokenWhitelist.deleteMany({
          where: { streamerId: streamer.id, tokenId: { in: toRemove } },
        });
      }

      return { streamerId: streamer.id };
    });

    // Load the updated state to return
    const updated = await prisma.streamer.findUnique({
      where: { userId: sessionRecord.user.id },
      include: { whitelists: { select: { tokenId: true } } },
    });

    const responsePayload: SettingsResponse = {
      primaryTokenId: updated?.primaryTokenId ?? null,
      autoswapEnabled: updated?.autoswapEnabled ?? true,
      whitelistTokenIds: updated?.whitelists.map((w) => w.tokenId) ?? [],
    };

    const response = NextResponse.json(responsePayload);
    return applySessionCookies(sessionResponse, response);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return errorResponse(sessionResponse, 400, "Database error updating settings");
    }

    const message = error instanceof Error ? error.message : "Failed to update settings";
    return errorResponse(sessionResponse, 400, message);
  }
}
