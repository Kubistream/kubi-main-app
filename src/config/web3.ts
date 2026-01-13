import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  injectedWallet,
  okxWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import {
  baseSepolia,
  mantleSepoliaTestnet,
  arbitrumSepolia,
  type Chain
} from "wagmi/chains";
import { createStorage } from "wagmi";

// Custom storage that works on both server and client
const noopStorage = {
  getItem: () => null,
  setItem: () => { },
  removeItem: () => { },
};

// Use noopStorage on server, localStorage on client
const storage = createStorage({
  storage: typeof window !== "undefined" ? window.localStorage : noopStorage,
});

const FALLBACK_PROJECT_ID = "00000000000000000000000000000000";

const projectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? FALLBACK_PROJECT_ID;

/**
 * Best Practice: Use this helper to configure chains.
 * It allows overriding the default RPC URL with an environment variable.
 * To add a new chain:
 * 1. Import it from "wagmi/chains"
 * 2. Add it to the supportedChains array using configureChain()
 */
const configureChain = (chain: Chain, rpcEnvVar?: string) => {
  if (rpcEnvVar && process.env[rpcEnvVar]) {
    return {
      ...chain,
      rpcUrls: {
        ...chain.rpcUrls,
        default: { http: [process.env[rpcEnvVar] as string] },
        public: { http: [process.env[rpcEnvVar] as string] },
      },
    };
  }
  return chain;
};

const configuredBaseSepolia = configureChain(baseSepolia, "NEXT_PUBLIC_BASE_RPC_URL");
const configuredMantleSepolia = {
  ...configureChain(mantleSepoliaTestnet, "NEXT_PUBLIC_MANTLE_RPC_URL"),
  iconUrl: "/assets/illustrations/mantle-logo.png",
};
const configuredArbitrumSepolia = configureChain(arbitrumSepolia, "NEXT_PUBLIC_ARBITRUM_RPC_URL");

export const supportedChains = [
  configuredMantleSepolia,
  configuredBaseSepolia,
  configuredArbitrumSepolia
] as const;

export const wagmiConfig = getDefaultConfig({
  appName: "Kubi Stream Alerts",
  projectId,
  chains: supportedChains,
  ssr: true,
  storage,
  // Wallet auto-connect should be configured with wagmi's createConfig instead of rainbowkit's getDefaultConfig.
  wallets: [
    {
      groupName: "Popular",
      wallets: [
        // Use injected wallet to avoid bringing in MetaMask SDK (and RN deps)
        injectedWallet,
        rainbowWallet,
        walletConnectWallet,
        coinbaseWallet,
        okxWallet,
      ],
    },
  ],
});

export type SupportedChainId = (typeof supportedChains)[number]["id"];
