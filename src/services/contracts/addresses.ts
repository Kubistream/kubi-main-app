import { assert } from "./utils";

const FALLBACK_DONATION_ADDRESS = "0xe938D69B23fF0E8EF24442736Ecc6ec324022eaB";

export function getDonationContractAddress(): string {
  const fromEnv = process.env.NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS?.trim();
  const addr = fromEnv && fromEnv !== "" ? fromEnv : FALLBACK_DONATION_ADDRESS;
  assert(/^0x[a-fA-F0-9]{40}$/.test(addr), "Invalid donation contract address");
  return addr;
}

