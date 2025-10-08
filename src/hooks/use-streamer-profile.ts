"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/use-wallet";
import {
  getProfile,
  type StreamerProfile,
} from "@/services/streamers/profile-service";

export function useStreamerProfile() {
  const { address, isConnected } = useWallet();
  const [profile, setProfile] = useState<StreamerProfile | null>(null);

  useEffect(() => {
    if (!address || !isConnected) {
      setProfile(null);
      return;
    }

    setProfile(getProfile(address));
  }, [address, isConnected]);

  return { profile, address, isConnected };
}
