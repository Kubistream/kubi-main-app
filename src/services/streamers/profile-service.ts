export interface StreamerProfile {
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isComplete: boolean;
  completedAt: string | null;
}

export interface UpdateStreamerProfileInput {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}

type ProfileResponse = {
  profile: {
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    isComplete: boolean;
    completedAt: string | null;
  };
};

const normalizeProfile = (profile: ProfileResponse["profile"]): StreamerProfile => ({
  username: profile.username ?? null,
  displayName: profile.displayName ?? null,
  avatarUrl: profile.avatarUrl ?? null,
  bio: profile.bio ?? null,
  isComplete: Boolean(profile.isComplete),
  completedAt: profile.completedAt ?? null,
});

export async function fetchStreamerProfile(): Promise<StreamerProfile | null> {
  try {
    const response = await fetch("/api/streamers/me", {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { profile: ProfileResponse["profile"] | null };
    if (!data.profile) {
      return null;
    }

    return normalizeProfile(data.profile);
  } catch (error) {
    console.error("Failed to load streamer profile", error);
    return null;
  }
}

export async function updateStreamerProfile(
  input: UpdateStreamerProfileInput,
): Promise<StreamerProfile> {
  const response = await fetch("/api/streamers/profile", {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Failed to update profile" }));
    throw new Error(payload.error || "Failed to update profile");
  }

  const data = (await response.json()) as ProfileResponse;
  return normalizeProfile(data.profile);
}
