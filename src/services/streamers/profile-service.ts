export interface StreamerProfile {
  address: string;
  username: string;
  avatarUrl?: string;
  updatedAt: number;
}

const STORAGE_PREFIX = "kubi.profile";

const isBrowser = typeof window !== "undefined";

const makeKey = (address: string) =>
  `${STORAGE_PREFIX}:${address.toLowerCase()}`;

export function saveProfile(profile: StreamerProfile) {
  if (!isBrowser) return;
  window.localStorage.setItem(
    makeKey(profile.address),
    JSON.stringify(profile),
  );
}

export function getProfile(address: string): StreamerProfile | null {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(makeKey(address));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StreamerProfile;
  } catch (error) {
    console.error("Failed to parse streamer profile", error);
    return null;
  }
}

export function clearProfile(address: string) {
  if (!isBrowser) return;
  window.localStorage.removeItem(makeKey(address));
}
