import { S3Client } from "@aws-sdk/client-s3";

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env: ${name}`);
  }
  let cleaned = value.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned;
}

const endpoint = required("S3_ENDPOINT", process.env.S3_ENDPOINT);
// Ensure endpoint has protocol
const validEndpoint = (() => {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) return endpoint;
  if (endpoint.includes("localhost") || endpoint.includes("127.0.0.1")) return `http://${endpoint}`;
  return `https://${endpoint}`;
})();

const region = process.env.S3_REGION || "us-east-1";
const accessKeyId = required("S3_ACCESS_KEY_ID", process.env.S3_ACCESS_KEY_ID);
const secretAccessKey = required("S3_SECRET_ACCESS_KEY", process.env.S3_SECRET_ACCESS_KEY);
const forcePathStyle = String(process.env.S3_FORCE_PATH_STYLE || "true").toLowerCase() === "true";

export const s3 = new S3Client({
  region,
  endpoint: validEndpoint,
  forcePathStyle,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const publicBase = required("S3_PUBLIC_BASE_URL", process.env.S3_PUBLIC_BASE_URL);

export function publicUrlForKey(key: string): string {
  // Ensure no duplicate slashes
  return `${publicBase.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}

export function requiredBucket(): string {
  return required("S3_BUCKET_AVATARS", process.env.S3_BUCKET_AVATARS);
}

