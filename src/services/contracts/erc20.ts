"use client";

import { Contract } from "ethers";
import ERC20_ABI from "@/abis/ERC20.json";

export function getErc20Contract(address: string, signerOrProvider: any): Contract {
  return new Contract(address, ERC20_ABI as any, signerOrProvider);
}

