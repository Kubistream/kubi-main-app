import { NextRequest, NextResponse } from "next/server";

import { createSiweNonce } from "@/lib/auth/siwe";
import { applySessionCookies, getAuthSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const { sessionResponse } = await getAuthSession(request);
  const nonce = await createSiweNonce();

  const response = NextResponse.json({ nonce });
  return applySessionCookies(sessionResponse, response);
}
