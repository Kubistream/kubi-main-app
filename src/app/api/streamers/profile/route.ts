import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@prisma/client";

import {
  applySessionCookies,
  getAuthSession,
  resolveAuthenticatedUser,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

interface UpdateProfilePayload {
  username?: unknown;
  displayName?: unknown;
  avatarUrl?: unknown;
  bio?: unknown;
}

const USERNAME_PATTERN = /^[a-z0-9_-]{3,32}$/i;
const MAX_DISPLAY_NAME = 64;
const MAX_AVATAR_URL = 2048;
const MAX_BIO_LENGTH = 280;

const errorResponse = (
  sessionResponse: NextResponse,
  status: number,
  message: string,
) =>
  applySessionCookies(
    sessionResponse,
    NextResponse.json({ error: message }, { status }),
  );

const isString = (value: unknown): value is string =>
  typeof value === "string";

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
    return errorResponse(
      sessionResponse,
      403,
      "Only streamer accounts can update profiles",
    );
  }

  let payload: UpdateProfilePayload;
  try {
    payload = (await request.json()) as UpdateProfilePayload;
  } catch {
    return errorResponse(sessionResponse, 400, "Unable to parse request");
  }

  const rawUsername = isString(payload.username)
    ? payload.username.trim()
    : "";
  if (!rawUsername) {
    return errorResponse(sessionResponse, 422, "Username is required");
  }

  if (!USERNAME_PATTERN.test(rawUsername)) {
    return errorResponse(
      sessionResponse,
      422,
      "Username must be 3-32 characters using letters, numbers, underscores, or dashes",
    );
  }
  const normalizedUsername = rawUsername.toLowerCase();

  const displayName = isString(payload.displayName)
    ? payload.displayName.trim()
    : null;
  if (displayName && displayName.length > MAX_DISPLAY_NAME) {
    return errorResponse(
      sessionResponse,
      422,
      `Display name must be ${MAX_DISPLAY_NAME} characters or less`,
    );
  }

  const avatarUrl = isString(payload.avatarUrl)
    ? payload.avatarUrl.trim()
    : null;
  if (avatarUrl && avatarUrl.length > MAX_AVATAR_URL) {
    return errorResponse(
      sessionResponse,
      422,
      "Avatar URL is too long",
    );
  }

  const bio = isString(payload.bio) ? payload.bio.trim() : null;
  if (bio && bio.length > MAX_BIO_LENGTH) {
    return errorResponse(
      sessionResponse,
      422,
      `Bio must be ${MAX_BIO_LENGTH} characters or less`,
    );
  }

  const existingUserWithHandle = await prisma.user.findUnique({
    where: { username: normalizedUsername },
    select: { id: true },
  });

  if (
    existingUserWithHandle &&
    existingUserWithHandle.id !== sessionRecord.user.id
  ) {
    return errorResponse(sessionResponse, 409, "Username is already taken");
  }

  const now = new Date();
  const profileCompletedAt =
    sessionRecord.user.streamer?.profileCompletedAt ?? now;

  const streamerMutation = sessionRecord.user.streamer
    ? {
        update: {
          profileCompleted: true,
          profileCompletedAt,
        },
      }
    : {
        create: {
          profileCompleted: true,
          profileCompletedAt,
        },
      };

  try {
    const updatedUser = await prisma.user.update({
      where: { id: sessionRecord.user.id },
      data: {
        username: normalizedUsername,
        displayName: displayName || normalizedUsername,
        avatarUrl: avatarUrl || null,
        bio: bio || null,
        streamer: streamerMutation,
      },
      include: { streamer: true },
    });

    const response = NextResponse.json({
      profile: {
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        avatarUrl: updatedUser.avatarUrl,
        bio: updatedUser.bio,
        isComplete: updatedUser.streamer?.profileCompleted ?? false,
        completedAt:
          updatedUser.streamer?.profileCompletedAt?.toISOString() ??
          null,
      },
      streamer: updatedUser.streamer
        ? { id: updatedUser.streamer.id }
        : null,
      role: updatedUser.role,
    });

    return applySessionCookies(sessionResponse, response);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse(sessionResponse, 409, "Username is already taken");
    }

    console.error("Failed to update streamer profile", error);
    return errorResponse(sessionResponse, 500, "Failed to update profile");
  }
}
