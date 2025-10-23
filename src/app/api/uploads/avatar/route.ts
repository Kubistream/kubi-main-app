import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { publicUrlForKey, requiredBucket, s3 } from "@/lib/s3";

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
    const key = `avatars/${sessionRecord.user.id}-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const put = new PutObjectCommand({
      Bucket: requiredBucket(),
      Key: key,
      Body: buffer,
      ContentType: type,
      CacheControl: "public, max-age=31536000, immutable",
    });
    await s3.send(put);

    const publicUrl = publicUrlForKey(key);

    const response = NextResponse.json({ url: publicUrl });
    return applySessionCookies(sessionResponse, response);
  } catch (e) {
    try {
      const anyErr = e as any;
      const resp = anyErr?.$response;
      if (resp) {
        const status = resp.statusCode ?? resp.status;
        let raw = "";
        // Attempt to read raw response body if available (Node Readable stream)
        const body: any = resp.body;
        if (body && typeof body[Symbol.asyncIterator] === "function") {
          const chunks: Buffer[] = [];
          for await (const chunk of body as AsyncIterable<Buffer | Uint8Array | string>) {
            if (typeof chunk === "string") chunks.push(Buffer.from(chunk));
            else chunks.push(Buffer.from(chunk));
          }
          raw = Buffer.concat(chunks).toString("utf8");
        }
        console.error("S3 PutObject error", {
          status,
          headers: resp.headers,
          raw,
        });
      }
    } catch (inner) {
      console.error("Failed to inspect S3 error response", inner);
    }
    console.error("Avatar upload failed", e);
    return error(sessionResponse, 500, "Failed to upload avatar");
  }
}
