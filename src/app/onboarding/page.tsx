"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";
import { useWallet } from "@/hooks/use-wallet";
import {
  getProfile,
  saveProfile,
  type StreamerProfile,
} from "@/services/streamers/profile-service";

export default function OnboardingPage() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const existingProfile = useMemo(() => {
    if (!address) return null;
    return getProfile(address);
  }, [address]);

  useEffect(() => {
    if (!existingProfile) return;
    setUsername(existingProfile.username);
    setAvatarUrl(existingProfile.avatarUrl ?? "");
  }, [existingProfile]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!address) return;

    setStatus("saving");
    const profile: StreamerProfile = {
      address,
      username,
      avatarUrl: avatarUrl || undefined,
      updatedAt: Date.now(),
    };

    saveProfile(profile);
    setStatus("saved");

    setTimeout(() => {
      router.push("/dashboard");
    }, 800);
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-950 px-6 py-20 text-slate-100">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl shadow-slate-950/40">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">
            Step 1
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Set up your streamer profile
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            We&apos;ll use your connected wallet to create a profile page and
            donation link. You can tweak these settings later in the dashboard.
          </p>
        </header>

        {!isConnected && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center">
            <p className="text-sm text-slate-300">
              Connect your wallet to continue. We support popular wallet
              providers through RainbowKit.
            </p>
            <ConnectWalletButton label="Connect wallet" />
          </div>
        )}

        {isConnected && (
          <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-200">
                Streamer username
              </label>
              <input
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="e.g. kubi_sensei"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="mt-1 text-xs text-slate-500">
                This handle appears on your donation page and leaderboard.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">
                Profile image URL
              </label>
              <input
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://..."
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="mt-1 text-xs text-slate-500">
                Paste an image link for now. We&apos;ll support uploading soon.
              </p>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700"
              disabled={!username || status === "saving"}
            >
              {status === "saving"
                ? "Saving profile..."
                : status === "saved"
                  ? "Profile saved!"
                  : existingProfile
                    ? "Update profile"
                    : "Save and continue"}
            </button>

            {existingProfile && (
              <p className="text-xs text-slate-400">
                Last updated: {new Date(existingProfile.updatedAt).toLocaleString()}
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
