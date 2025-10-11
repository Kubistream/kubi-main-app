"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

import { useAuth } from "@/providers/auth-provider";

interface ConnectWalletButtonProps {
  label?: string;
}

export function ConnectWalletButton({ label }: ConnectWalletButtonProps) {
  const { isConnected } = useAccount();
  const { status, isSigning } = useAuth();

  const computedLabel = (() => {
    if (label) return label;
    if (isSigning) return "Check your wallet";
    if (status === "authenticated") return undefined;
    return "Connect wallet";
  })();

  return (
    <ConnectButton
      label={computedLabel}
      chainStatus="icon"
      showBalance={false}
      accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
    />
  );
}
