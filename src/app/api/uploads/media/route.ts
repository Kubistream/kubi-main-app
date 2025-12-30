import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { publicUrlForKey, requiredBucket, s3 } from "@/lib/s3";

import {
    applySessionCookies,
    getAuthSession,
    resolveAuthenticatedUser,
} from "@/lib/auth/session";

export const runtime = "nodejs";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB for audio
const ALLOWED_TYPES = new Set(["audio/mpeg", "audio/webm", "audio/wav", "audio/mp4", "audio/ogg"]);

function error(sessionResponse: NextResponse, status: number, message: string) {
    return applySessionCookies(
        sessionResponse,
        NextResponse.json({ error: message }, { status }),
    );
}

export async function POST(request: NextRequest) {
    const { session, sessionResponse } = await getAuthSession(request);
    // We might allow anonymous recording eventually? But for now let's keep it consistent
    // Actually donate page allows generic users if they have a wallet?
    // The current avatar upload requires a session.
    // Donate page logic:
    // "Use the wagmi-based donation hook" ... implies user connects wallet.
    // Ideally we use the authenticated session if available, or just check wallet signature?
    // Current app seems to rely on session for profile features.
    // Let's rely on session being present (wallet connected -> session created might be handled elsewhere or we assume it exists).

    const sessionRecord = await resolveAuthenticatedUser(session);

    if (!sessionRecord) {
        // If user is just connecting wallet but not "signed in" to our backend logic, this might fail.
        // However, uploadAvatar requires it. Let's assume for now.
        // If not, we might need a public upload endpoint (risky).
        return error(sessionResponse, 401, "Not authenticated");
    }

    try {
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File)) {
            return error(sessionResponse, 400, "Missing file field");
        }

        const type = file.type;
        // Basic type check
        // Note: recorded audio blob often has type 'audio/webm; codecs=opus' or similar.
        // We should be lenient with check or strip parameters.
        const msgType = type.split(";")[0];
        if (!ALLOWED_TYPES.has(msgType) && !ALLOWED_TYPES.has(type)) {
            // Debug: console.log("Rejected type:", type);
            // Allow explicit webm
            if (!type.includes("audio/")) {
                return error(sessionResponse, 415, "Only audio files are allowed");
            }
        }

        if (file.size > MAX_SIZE_BYTES) {
            return error(sessionResponse, 413, "File too large (max 10MB)");
        }

        let ext = "audio";
        if (type.includes("mpeg")) ext = "mp3";
        else if (type.includes("wav")) ext = "wav";
        else if (type.includes("webm")) ext = "webm";
        else if (type.includes("ogg")) ext = "ogg";
        else if (type.includes("mp4")) ext = "m4a";

        const key = `media/${sessionRecord.user.id}-${Date.now()}.${ext}`;

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
        console.error("Media upload failed", e);
        return error(sessionResponse, 500, "Failed to upload media");
    }
}
