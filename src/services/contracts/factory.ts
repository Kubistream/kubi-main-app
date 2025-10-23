"use client";

import { Contract } from "ethers";
import DonationABI from "@/abis/Donation.json";
import { getDonationContractAddress } from "./addresses";
import { getBrowserProvider, getRpcProvider } from "./provider";

export async function getDonationContractWithSigner(): Promise<Contract> {
  const provider = getBrowserProvider();
  // const provider = getRpcProvider();
  const signer = await provider.getSigner();
  return new Contract(getDonationContractAddress(), DonationABI as any, signer);
}

export function getDonationContractReadOnly(): Contract {
  const provider = getRpcProvider();
  return new Contract(getDonationContractAddress(), DonationABI as any, provider);
}

