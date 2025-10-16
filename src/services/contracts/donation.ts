"use client";

import { Contract, getAddress } from "ethers";
import { getDonationContractWithSigner } from "./factory";
import { getDonationContractAddress } from "./addresses";

export { getDonationContractAddress };

export async function getDonationContract(): Promise<Contract> {
  return getDonationContractWithSigner();
}

export type DonateParams = {
  supporter: string;
  tokenIn: string;
  amount: bigint;
  streamer: string;
  amountOutMin: bigint;
  deadline: bigint;
  value?: bigint;
};

export async function donate({ supporter, tokenIn, amount, streamer, amountOutMin, deadline, value }: DonateParams) {
  const contract = await getDonationContract();
  const tx = await contract.donate(
    getAddress(supporter),
    getAddress(tokenIn),
    amount,
    getAddress(streamer),
    amountOutMin,
    deadline,
    value ? { value } : {},
  );
  const receipt = await tx.wait();
  return { hash: receipt?.hash ?? tx.hash };
}

