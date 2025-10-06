"use client";

import { useAccount, useDisconnect } from "wagmi";

export function useWallet() {
  const account = useAccount();
  const disconnect = useDisconnect();

  return {
    address: account.address,
    isConnected: account.isConnected,
    status: account.status,
    disconnect: disconnect.disconnect,
  };
}
