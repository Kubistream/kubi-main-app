import { NextRequest, NextResponse } from "next/server";

import { destroyUserSession, getAuthSessionForResponse } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  const session = await getAuthSessionForResponse(request, response);

  if (session.sessionToken) {
    await destroyUserSession(session);
  } else {
    await session.destroy();
  }
  return response;
}
