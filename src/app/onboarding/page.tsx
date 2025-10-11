"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";
import { useWallet } from "@/hooks/use-wallet";
import { getProfile, saveProfile, type StreamerProfile } from "@/services/streamers/profile-service";

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
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-rose-100 via-white to-rose-50 px-6 py-20 text-slate-900">
      <Card className="w-full max-w-2xl border-white/70 bg-white/90 shadow-lg shadow-rose-200/40">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold text-slate-900">
            Set up your streamer profile
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            We&apos;ll use your connected wallet to create a profile page and donation link. You can tweak these settings later in the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isConnected && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-center">
              <p className="text-sm text-slate-600">
                Connect your wallet from the header to continue. We support popular providers through RainbowKit.
              </p>
            </div>
          )}

          {isConnected && (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Streamer username</Label>
                <Input
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="e.g. kubi_sensei"
                />
                <p className="text-xs text-slate-500">
                  This handle appears on your donation page and leaderboard.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Profile image URL</Label>
                <Input
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-slate-500">
                  Paste an image link for now. We&apos;ll support uploading soon.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!username || status === "saving"}
              >
                {status === "saving"
                  ? "Saving profile..."
                  : status === "saved"
                    ? "Profile saved!"
                    : existingProfile
                      ? "Update profile"
                      : "Save and continue"}
              </Button>

              {existingProfile && (
                <p className="text-xs text-slate-500">
                  Last updated: {new Date(existingProfile.updatedAt).toLocaleString()}
                </p>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
