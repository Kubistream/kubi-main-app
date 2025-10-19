"use client";

import { FormEvent, ChangeEventHandler, useEffect, useMemo, useRef, useState } from "react";
import { UserRound, TrendingUp, CircleHelp, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStreamerProfile } from "@/hooks/use-streamer-profile";
import { updateStreamerProfile } from "@/services/streamers/profile-service";
import { uploadAvatar } from "@/services/uploads/avatar-service";
import { useAuth } from "@/providers/auth-provider";
import { useTokenSettings } from "@/hooks/use-token-settings";
import { fetchTokenSettings } from "@/services/streamers/token-settings-service";
import type { TokenDto } from "@/services/tokens/token-service";
import { setPrimaryToken, setStreamerWhitelist } from "@/services/contracts/settings";
import { AutoYieldBadge } from "@/components/ui/auto-yield-badge";

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

  // (Auto Yield subscriptions handled inside PaymentSettingsForm)


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

      await Promise.all([refresh(), refreshAuth(), refreshTokenSettings()]);

      if (onboarding) {
        const latest = await fetchTokenSettings();
        const hasPrimaryToken = Boolean(latest?.primaryTokenId);
        if (hasPrimaryToken) {
          setTimeout(() => {
            router.replace("/dashboard");
          }, 800);
        }
        // If primary token is not set, remain on the page to finish setup
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
            tokens={tokens.map((t) => ({ ...t, logoURI: t.logoURI ?? undefined }))}
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
  tokens: (TokenDto & { logoURI?: string })[];
  settings: { primaryTokenId: string | null; autoswapEnabled: boolean; whitelistTokenIds: string[] } | null;
  onSave: (next: { primaryTokenId: string | null; autoswapEnabled: boolean; whitelistTokenIds: string[] }) => Promise<void>;
};

