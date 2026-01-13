"use client";

import { getAddress } from "ethers";
import { getDonationContractWithSigner, getDonationContractReadOnly } from "./factory";

export async function setPrimaryToken(streamer: string, token: string, onTxHash?: (hash: string) => void) {
  const contract = await getDonationContractWithSigner();
  const tx = await contract.setPrimaryToken(getAddress(streamer), getAddress(token));
  if (onTxHash) onTxHash(tx.hash);
  const receipt = await tx.wait();
  return { hash: receipt?.hash ?? tx.hash };
}

export async function setStreamerWhitelist(streamer: string, token: string, allowed: boolean, onTxHash?: (hash: string) => void) {
  const contract = await getDonationContractWithSigner();
  const tx = await contract.setStreamerWhitelist(getAddress(streamer), getAddress(token), allowed);
  if (onTxHash) onTxHash(tx.hash);
  const receipt = await tx.wait();
  return { hash: receipt?.hash ?? tx.hash };
}

// Admin: Global fee + whitelist helpers
export async function getFeeConfig(): Promise<{ bps: number; recipient: string }> {
  const contract = await getDonationContractReadOnly();
  const [bps, recipient] = await Promise.all([contract.feeBps(), contract.feeRecipient()]);
  // bps is a uint16; coerce to number for UI
  return { bps: Number(bps), recipient };
}

export async function setFeeConfig(bps: number, recipient: string) {
  if (!Number.isFinite(bps) || bps < 0 || bps > 10000) {
    throw new Error("Invalid fee bps. Must be between 0 and 10000.");
  }
  const contract = await getDonationContractWithSigner();
  const tx = await contract.setFeeConfig(bps, getAddress(recipient));
  const receipt = await tx.wait();
  return { hash: receipt?.hash ?? tx.hash };
}

export async function isGloballyWhitelisted(token: string): Promise<boolean> {
  const contract = await getDonationContractReadOnly();
  const allowed = await contract.globalWhitelist(getAddress(token));
  return Boolean(allowed);
}

export async function setGlobalWhitelist(token: string, allowed: boolean) {
  const contract = await getDonationContractWithSigner();
  const tx = await contract.setGlobalWhitelist(getAddress(token), allowed);
  const receipt = await tx.wait();
  return { hash: receipt?.hash ?? tx.hash };
}
