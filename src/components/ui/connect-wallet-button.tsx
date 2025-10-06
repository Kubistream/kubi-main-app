"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

interface ConnectWalletButtonProps {
  label?: string;
}

export function ConnectWalletButton({ label }: ConnectWalletButtonProps) {
  return (
    <ConnectButton
      label={label}
      chainStatus="icon"
      showBalance={false}
      accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
    />
  );
}