function PaymentSettingsForm({ disabled, loading, tokens, settings, onSave }: PaymentSettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [primaryTokenId, setPrimaryTokenId] = useState<string | "" | null>(settings?.primaryTokenId ?? null);
  // Autoswap permanently enabled for now
  const [autoswapEnabled] = useState<boolean>(true);
  const [whitelist, setWhitelist] = useState<Set<string>>(new Set(settings?.whitelistTokenIds ?? []));
  const [subscriptions, setSubscriptions] = useState<Record<string, string | null>>({});
  const toggleSubscription = (tokenId: string, protocolId: string) => {
    setSubscriptions((prev) => {
      const current = prev[tokenId] ?? null;
      const next = current === protocolId ? null : protocolId;
      return { ...prev, [tokenId]: next };
    });
  };

  useEffect(() => {
    setPrimaryTokenId(settings?.primaryTokenId ?? null);
    setWhitelist(new Set(settings?.whitelistTokenIds ?? []));
  }, [settings]);

  const { user } = useAuth();

  const handleToggleWhitelist = async (tokenId: string, nextPressed: boolean) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const streamerAddress = user?.wallet;
      if (!streamerAddress) throw new Error("Streamer wallet not found");

      const token = tokens.find((t) => String(t.id) === String(tokenId));
      if (!token) throw new Error("Token not found");
      if (token.isNative) throw new Error("Cannot whitelist native token");

      await setStreamerWhitelist(streamerAddress, token.address, nextPressed);

      // Update local state and mirror to DB
      const nextSet = new Set(whitelist);
      if (nextPressed) nextSet.add(tokenId);
      else nextSet.delete(tokenId);
      setWhitelist(nextSet);

      await onSave({
        primaryTokenId: primaryTokenId ? String(primaryTokenId) : null,
        autoswapEnabled,
        whitelistTokenIds: Array.from(nextSet),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update whitelist");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      // Off-chain mirror only (on-chain handled per action)
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

  const selectedPrimary = tokens.find((t) => String(t.id) === String(primaryTokenId ?? ""));

  // Dummy eligibility for Auto Yield (adjust later when backend is ready)
  const AUTO_YIELD_ELIGIBLE_SYMBOLS = useMemo(
    () => new Set(["USDC", "USDT", "DAI", "USDE", "WETH", "WBTC", "PYUSD"]),
    [],
  );
  const isAutoYieldAvailable = (t: TokenDto | undefined | null): boolean => {
    if (!t || t.isNative) return false;
    const sym = (t.symbol || "").toUpperCase();
    return AUTO_YIELD_ELIGIBLE_SYMBOLS.has(sym);
  };

  const [primaryDialogOpen, setPrimaryDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="primaryToken">Primary token (auto-swap)</Label>
          <span
            title="Auto Yield lets you subscribe per whitelisted token. Donations in non-whitelisted tokens auto-swap to your primary token. If a token is subscribed, its whitelist toggle is locked."
          >
            <CircleHelp className="h-4 w-4 text-slate-400" />
          </span>
        </div>
        <button
          id="primaryToken"
          type="button"
          disabled={isDisabled}
          onClick={() => setPrimaryDialogOpen(true)}
          className="flex h-11 w-full items-center justify-between rounded-2xl border border-slate-300 bg-white px-4 text-left text-sm shadow-sm transition hover:border-rose-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex items-center gap-2 text-slate-800">
            {selectedPrimary?.logoURI && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedPrimary.logoURI!} alt={selectedPrimary.symbol} className="h-5 w-5 rounded-full" />
            )}
            {selectedPrimary ? (
              <>
                <span>{selectedPrimary.symbol}</span>
                {selectedPrimary.isNative ? <span className="text-xs text-slate-500">(native)</span> : null}
              </>
            ) : (
              <span className="text-slate-500">Select a token…</span>
            )}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {selectedPrimary && (
          <div className="mt-2">
            <AutoYieldBadge available={isAutoYieldAvailable(selectedPrimary)} compact />
          </div>
        )}
        <Dialog open={primaryDialogOpen} onOpenChange={setPrimaryDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select primary token</DialogTitle>
            </DialogHeader>
            <div className="max-h-[320px] space-y-2 overflow-y-auto">
              {tokens.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={async () => {
                    if (saving) return;
                    setSaving(true);
                    setError(null);
                    try {
                      const streamerAddress = user?.wallet;
                      if (!streamerAddress) throw new Error("Streamer wallet not found");
                      const token = tokens.find((x) => String(x.id) === String(t.id));
                      if (!token) throw new Error("Primary token not found");
                      if (token.isNative) throw new Error("Primary token cannot be native");

                      // Ensure whitelisted first if not already
                      if (!whitelist.has(t.id)) {
                        await setStreamerWhitelist(streamerAddress, token.address, true);
                        const nextSet = new Set(whitelist);
                        nextSet.add(t.id);
                        setWhitelist(nextSet);
                        await onSave({
                          primaryTokenId: primaryTokenId ? String(primaryTokenId) : null,
                          autoswapEnabled,
                          whitelistTokenIds: Array.from(nextSet),
                        });
                      }

                      // Now set primary on-chain
                      await setPrimaryToken(streamerAddress, token.address);
                      setPrimaryTokenId(t.id);

                      // Mirror to DB
                      await onSave({
                        primaryTokenId: String(t.id),
                        autoswapEnabled,
                        whitelistTokenIds: Array.from(whitelist.has(t.id) ? whitelist : new Set([...whitelist, t.id])),
                      });

                      setPrimaryDialogOpen(false);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Failed to set primary token");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-md border border-slate-200 p-2 text-left hover:bg-rose-50"
                >
                  {t.logoURI && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.logoURI} alt={t.symbol} className="h-6 w-6 rounded-full" />
                  )}
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="font-semibold text-slate-900">{t.symbol}</span>
                    {t.isNative ? (
                      <span className="text-xs text-slate-500">(native)</span>
                    ) : null}
                    {t.name ? (
                      <span className="truncate text-xs text-slate-500">{t.name}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <AutoYieldBadge available={isAutoYieldAvailable(t)} compact />
                    {String(t.id) === String(primaryTokenId ?? "") && (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-rose-500">Selected</span>
                    )}
                  </div>
                </button>
              ))}
              {tokens.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-500">No tokens available.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <p className="text-xs text-slate-500">Donations are auto-swapped to this token unless the incoming token is whitelisted.</p>
      </div>

      

      {/* Autoswap toggle hidden for now (always true) */}

      <div className="space-y-2">
        <Label>Token whitelist (no auto-swap)</Label>
        <div className="flex flex-wrap gap-2">
          {tokens.length === 0 && (
            <p className="text-sm text-slate-500">No tokens available.</p>
          )}
          {tokens.map((t) => {
            const selected = whitelist.has(t.id);
            const tokenLocked = Boolean(subscriptions[t.id ?? ""]);
            return (
              <Toggle
                key={t.id}
                pressed={selected}
                onPressedChange={(pressed) => handleToggleWhitelist(t.id, pressed)}
                disabled={tokenLocked || isDisabled}
                size="sm"
                title={tokenLocked ? "Unsubscribe to change whitelist" : t.name ?? t.symbol}
                className="border-slate-300 hover:border-rose-300"
              >
                {t.logoURI && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.logoURI} alt={t.symbol} className="mr-2 h-4 w-4 rounded-full" />
                )}
                {t.symbol}{t.isNative ? " (native)" : ""}
              </Toggle>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">Tokens in this list are accepted without auto-swap.</p>
      </div>

      {/* Auto Yield by Token */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-700">Auto Yield by Token</h3>
          <p className="text-xs text-slate-500">Subscribe one protocol per token</p>
        </div>
        <AutoYieldByTokenSection
          tokens={tokens}
          whitelist={whitelist}
          subscriptions={subscriptions}
          disabled={isDisabled}
          onToggle={(tokenId, protocolId) => toggleSubscription(tokenId, protocolId)}
        />
      </div>

      {/* <Button onClick={handleSave} disabled={isDisabled} className="w-full">
        {saving ? "Saving..." : "Save payment settings"}
      </Button> */}

      {error && <p className="text-center text-xs font-medium text-rose-500">{error}</p>}
    </div>
  );
}

// Auto Yield by Token (collapsible list)
function AutoYieldByTokenSection({
  tokens,
  whitelist,
  subscriptions,
  disabled,
  onToggle,
}: {
  tokens: (TokenDto & { logoURI?: string })[];
  whitelist: Set<string>;
  subscriptions: Record<string, string | null>;
  disabled: boolean;
  onToggle: (tokenId: string, protocolId: string) => void;
}) {
  type Offer = { id: string; name: string; icon: string; apr: number };

  const ICONS = {
    aave: "https://icons.llamao.fi/icons/protocols/aave?w=48&h=48",
    morpho: "https://icons.llamao.fi/icons/protocols/morpho?w=48&h=48",
    spark: "https://icons.llamao.fi/icons/protocols/sparklend?w=48&h=48",
    justlend: "https://icons.llamao.fi/icons/protocols/justlend?w=48&h=48",
    kamino: "https://icons.llamao.fi/icons/protocols/kamino-lend?w=48&h=48",
  } as const;

  const normalizeKey = (symbol?: string | null, name?: string | null): string => {
    const s = (symbol || name || "").toUpperCase();
    if (s.includes("USDT")) return "USDT";
    if (s.includes("USDC")) return "USDC";
    if (s.includes("BTC") || s.includes("BITCOIN")) return "BTC";
    if (s.includes("ETH") || s.includes("WETH")) return "ETH";
    return "GEN";
  };

  const offersForKey = (key: string): Offer[] => {
    switch (key) {
      case "USDT":
        return [
          { id: "morpho", name: "Morpho Blue", icon: ICONS.morpho, apr: 10.5 },
          { id: "spark", name: "Spark Lend", icon: ICONS.spark, apr: 8.3 },
          { id: "aave", name: "Aave v3", icon: ICONS.aave, apr: 7.0 },
          { id: "justlend", name: "JustLend", icon: ICONS.justlend, apr: 5.1 },
        ];
      case "USDC":
        return [
          { id: "morpho", name: "Morpho Blue", icon: ICONS.morpho, apr: 11.2 },
          { id: "spark", name: "Spark Lend", icon: ICONS.spark, apr: 9.1 },
          { id: "aave", name: "Aave v3", icon: ICONS.aave, apr: 8.2 },
          { id: "kamino", name: "Kamino Lend", icon: ICONS.kamino, apr: 6.0 },
        ];
      case "BTC":
        return [
          { id: "aave", name: "Aave v3", icon: ICONS.aave, apr: 4.2 },
          { id: "spark", name: "Spark Lend", icon: ICONS.spark, apr: 3.7 },
          { id: "morpho", name: "Morpho Blue", icon: ICONS.morpho, apr: 3.2 },
        ];
      case "ETH":
        return [
          { id: "morpho", name: "Morpho Blue", icon: ICONS.morpho, apr: 4.4 },
          { id: "aave", name: "Aave v3", icon: ICONS.aave, apr: 3.9 },
          { id: "spark", name: "Spark Lend", icon: ICONS.spark, apr: 3.5 },
        ];
      default:
        return [
          { id: "aave", name: "Aave v3", icon: ICONS.aave, apr: 2.1 },
          { id: "spark", name: "Spark Lend", icon: ICONS.spark, apr: 1.8 },
        ];
    }
  };

  const weightForKey = (key: string): number => ({ USDT: 1, BTC: 2, ETH: 3, USDC: 4 }[key] ?? 99);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const shownTokens = useMemo(() => {
    return [...tokens].sort((a, b) => {
      const ak = normalizeKey(a.symbol, a.name);
      const bk = normalizeKey(b.symbol, b.name);
      return weightForKey(ak) - weightForKey(bk);
    });
  }, [tokens]);

  return (
    <div className="space-y-2">
      {shownTokens.map((t) => {
        const sym = (t.symbol || "").toUpperCase();
        const key = normalizeKey(t.symbol, t.name);
        const offers = [...offersForKey(key)].sort((a, b) => b.apr - a.apr);
        const minApr = offers.length ? offers[offers.length - 1].apr : 0;
        const maxApr = offers.length ? offers[0].apr : 0;
        const tokenId = String(t.id);
        const active = subscriptions[tokenId] ?? null;
        const isWhitelisted = whitelist.has(tokenId);
        const isOpen = expanded[tokenId] ?? false;
        return (
          <div key={tokenId} className="rounded-2xl border border-slate-300 bg-white">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3"
              onClick={() => setExpanded((prev) => ({ ...prev, [tokenId]: !isOpen }))}
            >
              <span className="flex items-center gap-3">
                {t.logoURI ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.logoURI} alt={sym} className="h-6 w-6 rounded-full" />
                ) : null}
                <span className="text-sm font-semibold text-slate-900">{sym}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">{minApr.toFixed(2)}%~{maxApr.toFixed(2)}%</span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
              </span>
            </button>
            {isOpen && (
              <div className="mx-3 mb-3 rounded-2xl border border-slate-200 bg-slate-50">
                {offers.map((o, idx) => {
                  const isBest = idx === 0;
                  const isActive = active === o.id;
                  const subscribeDisabled = disabled || (!isWhitelisted && !isActive) || (!!active && !isActive);
                  return (
                    <div key={o.id} className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 last:border-none">
                      <div className="flex items-center gap-3">
                        {isBest && (
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-[10px] font-bold text-white ring-2 ring-amber-300">1</span>
                        )}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={o.icon} alt={o.name} className="h-6 w-6 rounded" />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-semibold text-slate-900">{o.name}</span>
                          {!isWhitelisted && !isActive && (
                            <span className="text-xs text-slate-500">Whitelist to enable</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                          {o.apr.toFixed(2)}%
                        </span>
                        <Button
                          onClick={() => onToggle(tokenId, o.id)}
                          disabled={subscribeDisabled}
                          variant={isActive ? "outline" : "default"}
                          className="min-w-[110px]"
                        >
                          {isActive ? "Unsubscribe" : "Subscribe"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
