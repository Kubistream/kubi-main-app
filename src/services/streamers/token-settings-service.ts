export type StreamerTokenSettings = {
  primaryTokenId: string | null;
  autoswapEnabled: boolean;
  whitelistTokenIds: string[];
};

export async function fetchTokenSettings(): Promise<StreamerTokenSettings | null> {
  try {
    const res = await fetch("/api/streamers/token-settings", {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as StreamerTokenSettings;
    return data;
  } catch (err) {
    console.error("Failed to fetch token settings", err);
    return null;
  }
}

export async function updateTokenSettings(
  input: StreamerTokenSettings,
): Promise<StreamerTokenSettings> {
  const res = await fetch("/api/streamers/token-settings", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: "Failed to update settings" }));
    throw new Error(payload.error || "Failed to update settings");
  }

  const data = (await res.json()) as StreamerTokenSettings;
  return data;
}

