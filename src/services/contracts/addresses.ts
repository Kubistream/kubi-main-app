import { assert } from "./utils";

// Contract addresses per chain
const DONATION_CONTRACTS: Record<number, string> = {
  84532: "0x4AB4a2290cB651065D346299425b2D45eEf9D75D", // Base Sepolia
  5003: "0xDb26Ba8581979dc4E11218735F821Af5171fb737",  // Mantle Sepolia
};

// Fallback for backwards compatibility
const FALLBACK_DONATION_ADDRESS = "0x4AB4a2290cB651065D346299425b2D45eEf9D75D";

export function getDonationContractAddress(chainId?: number): string {
  // If chainId provided, look up in the map
  if (chainId && DONATION_CONTRACTS[chainId]) {
    return DONATION_CONTRACTS[chainId];
  }

  // Fallback to env var or default
  const fromEnv = process.env.NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS?.trim();
  const addr = fromEnv && fromEnv !== "" ? fromEnv : FALLBACK_DONATION_ADDRESS;
  assert(/^0x[a-fA-F0-9]{40}$/.test(addr), "Invalid donation contract address");
  return addr;
}

export function getSupportedChainIds(): number[] {
  return Object.keys(DONATION_CONTRACTS).map(Number);
}

export function isChainSupported(chainId: number): boolean {
  return chainId in DONATION_CONTRACTS;
}
