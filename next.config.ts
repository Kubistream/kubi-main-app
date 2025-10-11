import type { NextConfig } from "next";
// Clean config: no zod/porto aliases while testing
const alias: Record<string, string> = {};

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
