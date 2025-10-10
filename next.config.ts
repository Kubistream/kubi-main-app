import { createRequire } from "node:module";
import type { NextConfig } from "next";

const require = createRequire(import.meta.url);
const alias: Record<string, string> = {
  zod: require.resolve("zod"),
  "zod/mini": require.resolve("zod/mini"),
  "porto/internal": require.resolve("./src/shims/porto-internal.ts"),
};

const nextConfig: NextConfig = {
  // New placement for Turbopack in Next 15+
  turbopack: {
    resolveAlias: alias,
  },
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias ??= {};
    Object.assign(config.resolve.alias, alias);
    return config;
  },
};

export default nextConfig;
