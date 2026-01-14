"use client";

import { getAddress } from "ethers";
import { getDonationContractReadOnly, getDonationContractWithSigner } from "./factory";

export type YieldConfig = {
  allowed: boolean;
  underlying: string;
  minDonation: bigint;
  // Ke belakang, kontrak lama mungkin punya vault; kita abaikan di UI.
  vault?: string | null;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export async function getYieldConfig(yieldContract: string): Promise<YieldConfig | null> {
  const contract = await getDonationContractReadOnly();
  const addr = getAddress(yieldContract);
  try {
    const res = await contract.getYieldConfig(addr);
    // Bentuk output bisa 3 atau 4 elemen, tergantung ABI
    // [allowed, underlying, (vault?), minDonation]
    const arr = Array.isArray(res) ? res : [];
    if (arr.length >= 3) {
      if (arr.length === 3) {
        const [allowed, underlying, minDonation] = arr as [boolean, string, bigint];
        return { allowed: Boolean(allowed), underlying, minDonation, vault: null };
      } else {
        const [allowed, underlying, maybeVault, minDonation] = arr as [boolean, string, string, bigint];
        return { allowed: Boolean(allowed), underlying, minDonation, vault: maybeVault };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function setYieldConfig(params: {
  yieldContract: string;
  underlying: string;
  allowed: boolean;
  // minDonation in raw/base units (already scaled by underlying decimals)
  minDonation: bigint;
  // Optional vault for backward-compat if ABI lama masih membutuhkan
  vaultFallback?: string;
}): Promise<{ hash: string }> {
  const { yieldContract, underlying, allowed, minDonation, vaultFallback } = params;
  const contract = await getDonationContractWithSigner();
  const y = getAddress(yieldContract);
  const u = getAddress(underlying);

  // Default panggil versi tanpa vault terlebih dahulu.
  try {
    const tx = await contract.setYieldConfig(y, u, allowed, minDonation);
    const receipt = await tx.wait();
    return { hash: receipt?.hash ?? tx.hash };
  } catch (err) {
    // Coba fallback ke signature lama yang punya vault
    const vault = vaultFallback ?? "0x0000000000000000000000000000000000000000";
    const tx = await contract.setYieldConfig(y, u, vault, allowed, minDonation);
    const receipt = await tx.wait();
    return { hash: receipt?.hash ?? tx.hash };
  }
}

// Read streamer subscription for a given underlying token
export async function getStreamerYield(streamer: string, underlying: string, chainId: number = 5003): Promise<string | null> {
  const contract = await getDonationContractReadOnly(chainId);
  try {
    const res: string = await contract.getStreamerYield(getAddress(streamer), getAddress(underlying));
    const addr = getAddress(res);
    return addr === ZERO_ADDRESS ? null : addr;
  } catch {
    return null;
  }
}

// Subscribe a streamer to a yield contract (representative token contract)
export async function setStreamerYieldContract(streamer: string, yieldContract: string, onTxHash?: (hash: string) => void): Promise<{ hash: string }> {
  const contract = await getDonationContractWithSigner();
  const tx = await contract.setStreamerYieldContract(getAddress(streamer), getAddress(yieldContract));
  if (onTxHash) onTxHash(tx.hash);
  const receipt = await tx.wait();
  return { hash: receipt?.hash ?? tx.hash };
}

// Unsubscribe a streamer from a yield contract (representative token contract)
export async function removeStreamerYieldContract(streamer: string, yieldContract: string, onTxHash?: (hash: string) => void): Promise<{ hash: string }> {
  const contract = await getDonationContractWithSigner();
  const tx = await contract.removeStreamerYieldContract(getAddress(streamer), getAddress(yieldContract));
  if (onTxHash) onTxHash(tx.hash);
  const receipt = await tx.wait();
  return { hash: receipt?.hash ?? tx.hash };
}
