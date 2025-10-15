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

  const hasPrimaryToken = Boolean(
    sessionRecord.user.streamer?.primaryTokenId ?? null,
  );
  const profileCompleted = sessionRecord.user.streamer?.profileCompleted ?? false;
  const response = NextResponse.json({
    role: sessionRecord.user.role,
    streamer: sessionRecord.user.streamer
      ? {
          id: sessionRecord.user.streamer.id,
          primaryTokenId: sessionRecord.user.streamer.primaryTokenId ?? null,
        }
      : null,
    profile: {
      username: sessionRecord.user.username,
      displayName: sessionRecord.user.displayName,
      avatarUrl: sessionRecord.user.avatarUrl,
      bio: sessionRecord.user.bio,
      isComplete: profileCompleted,
      completedAt:
        sessionRecord.user.streamer?.profileCompletedAt?.toISOString() ??
        null,
    },
    hasPrimaryToken,
    // Backward-compatible alias if any client expects this name
    hasPrimaryTokenId: hasPrimaryToken,
    onboardingComplete: profileCompleted && hasPrimaryToken,
  });

  return applySessionCookies(sessionResponse, response);
}
