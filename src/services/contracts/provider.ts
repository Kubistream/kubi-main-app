"use client";

import { BrowserProvider, JsonRpcProvider } from "ethers";

export function getBrowserProvider(): BrowserProvider {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("Wallet provider not found. Please connect your wallet.");
  }
  return new BrowserProvider((window as any).ethereum, "any");
}

export function getRpcProvider(): JsonRpcProvider {
  const url =
    (process.env.NEXT_PUBLIC_BASE_RPC_URL as string | undefined) ||
    "https://sepolia.base.org";
  return new JsonRpcProvider(url);
}

