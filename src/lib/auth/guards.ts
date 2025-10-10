import { NextRequest, NextResponse } from "next/server";

import {
  applySessionCookies,
  getAuthSession,
  resolveAuthenticatedUser,
  type SessionWithUser,
} from "@/lib/auth/session";

export interface RequireUserSuccess {
  session: Awaited<ReturnType<typeof getAuthSession>>["session"];
  sessionResponse: NextResponse;
  sessionRecord: SessionWithUser;
}

export interface RequireUserFailure {
  response: NextResponse;
}

export async function requireUser(
  request: NextRequest,
): Promise<RequireUserSuccess | RequireUserFailure> {
  const { session, sessionResponse } = await getAuthSession(request);
  const sessionRecord = await resolveAuthenticatedUser(session);

  if (!sessionRecord) {
    const unauthorized = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return { response: applySessionCookies(sessionResponse, unauthorized) };
  }

  return { session, sessionResponse, sessionRecord };
}

export function attachSessionCookies(
  response: NextResponse,
  sessionResponse: NextResponse,
) {
  return applySessionCookies(sessionResponse, response);
}
