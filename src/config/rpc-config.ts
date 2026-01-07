/**
 * RPC Configuration - Fallback URLs per Chain
 *
 * Provides multiple RPC endpoints per chain for automatic failover
 * when primary RPC fails (rate limit, timeout, etc.)
 */

export interface ChainRpcConfig {
  chainId: number;
  chainName: string;
  rpcs: string[];
}

/**
 * RPC configurations with fallback URLs
 * Order matters - first URL is primary, subsequent are fallbacks
 */
export const RPC_CONFIGS: Record<number, ChainRpcConfig> = {
  // Base Sepolia (Testnet)
  84532: {
    chainId: 84532,
    chainName: "Base Sepolia",
    rpcs: [
      "https://sepolia.base.org",
      "https://base-sepolia.drpc.org",
      "https://base-sepolia-rpc.publicnode.com",
      "https://base-sepolia.blockpi.network/v1/rpc/public",
    ],
  },

  // Mantle Sepolia (Testnet)
  5003: {
    chainId: 5003,
    chainName: "Mantle Sepolia",
    rpcs: [
      "https://rpc.sepolia.mantle.xyz",
      "https://rpc.ankr.com/mantle_sepolia",
      "https://mantle-sepolia.drpc.org",
    ],
  },

  // Base Mainnet
  8453: {
    chainId: 8453,
    chainName: "Base",
    rpcs: [
      "https://mainnet.base.org",
      "https://base.drpc.org",
      "https://base-rpc.publicnode.com",
      "https://base.blockpi.network/v1/rpc/public",
    ],
  },

  // Mantle Mainnet
  5000: {
    chainId: 5000,
    chainName: "Mantle",
    rpcs: [
      "https://rpc.mantle.xyz",
      "https://rpc.ankr.com/mantle",
      "https://mantle.drpc.org",
    ],
  },
};

/**
 * Get RPC URLs for a specific chain
 * @param chainId - The chain ID
 * @returns Array of RPC URLs (empty array if chain not found)
 */
export function getRpcUrls(chainId: number): string[] {
  return RPC_CONFIGS[chainId]?.rpcs || [];
}

/**
 * Get chain name by chain ID
 * @param chainId - The chain ID
 * @returns Chain name or "Unknown"
 */
export function getChainName(chainId: number): string {
  return RPC_CONFIGS[chainId]?.chainName || "Unknown";
}

/**
 * Default chain ID (Base Sepolia for development)
 */
export const DEFAULT_CHAIN_ID = 84532;
