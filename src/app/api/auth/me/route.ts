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
      streamerProfile: sessionRecord.user.streamer
        ? {
            id: sessionRecord.user.streamer.id,
            username: sessionRecord.user.streamer.username,
            displayName: sessionRecord.user.streamer.displayName,
            avatarUrl: sessionRecord.user.streamer.avatarUrl,
          }
        : null,
      session: {
        id: sessionRecord.id,
        expiresAt: sessionRecord.expiresAt,
      },
    },
  });

  return applySessionCookies(sessionResponse, response);
}
