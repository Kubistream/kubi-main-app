import { assert } from "./utils";

const FALLBACK_DONATION_ADDRESS = "0x4ff45f64d60fe55eff49077c876d3ea27936a7cd";

export function getDonationContractAddress(): string {
  const fromEnv = process.env.NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS?.trim();
  const addr = fromEnv && fromEnv !== "" ? fromEnv : FALLBACK_DONATION_ADDRESS;
  assert(/^0x[a-fA-F0-9]{40}$/.test(addr), "Invalid donation contract address");
  return addr;
}

