import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  injectedWallet,
  okxWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { baseSepolia } from "wagmi/chains";
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

const customBaseSepolia = {
  ...baseSepolia,
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://sepolia.base.org"] },
    public: { http: [process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://sepolia.base.org"] },
  },
};

export const supportedChains = [customBaseSepolia] as const;

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
