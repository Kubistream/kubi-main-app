import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains";

const FALLBACK_PROJECT_ID = "00000000000000000000000000000000";

const projectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? FALLBACK_PROJECT_ID;

export const supportedChains = [mainnet, polygon, optimism, arbitrum, base];

export const wagmiConfig = getDefaultConfig({
  appName: "Kubi Stream Alerts",
  projectId,
  chains: supportedChains,
  ssr: true,
});

export type SupportedChainId = (typeof supportedChains)[number]["id"];
