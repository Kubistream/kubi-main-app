import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  metaMaskWallet,
  okxWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { baseSepolia } from "wagmi/chains"; // Only import baseSepolia

const FALLBACK_PROJECT_ID = "00000000000000000000000000000000";

const projectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? FALLBACK_PROJECT_ID;

export const supportedChains = [
  baseSepolia,
] as const;

export const wagmiConfig = getDefaultConfig({
  appName: "Kubi Stream Alerts",
  projectId,
  chains: supportedChains,
  ssr: true,
  wallets: [
    {
      groupName: "Popular",
      wallets: [
        metaMaskWallet,
        rainbowWallet,
        walletConnectWallet,
        coinbaseWallet,
        okxWallet,
      ],
    },
  ],
});

export type SupportedChainId = (typeof supportedChains)[number]["id"];