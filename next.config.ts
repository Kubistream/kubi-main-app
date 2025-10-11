import type { NextConfig } from "next";
import fs from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Clean config: no zod/porto aliases while testing
const alias: Record<string, string> = {};

// Load public env from env/.env.local without moving the file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extraEnvPath = path.join(__dirname, "env/.env.local");
if (fs.existsSync(extraEnvPath)) {
  const raw = fs.readFileSync(extraEnvPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line)) continue;
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

const nextConfig: NextConfig = {
  // New placement for Turbopack in Next 15+
  turbopack: {
    resolveAlias: alias,
  },
  // Expose public env at build-time without moving files
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  },
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias ??= {};
    Object.assign(config.resolve.alias, alias);
    return config;
  },
};

export default nextConfig;
