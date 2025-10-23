import { NextRequest, NextResponse } from "next/server";

import {
  applySessionCookies,
  getAuthSession,
  resolveAuthenticatedUser,
} from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const { session, sessionResponse } = await getAuthSession(request);
  const sessionRecord = await resolveAuthenticatedUser(session);

  if (!sessionRecord) {
    const response = NextResponse.json({ user: null }, { status: 401 });
    return applySessionCookies(sessionResponse, response);
  }

  const response = NextResponse.json({
    user: {
      id: sessionRecord.user.id,
      wallet: sessionRecord.user.wallet,
      role: sessionRecord.user.role,
      streamerId: sessionRecord.user.streamer?.id ?? null,
      profile: {
        username: sessionRecord.user.username,
        displayName: sessionRecord.user.displayName,
        avatarUrl: sessionRecord.user.avatarUrl,
        bio: sessionRecord.user.bio,
        isComplete: sessionRecord.user.streamer?.profileCompleted ?? false,
        completedAt: sessionRecord.user.streamer?.profileCompletedAt?.toISOString() ?? null,
      },
      session: {
        id: sessionRecord.id,
        expiresAt: sessionRecord.expiresAt,
      },
    },
  });

  return applySessionCookies(sessionResponse, response);
}
