import { NextRequest, NextResponse } from "next/server";

import { applySessionCookies, destroyUserSession, getAuthSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const { session, sessionResponse } = await getAuthSession(request);

  if (session.sessionToken) {
    await destroyUserSession(session);
  } else {
    await session.destroy();
  }

  const response = NextResponse.json({ success: true });
  return applySessionCookies(sessionResponse, response);
}
