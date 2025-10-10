import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    SESSION_SECRET: z
      .string()
      .min(32, "SESSION_SECRET must be at least 32 characters to satisfy iron-session requirements"),
    APP_URL: z.string().url("APP_URL must be a valid URL"),
    NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: z
      .string()
      .min(1, "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is required"),
  })
  .refine(
    (values) => values.APP_URL.startsWith("http"),
    "APP_URL must include the protocol (e.g. https://localhost:3000)",
  )
  .refine(
    (values) => values.NEXT_PUBLIC_APP_URL.startsWith("http"),
    "NEXT_PUBLIC_APP_URL must include the protocol",
  );

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  APP_URL: process.env.APP_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
});

if (!parsed.success) {
  const fieldErrors = parsed.error.flatten().fieldErrors;
  const errorMessage = Object.entries(fieldErrors)
    .flatMap(([key, errors]) => (errors ? errors.map((error) => `${key}: ${error}`) : []))
    .join("\n");

  console.error("Invalid environment variables:\n".concat(errorMessage));
  throw new Error("Failed to validate environment variables");
}

export const env = parsed.data;
export const isProduction = parsed.data.NODE_ENV === "production";
