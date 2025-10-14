"use client";

import { FormEvent, ChangeEventHandler, useEffect, useMemo, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useStreamerProfile } from "@/hooks/use-streamer-profile";
import { updateStreamerProfile } from "@/services/streamers/profile-service";
import { uploadAvatar } from "@/services/uploads/avatar-service";
import { useAuth } from "@/providers/auth-provider";
import { useTokenSettings } from "@/hooks/use-token-settings";

type FormState = {
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onboarding = searchParams.get("onboarding") === "1";

  const { profile, isConnected, isLoading, refresh } = useStreamerProfile();
  const { refresh: refreshAuth } = useAuth();

  // Token settings hooks
  const { tokens, settings, isConnected: canEditTokens, isLoading: loadingTokens, save: saveTokenSettings, refresh: refreshTokenSettings } = useTokenSettings();

  const [form, setForm] = useState<FormState>({
    username: "",
    displayName: "",
    avatarUrl: "",
    bio: "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (initializedRef.current) return;

    initializedRef.current = true;
    setForm({
      username: profile.username ?? "",
      displayName: profile.displayName ?? "",
      avatarUrl: profile.avatarUrl ?? "",
      bio: profile.bio ?? "",
    });
  }, [profile]);

  const isSubmitDisabled =
    !isConnected ||
    !form.username.trim() ||
    /[^a-zA-Z0-9_-]/.test(form.username) ||
    status === "saving";

  const helperText = useMemo(() => {
    if (!isConnected) {
      return "Connect your wallet to edit your streamer profile.";
    }

    if (isLoading && !profile) {
      return "Loading your current profile settings...";
    }

    if (onboarding && profile?.isComplete !== true) {
      return "Complete these fields to unlock the rest of your dashboard.";
    }

    return "This information powers your donation page and overlays.";
  }, [isConnected, isLoading, onboarding, profile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitDisabled) return;

    setStatus("saving");
    setErrorMessage(null);

    try {
      let nextAvatarUrl: string | undefined = undefined;
      if (selectedFile) {
        // Validate client-side
        const allowed = new Set(["image/png", "image/jpeg"]);
        if (!allowed.has(selectedFile.type)) {
          throw new Error("Only PNG and JPEG images are allowed");
        }
        const maxBytes = 5 * 1024 * 1024;
        if (selectedFile.size > maxBytes) {
          throw new Error("File too large (max 5MB)");
        }

        nextAvatarUrl = await uploadAvatar(selectedFile);
      }

      let resolvedAvatarUrl: string | undefined = nextAvatarUrl;
      if (resolvedAvatarUrl == null) {
        const existing = form.avatarUrl.trim();
        resolvedAvatarUrl = existing ? existing : undefined;
      }

      const updated = await updateStreamerProfile({
        username: form.username.trim(),
        displayName: form.displayName.trim() || undefined,
        avatarUrl: resolvedAvatarUrl,
        bio: form.bio.trim() || undefined,
      });

      setForm({
        username: updated.username ?? "",
        displayName: updated.displayName ?? "",
        avatarUrl: updated.avatarUrl ?? "",
        bio: updated.bio ?? "",
      });

      // Clear local selection after successful save
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(null);

      setStatus("saved");

      await Promise.all([refresh(), refreshAuth()]);

      if (onboarding) {
        setTimeout(() => {
          router.replace("/dashboard");
        }, 800);
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to update streamer profile.");
    }
  };

  // Manage preview URL lifecycle
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const currentAvatarUrl = previewUrl || (form.avatarUrl || "");
  const hasAvatar = Boolean(currentAvatarUrl);

  const handleAddPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected: ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const allowed = new Set(["image/png", "image/jpeg"]);
    if (!allowed.has(file.type)) {
      setErrorMessage("Only PNG and JPEG images are allowed");
      return;
    }
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage("File too large (max 5MB)");
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-400">Profile</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          {onboarding ? "Finish setting up your creator profile" : "Fine-tune your creator presence"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          {helperText}
        </p>
      </header>

      <Card className="border-white/70 bg-white/95 shadow-xl shadow-rose-200/40">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-slate-900">
            Core profile details
          </CardTitle>
          {/* <CardDescription className="text-sm text-slate-600">
            Choose a public handle, add a display name, and drop in a profile image link for your supporters.
          </CardDescription> */}
        </CardHeader>
        <CardContent>
          {/* Avatar section at the top */}
          <div className="mb-6 flex flex-col items-center">
            <div
              className={`grid h-24 w-24 place-items-center overflow-hidden rounded-full ring-2 ${
                hasAvatar ? "ring-emerald-200" : "ring-slate-200"
              }`}
            >
              {hasAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentAvatarUrl}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-emerald-100 text-emerald-700">
                  <UserRound className="h-12 w-12" />
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddPhotoClick}
              disabled={!isConnected || status === "saving"}
              className="mt-3 border-pink-500 text-pink-600 hover:bg-pink-50"
            >
              {hasAvatar ? "Change Profile Picture" : "Add Profile Picture"}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg"
              onChange={onFileSelected}
              className="hidden"
            />
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Streamer username</Label>
              <Input
                id="username"
                required
                minLength={3}
                maxLength={32}
                value={form.username}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, username: event.target.value }))
                }
                placeholder="creator-handle"
                pattern="[a-zA-Z0-9_-]+"
                disabled={!isConnected || status === "saving"}
              />
              <p className="text-xs text-slate-500">
                Used in your donate link and overlays. Letters, numbers, underscores, and dashes only.
              </p>
              {/[^a-zA-Z0-9_-]/.test(form.username) && (
                <p className="text-xs text-rose-600">Username contains invalid characters.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, displayName: event.target.value }))
                }
                placeholder="Kubi Creator"
                disabled={!isConnected || status === "saving"}
              />
              <p className="text-xs text-slate-500">
                Shown on your dashboard and supporter-facing UI. Leave blank to use your username.
              </p>
            </div>

            {/* Removed avatar URL input; handled by upload above */}

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                rows={4}
                value={form.bio}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, bio: event.target.value }))
                }
                placeholder="Let supporters know what you create."
                disabled={!isConnected || status === "saving"}
              />
              <p className="text-xs text-slate-500">
                Keep it short and sweet. This appears on your donation page.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitDisabled}
            >
              {status === "saving"
                ? "Saving..."
                : status === "saved"
                  ? "Saved"
                  : onboarding
                    ? "Save and continue"
                    : "Save changes"}
            </Button>

            {status === "saved" && !onboarding && (
              <p className="text-center text-xs font-medium uppercase tracking-[0.3em] text-rose-400">
                Profile updated successfully
              </p>
            )}

            {errorMessage && (
              <p className="text-center text-xs font-medium text-rose-500">
                {errorMessage}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Payment settings */}
      <Card className="border-white/70 bg-white/95 shadow-xl shadow-rose-200/40">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-slate-900">Payment settings</CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Choose your primary token for auto-swap and select tokens to whitelist so they are accepted without swapping.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentSettingsForm
            disabled={!canEditTokens}
            loading={loadingTokens}
            tokens={tokens}
            settings={settings}
            onSave={async (next) => {
              await saveTokenSettings(next);
              await refreshTokenSettings();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

type PaymentSettingsFormProps = {
  disabled: boolean;
  loading: boolean;
  tokens: { id: string; symbol: string; name: string | null; isNative: boolean }[];
  settings: { primaryTokenId: string | null; autoswapEnabled: boolean; whitelistTokenIds: string[] } | null;
  onSave: (next: { primaryTokenId: string | null; autoswapEnabled: boolean; whitelistTokenIds: string[] }) => Promise<void>;
};

function PaymentSettingsForm({ disabled, loading, tokens, settings, onSave }: PaymentSettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [primaryTokenId, setPrimaryTokenId] = useState<string | "" | null>(settings?.primaryTokenId ?? null);
  const [autoswapEnabled, setAutoswapEnabled] = useState<boolean>(settings?.autoswapEnabled ?? true);
  const [whitelist, setWhitelist] = useState<Set<string>>(new Set(settings?.whitelistTokenIds ?? []));

  useEffect(() => {
    setPrimaryTokenId(settings?.primaryTokenId ?? null);
    setAutoswapEnabled(settings?.autoswapEnabled ?? true);
    setWhitelist(new Set(settings?.whitelistTokenIds ?? []));
  }, [settings]);

  const handleToggleWhitelist = (tokenId: string) => {
    setWhitelist((prev) => {
      const next = new Set(prev);
      if (next.has(tokenId)) next.delete(tokenId);
      else next.add(tokenId);
      return next;
    });
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        primaryTokenId: primaryTokenId ? String(primaryTokenId) : null,
        autoswapEnabled,
        whitelistTokenIds: Array.from(whitelist),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const isDisabled = disabled || loading || saving;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="primaryToken">Primary token (auto-swap)</Label>
        <select
          id="primaryToken"
          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isDisabled}
          value={primaryTokenId ?? ""}
          onChange={(e) => setPrimaryTokenId(e.target.value || null)}
        >
          <option value="">Select a token…</option>
          {tokens.map((t) => (
            <option key={t.id} value={t.id}>
              {t.symbol}{t.isNative ? " (native)" : ""}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">Donations are auto-swapped to this token unless the incoming token is whitelisted.</p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
        <div className="space-y-0.5">
          <Label htmlFor="autoswap">Enable auto-swap</Label>
          <p className="text-xs text-slate-500">When off, all tokens are accepted as is.</p>
        </div>
        <Switch
          id="autoswap"
          checked={autoswapEnabled}
          onCheckedChange={setAutoswapEnabled}
          disabled={isDisabled}
          aria-label="Toggle auto-swap"
        />
      </div>

      <div className="space-y-2">
        <Label>Token whitelist (no auto-swap)</Label>
        <div className="flex flex-wrap gap-2">
          {tokens.length === 0 && (
            <p className="text-sm text-slate-500">No tokens available.</p>
          )}
          {tokens.map((t) => {
            const selected = whitelist.has(t.id);
            return (
              <Button
                key={t.id}
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={selected}
                onClick={() => handleToggleWhitelist(t.id)}
                disabled={isDisabled}
                className={selected ? "border-rose-500 bg-rose-500 text-white hover:bg-rose-500" : ""}
                title={t.name ?? t.symbol}
              >
                {t.symbol}{t.isNative ? " (native)" : ""}
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">Tokens in this list are accepted without auto-swap.</p>
      </div>

      <Button onClick={handleSave} disabled={isDisabled} className="w-full">
        {saving ? "Saving..." : "Save payment settings"}
      </Button>

      {error && <p className="text-center text-xs font-medium text-rose-500">{error}</p>}
    </div>
  );
}
