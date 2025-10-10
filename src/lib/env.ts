// Zod-based env validation temporarily disabled per request.
// Replaced with minimal non-Zod parsing + soft checks.

type RawEnv = {
  NODE_ENV?: string;
  DATABASE_URL?: string;
  SESSION_SECRET?: string;
  APP_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID?: string;
};

const rawEnv: RawEnv = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  APP_URL: process.env.APP_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
};

function isNonEmpty(str: unknown): str is string {
  return typeof str === "string" && str.trim().length > 0;
}

function safeUrl(value: unknown): string | undefined {
  if (!isNonEmpty(value)) return undefined;
  try {
    // Ensure protocol exists and URL is well-formed
    // eslint-disable-next-line no-new
    new URL(value);
    return value;
  } catch {
    return undefined;
  }
}

const NODE_ENV = isNonEmpty(rawEnv.NODE_ENV)
  ? (rawEnv.NODE_ENV as "development" | "test" | "production")
  : "development";

export const env = {
  NODE_ENV,
  DATABASE_URL: isNonEmpty(rawEnv.DATABASE_URL) ? rawEnv.DATABASE_URL : undefined,
  SESSION_SECRET: isNonEmpty(rawEnv.SESSION_SECRET) ? rawEnv.SESSION_SECRET : undefined,
  APP_URL: safeUrl(rawEnv.APP_URL),
  NEXT_PUBLIC_APP_URL: safeUrl(rawEnv.NEXT_PUBLIC_APP_URL),
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: isNonEmpty(
    rawEnv.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  )
    ? rawEnv.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
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

if (warnings.length > 0) {
  // Keep non-fatal: only warn to console
  // eslint-disable-next-line no-console
  console.warn(
    [
      "Environment warnings (non-fatal):",
      ...warnings.map((w) => `- ${w}`),
    ].join("\n"),
  );
}
