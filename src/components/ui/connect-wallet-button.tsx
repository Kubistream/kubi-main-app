"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

import { useAuth } from "@/providers/auth-provider";

interface ConnectWalletButtonProps {
  label?: string;
}

export function ConnectWalletButton({ label }: ConnectWalletButtonProps) {
  const { isConnected } = useAccount();
  const { status, isSigning, signIn } = useAuth();
  const [attemptedSignIn, setAttemptedSignIn] = useState(false);

  useEffect(() => {
    if (isConnected && status === "unauthenticated" && !isSigning && !attemptedSignIn) {
      setAttemptedSignIn(true);
      signIn().catch((error) => {
        console.error("Automatic SIWE sign-in failed", error);
        setAttemptedSignIn(false);
      });
    }

    if (!isConnected) {
      setAttemptedSignIn(false);
    }
  }, [attemptedSignIn, isConnected, isSigning, signIn, status]);

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
