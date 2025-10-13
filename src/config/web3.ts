import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  injectedWallet,
  okxWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { baseSepolia } from "wagmi/chains";

const FALLBACK_PROJECT_ID = "00000000000000000000000000000000";

const projectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? FALLBACK_PROJECT_ID;

export const supportedChains = [baseSepolia] as const;

export const wagmiConfig = getDefaultConfig({
  appName: "Kubi Stream Alerts",
  projectId,
  chains: supportedChains,
  ssr: true,
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
