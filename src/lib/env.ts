// Zod-based env validation temporarily disabled per request.
// Replaced with minimal non-Zod parsing + soft checks.

type RawEnv = {
  NODE_ENV?: string;
  DATABASE_URL?: string;
  SESSION_SECRET?: string;
  APP_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID?: string;
  PUSHER_APP_ID?: string;
  PUSHER_KEY?: string;
  PUSHER_SECRET?: string;
  PUSHER_CLUSTER?: string;
  NEXT_PUBLIC_PUSHER_KEY?: string;
  NEXT_PUBLIC_PUSHER_CLUSTER?: string;
};

const rawEnv: RawEnv = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  APP_URL: process.env.APP_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  PUSHER_APP_ID: process.env.PUSHER_APP_ID,
  PUSHER_KEY: process.env.PUSHER_KEY,
  PUSHER_SECRET: process.env.PUSHER_SECRET,
  PUSHER_CLUSTER: process.env.PUSHER_CLUSTER,
  NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
  NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
};

function isNonEmpty(str: unknown): str is string {
  return typeof str === "string" && str.trim().length > 0;
}

const NODE_ENV = isNonEmpty(rawEnv.NODE_ENV)
  ? (rawEnv.NODE_ENV as "development" | "test" | "production")
  : "development";

export const env = {
  NODE_ENV,
  DATABASE_URL: isNonEmpty(rawEnv.DATABASE_URL) ? rawEnv.DATABASE_URL : undefined,
  SESSION_SECRET: isNonEmpty(rawEnv.SESSION_SECRET) ? rawEnv.SESSION_SECRET : undefined,
  APP_URL: (() => {
    try {
      return isNonEmpty(rawEnv.APP_URL) ? new URL(rawEnv.APP_URL).toString() : undefined;
    } catch {
      return undefined;
    }
  })(),
  NEXT_PUBLIC_APP_URL: (() => {
    try {
      return isNonEmpty(rawEnv.NEXT_PUBLIC_APP_URL)
        ? new URL(rawEnv.NEXT_PUBLIC_APP_URL).toString()
        : undefined;
    } catch {
      return undefined;
    }
  })(),
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: isNonEmpty(
    rawEnv.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  )
    ? rawEnv.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
    : undefined,
  PUSHER_APP_ID: isNonEmpty(rawEnv.PUSHER_APP_ID) ? rawEnv.PUSHER_APP_ID : undefined,
  PUSHER_KEY: isNonEmpty(rawEnv.PUSHER_KEY) ? rawEnv.PUSHER_KEY : undefined,
  PUSHER_SECRET: isNonEmpty(rawEnv.PUSHER_SECRET) ? rawEnv.PUSHER_SECRET : undefined,
  PUSHER_CLUSTER: isNonEmpty(rawEnv.PUSHER_CLUSTER) ? rawEnv.PUSHER_CLUSTER : undefined,
  NEXT_PUBLIC_PUSHER_KEY: isNonEmpty(rawEnv.NEXT_PUBLIC_PUSHER_KEY)
    ? rawEnv.NEXT_PUBLIC_PUSHER_KEY
    : undefined,
  NEXT_PUBLIC_PUSHER_CLUSTER: isNonEmpty(rawEnv.NEXT_PUBLIC_PUSHER_CLUSTER)
    ? rawEnv.NEXT_PUBLIC_PUSHER_CLUSTER
    : undefined,
} as const;

export const isProduction = env.NODE_ENV === "production";

// Soft warnings to aid debugging without blocking runtime
const warnings: string[] = [];
if (!env.DATABASE_URL) warnings.push("DATABASE_URL is missing");
if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32)
  warnings.push("SESSION_SECRET missing or < 32 chars");
if (!env.APP_URL) warnings.push("APP_URL is missing or invalid URL");
if (!env.NEXT_PUBLIC_APP_URL)
  warnings.push("NEXT_PUBLIC_APP_URL is missing or invalid URL");
if (!env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID)
  warnings.push("NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is missing");
if (!env.PUSHER_APP_ID || !env.PUSHER_KEY || !env.PUSHER_SECRET || !env.PUSHER_CLUSTER)
  warnings.push("PUSHER_APP_ID/KEY/SECRET/CLUSTER is missing");
if (!env.NEXT_PUBLIC_PUSHER_KEY || !env.NEXT_PUBLIC_PUSHER_CLUSTER)
  warnings.push("NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER is missing");

if (warnings.length > 0) {
  // Keep non-fatal: only warn to console
  console.warn(
    [
      "Environment warnings (non-fatal):",
      ...warnings.map((w) => `- ${w}`),
    ].join("\n"),
  );
}
