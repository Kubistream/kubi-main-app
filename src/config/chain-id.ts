// Base Sepolia default (wagmi config uses baseSepolia)
const BASE_SEPOLIA = 84532;

export const DEFAULT_CHAIN_ID: number = (() => {
  const fromEnv = Number.parseInt(
    (process.env.CHAIN_ID as string | undefined) ??
      (process.env.NEXT_PUBLIC_CHAIN_ID as string | undefined) ??
      "",
    10,
  );
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  return BASE_SEPOLIA;
})();
