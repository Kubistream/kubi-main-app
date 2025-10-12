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
    const response = NextResponse.json({ profile: null }, { status: 401 });
    return applySessionCookies(sessionResponse, response);
  }

  const response = NextResponse.json({
    role: sessionRecord.user.role,
    streamer: sessionRecord.user.streamer
      ? {
          id: sessionRecord.user.streamer.id,
        }
      : null,
    profile: {
      username: sessionRecord.user.username,
      displayName: sessionRecord.user.displayName,
      avatarUrl: sessionRecord.user.avatarUrl,
      bio: sessionRecord.user.bio,
      isComplete: sessionRecord.user.streamer?.profileCompleted ?? false,
      completedAt:
        sessionRecord.user.streamer?.profileCompletedAt?.toISOString() ??
        null,
    },
  });

  return applySessionCookies(sessionResponse, response);
}
