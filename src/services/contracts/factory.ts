"use client";

import { Contract } from "ethers";
import DonationABI from "@/abis/Donation.json";
import { getDonationContractAddress } from "./addresses";
import { getBrowserProvider, getRpcProvider } from "./provider";

export async function getDonationContractWithSigner(): Promise<Contract> {
  const provider = getBrowserProvider();
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  const signer = await provider.getSigner();
  return new Contract(getDonationContractAddress(chainId), DonationABI as any, signer);
}

export function getDonationContractReadOnly(chainId?: number): Contract {
  const provider = getRpcProvider(chainId);
  return new Contract(getDonationContractAddress(chainId), DonationABI as any, provider);
}

