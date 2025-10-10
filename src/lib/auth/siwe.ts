import { generateNonce, SiweMessage } from "siwe";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const NONCE_TTL_SECONDS = 60 * 10; // 10 minutes
const NONCE_CLEANUP_THRESHOLD_HOURS = 24;

const appHost = new URL(env.APP_URL).host;
const appOrigin = new URL(env.NEXT_PUBLIC_APP_URL).origin;

export class SiweError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "SiweError";
  }
}

export async function createSiweNonce(sessionId?: string) {
  const nonce = generateNonce();
  const expiresAt = new Date(Date.now() + NONCE_TTL_SECONDS * 1000);

  await prisma.siweNonce.create({
    data: {
      nonce,
      expiresAt,
      sessionId,
    },
  });

  // Opportunistically clean up old, expired nonces.
  const cleanupCutoff = new Date(
    Date.now() - NONCE_CLEANUP_THRESHOLD_HOURS * 60 * 60 * 1000,
  );
  await prisma.siweNonce.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: cleanupCutoff } },
        { consumedAt: { lt: cleanupCutoff } },
      ],
    },
  });

  return nonce;
}

interface VerifySiweParams {
  message: string;
  signature: string;
}

export async function verifySiweMessage({ message, signature }: VerifySiweParams) {
  let siweMessage: SiweMessage;

  try {
    siweMessage = new SiweMessage(message);
  } catch {
    throw new SiweError("Invalid SIWE message payload");
  }

  if (siweMessage.domain !== appHost) {
    throw new SiweError("SIWE domain mismatch");
  }

  const messageOrigin = new URL(siweMessage.uri).origin;
  if (messageOrigin !== appOrigin) {
    throw new SiweError("SIWE origin mismatch");
  }

  const nonceRecord = await prisma.siweNonce.findUnique({
    where: { nonce: siweMessage.nonce },
  });

  if (!nonceRecord) {
    throw new SiweError("Provided nonce is invalid or has expired");
  }

  if (nonceRecord.consumedAt) {
    throw new SiweError("Nonce has already been used");
  }

  if (nonceRecord.expiresAt.getTime() <= Date.now()) {
    throw new SiweError("Nonce has expired");
  }

  const verification = await siweMessage.verify({
    signature,
    domain: appHost,
    nonce: nonceRecord.nonce,
  });

  if (!verification.success) {
    throw new SiweError("SIWE signature verification failed", 401);
  }

  await prisma.siweNonce.update({
    where: { id: nonceRecord.id },
    data: { consumedAt: new Date() },
  });

  return {
    address: siweMessage.address.toLowerCase(),
    chainId: siweMessage.chainId,
    nonce: nonceRecord.nonce,
  };
}
