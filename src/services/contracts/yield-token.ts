"use client";

import { Contract } from "ethers";
import { getRpcProvider } from "./provider";

// Minimal ABI for Kubi yield/representative tokens (mo* family)
const YIELD_TOKEN_ABI = [
  "function walletGrowth(address user) view returns (uint256)",
] as const;

// Reads walletGrowth(user) and returns a percentage (number),
// where raw is scaled by 1e18 and represents a fraction. percent = raw/1e18*100
export async function getWalletGrowthPercent(
  representativeToken: string,
  user: string,
): Promise<number | null> {
  try {
    const provider = getRpcProvider();
    const contract = new Contract(representativeToken, YIELD_TOKEN_ABI, provider);
    const raw: bigint = await withTimeout(contract.walletGrowth(user), 8000);
    // Convert 1e18 fraction to percent
    // percent = (raw / 1e18) * 100 = raw / 1e16
    const percent = Number(raw) / 1e16;
    if (!Number.isFinite(percent)) return null;
    return percent;
  } catch {
    return null;
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

