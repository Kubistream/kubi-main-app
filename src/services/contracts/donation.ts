"use client";

import { Contract, getAddress } from "ethers";
import { getDonationContractWithSigner } from "./factory";
import { getDonationContractAddress } from "./addresses";

export { getDonationContractAddress };

export async function getDonationContract(): Promise<Contract> {
  return getDonationContractWithSigner();
}

export type DonateParams = {
  supporter: string; // Kept for backward compat in type, but ignored in call
  tokenIn: string;
  tokenOut?: string;
  amount: bigint;
  streamer: string;
  amountOutMin: bigint;
  deadline: bigint;
  value?: bigint;
};

export async function donate({ supporter, tokenIn, tokenOut, amount, streamer, amountOutMin, deadline, value }: DonateParams) {
  const contract = await getDonationContract();
  const tokenInAddr = getAddress(tokenIn);
  const tokenOutAddr = tokenOut ? getAddress(tokenOut) : tokenInAddr;

  const tx = await contract.donate(
    tokenInAddr,
    tokenOutAddr,
    amount,
    getAddress(streamer),
    amountOutMin,
    deadline,
    value ? { value } : {},
  );
  const receipt = await tx.wait();
  return { hash: receipt?.hash ?? tx.hash };
}

