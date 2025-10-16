"use client";

import { getAddress } from "ethers";
import { getDonationContractWithSigner } from "./factory";

export async function setPrimaryToken(streamer: string, token: string) {
  const contract = await getDonationContractWithSigner();
  const tx = await contract.setPrimaryToken(getAddress(streamer), getAddress(token));
  const receipt = await tx.wait();
  return { hash: receipt?.hash ?? tx.hash };
}

export async function setStreamerWhitelist(streamer: string, token: string, allowed: boolean) {
  const contract = await getDonationContractWithSigner();
  const tx = await contract.setStreamerWhitelist(getAddress(streamer), getAddress(token), allowed);
  const receipt = await tx.wait();
  return { hash: receipt?.hash ?? tx.hash };
}

