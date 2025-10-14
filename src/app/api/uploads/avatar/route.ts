import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

import {
  applySessionCookies,
  getAuthSession,
  resolveAuthenticatedUser,
} from "@/lib/auth/session";

export const runtime = "nodejs";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg"]);

function error(sessionResponse: NextResponse, status: number, message: string) {
  return applySessionCookies(
    sessionResponse,
    NextResponse.json({ error: message }, { status }),
  );
}

export async function POST(request: NextRequest) {
  const { session, sessionResponse } = await getAuthSession(request);
  const sessionRecord = await resolveAuthenticatedUser(session);

  if (!sessionRecord) {
    return error(sessionResponse, 401, "Not authenticated");
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return error(sessionResponse, 400, "Missing file field");
    }

    const type = file.type;
    if (!ALLOWED_TYPES.has(type)) {
      return error(sessionResponse, 415, "Only PNG and JPEG images are allowed");
    }

    if (file.size > MAX_SIZE_BYTES) {
      return error(sessionResponse, 413, "File too large (max 5MB)");
    }

    const ext = type === "image/png" ? "png" : "jpg";
    const fileName = `${sessionRecord.user.id}-${Date.now()}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");

    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, fileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/avatars/${fileName}`;

    const response = NextResponse.json({ url: publicUrl });
    return applySessionCookies(sessionResponse, response);
  } catch (e) {
    console.error("Avatar upload failed", e);
    return error(sessionResponse, 500, "Failed to upload avatar");
  }
}

