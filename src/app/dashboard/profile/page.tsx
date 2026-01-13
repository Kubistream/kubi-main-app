"use client";

import { FormEvent, ChangeEventHandler, useEffect, useMemo, useRef, useState } from "react";
import { UserRound, TrendingUp, CircleHelp, ChevronDown, ChevronUp, Wallet, Loader2, ArrowRight } from "lucide-react";
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
import { getStreamerYield, removeStreamerYieldContract, setStreamerYieldContract } from "@/services/contracts/yield";
import { AutoYieldBadge } from "@/components/ui/auto-yield-badge";
import { PrimaryTokenFlow, WhitelistFlow, YieldFlow } from "@/components/ui/flow-diagrams";
import { useConfig } from "wagmi";
import { getWalletClient, switchChain } from "wagmi/actions";
import { TransactionProgressModal, TransactionStep } from "@/components/ui/transaction-progress-modal";
import { cn } from "@/lib/utils";

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

  // Auto-redirect if onboarding is complete and all requirements are met
  useEffect(() => {
    if (onboarding && profile?.isComplete && settings?.primaryTokenId && !loadingTokens && !isLoading) {
      const timer = setTimeout(() => {
        router.replace("/dashboard");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [onboarding, profile?.isComplete, settings?.primaryTokenId, loadingTokens, isLoading, router]);

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
        <p className="text-xs font-black uppercase tracking-widest text-accent-pink">Profile</p>
        <h1 className="mt-3 text-3xl font-black text-white font-display">
          {onboarding ? "Finish setting up your creator profile" : "Fine-tune your creator presence"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          {helperText}
        </p>
      </header>

      {onboarding && (
        <div className="rounded-2xl border-2 border-accent-cyan/30 bg-accent-cyan/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-cyan/20">
              <span className="text-lg font-bold text-accent-cyan">ℹ️</span>
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-bold text-white">Complete your setup</h3>
              <p className="mb-3 text-sm text-slate-300">
                Please finish the following steps to unlock your dashboard:
              </p>
              <ul className="space-y-2 text-sm">
                <li className={`flex items-center gap-2 ${!profile?.isComplete ? "text-white" : "text-green-400 line-through opacity-60"}`}>
                  <span className="font-bold">{!profile?.isComplete ? "○" : "✓"}</span>
                  <span>Complete your profile information (username, display name, avatar)</span>
                </li>
                <li className={`flex items-center gap-2 ${!settings?.primaryTokenId ? "text-white" : "text-green-400 line-through opacity-60"}`}>
                  <span className="font-bold">{!settings?.primaryTokenId ? "○" : "✓"}</span>
                  <span>Select your primary token for receiving donations</span>
                </li>
              </ul>
              {profile?.isComplete && settings?.primaryTokenId && (
                <div className="mt-4">
                  <Button
                    onClick={() => router.replace("/dashboard")}
                    className="bg-accent-cyan text-black hover:bg-accent-cyan/90 font-bold"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Card className="border-2 border-[var(--color-border-dark)] bg-surface-dark shadow-fun">
        <CardHeader>
          <CardTitle className="text-2xl font-black text-white font-display">
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
              className={`grid h-24 w-24 place-items-center overflow-hidden rounded-full border-2 ${hasAvatar ? "border-accent-pink" : "border-[var(--color-border-dark)]"
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
                <div className="grid h-full w-full place-items-center bg-[var(--color-border-dark)] text-accent-pink">
                  <UserRound className="h-12 w-12" />
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddPhotoClick}
              disabled={!isConnected || status === "saving"}
              className="mt-3 border-accent-pink text-accent-pink hover:bg-accent-pink/10"
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
      <Card className="border-2 border-[var(--color-border-dark)] bg-surface-dark shadow-fun">
        <CardHeader>
          <CardTitle className="text-2xl font-black text-white font-display">Payment settings</CardTitle>
          <CardDescription className="text-sm text-slate-400">
            Choose your primary token for auto-swap and select tokens to whitelist so they are accepted without swapping.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentSettingsForm
            disabled={!canEditTokens}
            loading={loadingTokens}
            tokens={tokens.filter(t => t.chainId === 5003).map((t) => ({ ...t, logoURI: t.logoURI ?? undefined }))}
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
  const [helpDialog, setHelpDialog] = useState<"primary" | "whitelist" | "yield" | null>(null);

  // Transaction Progress State
  const [txState, setTxState] = useState<{
    open: boolean;
    step: "signing" | "confirming" | "success" | "error";
  }>({ open: false, step: "signing" });

  const [primaryTokenId, setPrimaryTokenId] = useState<string | "" | null>(settings?.primaryTokenId ?? null);
  // Autoswap permanently enabled for now
  const [autoswapEnabled] = useState<boolean>(true);
  const [whitelist, setWhitelist] = useState<Set<string>>(new Set(settings?.whitelistTokenIds ?? []));
  const [subscriptions, setSubscriptions] = useState<Record<string, string | null>>({});
  const [yieldProviders, setYieldProviders] = useState<YieldProviderDto[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Subscribe/Unsubscribe on-chain and mirror to local state
  const { user } = useAuth();
  const toggleSubscription = async (tokenId: string, representativeAddress: string) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    setTxState({ open: true, step: "signing" });
    console.log("DEBUG: Modal should be OPEN now", { open: true, step: "signing" });

    try {
      const streamerAddress = user?.wallet;
      if (!streamerAddress) throw new Error("Streamer wallet not found");

      await ensureMantleNetwork();

      const onTxHash = (hash: string) => {
        setTxState({ open: true, step: "confirming" });
      };

      const current = subscriptions[tokenId] ?? null;

      if (current && current.toLowerCase() === representativeAddress.toLowerCase()) {
        await removeStreamerYieldContract(streamerAddress, representativeAddress, onTxHash);
        setSubscriptions((prev) => ({ ...prev, [tokenId]: null }));
      } else {
        await setStreamerYieldContract(streamerAddress, representativeAddress, onTxHash);
        setSubscriptions((prev) => ({ ...prev, [tokenId]: representativeAddress }));
      }

      setTxState({ open: false, step: "success" });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to update yield subscription");
      setTxState({ open: false, step: "error" });
    } finally {
      setSaving(false);
      // Ensure modal closes on error/success after short delay if we want? 
      // Current logic closes immediately on success/error.
    }
  };

  // ... rest of useEffects ...

  // Helper to generate steps for modal
  const progressSteps: TransactionStep[] = [
    {
      id: "signing",
      label: "Sign transaction in wallet",
      status: txState.step === "signing" ? "loading" : txState.step === "confirming" || txState.step === "success" ? "success" : "idle"
    },
    {
      id: "confirming",
      label: "Confirming on blockchain",
      status: txState.step === "confirming" ? "loading" : txState.step === "success" ? "success" : "idle"
    }
  ];

  useEffect(() => {
    setPrimaryTokenId(settings?.primaryTokenId ?? null);
    setWhitelist(new Set(settings?.whitelistTokenIds ?? []));
  }, [settings]);

  // Fetch available yield providers (public API)
  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        setLoadingProviders(true);
        const res = await fetch("/api/admin/yield/providers", { credentials: "include" });
        const data = await res.json().catch(() => ({ providers: [] }));
        if (!disposed) setYieldProviders(Array.isArray(data?.providers) ? data.providers : []);
      } catch {
        if (!disposed) setYieldProviders([]);
      } finally {
        if (!disposed) setLoadingProviders(false);
      }
    })();
    return () => {
      disposed = true;
    };
  }, []);

  const config = useConfig();

  const ensureMantleNetwork = async () => {
    try {
      const client = await getWalletClient(config);
      const chainId = await client.getChainId();
      if (chainId !== 5003) {
        await switchChain(config, { chainId: 5003 });
        // Wait a bit for chain switch
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (e) {
      console.error("Failed to switch network:", e);
      throw new Error("Please switch your wallet to Mantle Sepolia network to save settings.");
    }
  };

  const handleToggleWhitelist = async (tokenId: string, nextPressed: boolean) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    setTxState({ open: true, step: "signing" });

    try {
      const streamerAddress = user?.wallet;
      if (!streamerAddress) throw new Error("Streamer wallet not found");

      const token = tokens.find((t) => String(t.id) === String(tokenId));
      if (!token) throw new Error("Token not found");

      await ensureMantleNetwork();

      await setStreamerWhitelist(streamerAddress, token.address, nextPressed, (hash) => {
        setTxState({ open: true, step: "confirming" });
      });

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

      setTxState({ open: false, step: "success" });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to update whitelist");
      setTxState({ open: false, step: "error" });
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

  // Compute providers by underlying token id (ACTIVE only) and sort by APR desc
  type YieldProviderDto = {
    id: string;
    protocol: string;
    protocolName: string;
    protocolImageUrl?: string | null;
    status: "ACTIVE" | "PAUSED" | "DEPRECATED";
    apr?: string | number | null;
    underlyingToken: TokenDto;
    representativeToken: TokenDto;
  };

  const providersByUnderlying = useMemo(() => {
    const map: Record<string, YieldProviderDto[]> = {};
    for (const p of yieldProviders) {
      if (p.status !== "ACTIVE") continue;
      const key = String((p as any).underlyingToken?.id ?? "");
      if (!key) continue;
      const arr = map[key] || (map[key] = []);
      arr.push(p);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        const av = a.apr == null ? 0 : Number(a.apr);
        const bv = b.apr == null ? 0 : Number(b.apr);
        return bv - av;
      });
    }
    return map;
  }, [yieldProviders]);

  const selectedPrimary = tokens.find((t) => String(t.id) === String(primaryTokenId ?? ""));

  // Auto Yield availability based on DB YieldProvider: ACTIVE providers for this token as underlying
  const isAutoYieldAvailable = (t: TokenDto | undefined | null): boolean => {
    if (!t) return false;
    const list = providersByUnderlying[String(t.id)] ?? [];
    return list.length > 0;
  };

  // Initialize on-chain subscription state: getStreamerYield(streamer, underlying)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const streamerAddress = user?.wallet;
        if (!streamerAddress) return;
        const tasks: Promise<void>[] = [];
        const next: Record<string, string | null> = {};
        for (const t of tokens) {
          const offers = providersByUnderlying[String(t.id)];
          if (!offers || offers.length === 0) continue; // Only check underlying with providers
          tasks.push(
            (async () => {
              const res = await getStreamerYield(streamerAddress, t.address);
              next[String(t.id)] = res ?? null;
            })(),
          );
        }
        await Promise.all(tasks);
        if (!cancelled) setSubscriptions(next);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.wallet, tokens, providersByUnderlying]);

  const [primaryDialogOpen, setPrimaryDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="primaryToken">Primary token (auto-swap)</Label>
          <button
            type="button"
            onClick={() => setHelpDialog("primary")}
            className="text-slate-400 hover:text-accent-cyan transition-colors"
            title="Click for more info"
          >
            <CircleHelp className="h-4 w-4 cursor-pointer" />
          </button>
        </div>
        <button
          id="primaryToken"
          type="button"
          disabled={isDisabled}
          onClick={() => setPrimaryDialogOpen(true)}
          className="flex h-11 w-full items-center justify-between rounded-xl border-2 border-[var(--color-border-dark)] bg-[var(--color-surface-dark)] px-4 text-left text-sm shadow-sm transition hover:border-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex items-center gap-2 text-white">
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="text-slate-500">Loading tokens...</span>
              </span>
            ) : selectedPrimary?.logoURI ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedPrimary.logoURI!} alt={selectedPrimary.symbol} className="h-5 w-5 rounded-full" />
            ) : null}
            {!loading && (selectedPrimary ? (
              <>
                <span className="font-medium">{selectedPrimary.symbol}</span>
              </>
            ) : (
              <span className="text-slate-500">Select a token…</span>
            ))}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-slate-400"
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
                    setPrimaryDialogOpen(false);
                    setTxState({ open: true, step: "signing" });

                    try {
                      const streamerAddress = user?.wallet;
                      if (!streamerAddress) throw new Error("Streamer wallet not found");
                      const token = tokens.find((x) => String(x.id) === String(t.id));
                      if (!token) throw new Error("Primary token not found");

                      await ensureMantleNetwork();

                      // Ensure whitelisted first if not already
                      if (!whitelist.has(t.id)) {
                        await setStreamerWhitelist(streamerAddress, token.address, true, (hash) => {
                          setTxState({ open: true, step: "confirming" });
                        });
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
                      // Revert to signing if we just finished a whitelist tx
                      setTxState({ open: true, step: "signing" });

                      await setPrimaryToken(streamerAddress, token.address, (hash) => {
                        setTxState({ open: true, step: "confirming" });
                      });
                      setPrimaryTokenId(t.id);

                      // Mirror to DB
                      await onSave({
                        primaryTokenId: String(t.id),
                        autoswapEnabled,
                        whitelistTokenIds: Array.from(whitelist.has(t.id) ? whitelist : new Set([...whitelist, t.id])),
                      });

                      setTxState({ open: false, step: "success" });
                    } catch (e) {
                      console.error(e);
                      setError(e instanceof Error ? e.message : "Failed to set primary token");
                      setTxState({ open: false, step: "error" });
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors",
                    String(t.id) === String(primaryTokenId ?? "")
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                      : "border-[var(--color-border-dark)] bg-[var(--color-surface-dark)] hover:bg-[var(--color-border-dark)] hover:border-[var(--color-primary)]/50"
                  )}
                >
                  {t.logoURI && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.logoURI} alt={t.symbol} className="h-6 w-6 rounded-full" />
                  )}
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="font-bold text-white">{t.symbol}</span>

                    {t.name ? (
                      <span className="truncate text-xs text-slate-400">{t.name}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <AutoYieldBadge available={isAutoYieldAvailable(t)} compact />
                    {String(t.id) === String(primaryTokenId ?? "") && (
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-primary)]">Selected</span>
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
        <div className="flex items-center gap-2">
          <Label>Token whitelist (no auto-swap)</Label>
          <button
            type="button"
            onClick={() => setHelpDialog("whitelist")}
            className="text-slate-400 hover:text-accent-cyan transition-colors"
            title="Click for more info"
          >
            <CircleHelp className="h-4 w-4 cursor-pointer" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {loading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              <span className="text-sm text-slate-500">Loading whitelist...</span>
            </div>
          ) : tokens.length === 0 ? (
            <p className="text-sm text-slate-500">No tokens available.</p>
          ) : (
            tokens.map((t) => {
              const selected = whitelist.has(t.id);
              const tokenLocked = Boolean(subscriptions[t.id ?? ""]);
              return (
                <div key={t.id} className="flex items-center gap-2">
                  <Toggle
                    pressed={selected}
                    onPressedChange={(pressed) => handleToggleWhitelist(t.id, pressed)}
                    disabled={tokenLocked || isDisabled}
                    size="sm"
                    title={tokenLocked ? "Unsubscribe to change whitelist" : t.name ?? t.symbol}
                    className="data-[state=on]:!bg-accent-cyan data-[state=on]:!text-black data-[state=on]:!border-accent-cyan data-[state=on]:font-black border-slate-700 hover:border-slate-500"
                  >
                    {t.logoURI && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.logoURI} alt={t.symbol} className="mr-2 h-4 w-4 rounded-full" />
                    )}
                    {t.symbol}
                  </Toggle>
                </div>
              );
            })
          )}
        </div>
        <p className="text-xs text-slate-500">Tokens in this list are accepted without auto-swap.</p>
      </div>

      {/* Auto Yield by Token */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--color-accent-cyan)]">Auto Yield by Token</h3>
            <button
              type="button"
              onClick={() => setHelpDialog("yield")}
              className="text-slate-400 hover:text-accent-cyan transition-colors"
              title="Click for more info"
            >
              <CircleHelp className="h-4 w-4 cursor-pointer" />
            </button>
          </div>
          <p className="text-xs text-slate-400">Subscribe one protocol per token</p>
        </div>
        {loadingProviders ? (
          <div className="flex items-center justify-center py-8 text-slate-500 gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading yield providers...</span>
          </div>
        ) : (
          <AutoYieldByTokenSection
            tokens={tokens}
            whitelist={whitelist}
            subscriptions={subscriptions}
            disabled={isDisabled || loadingProviders}
            providersByUnderlying={providersByUnderlying}
            onToggle={(tokenId, representativeAddress) => toggleSubscription(tokenId, representativeAddress)}
          />
        )}
      </div>

      {/* <Button onClick={handleSave} disabled={isDisabled} className="w-full">
        {saving ? "Saving..." : "Save payment settings"}
      </Button> */}

      {error && <p className="text-center text-xs font-medium text-[var(--color-primary)]">{error}</p>}

      {/* Help Dialogs */}
      <Dialog open={helpDialog === "primary"} onOpenChange={(open) => !open && setHelpDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleHelp className="h-5 w-5 text-accent-cyan" />
              Primary Token (Auto-Swap)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-300">
            <p className="font-semibold text-white">What is this?</p>
            <p>Your primary token is the main cryptocurrency you want to receive. All donations will be automatically converted to this token.</p>

            {/* Animated Flow Diagram */}
            <PrimaryTokenFlow />

            <p className="font-semibold text-white mt-4">How does it work?</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>When someone donates in a different token, it will automatically swap to your primary token</li>
              <li>This happens instantly during the donation process</li>
              <li>Tokens in your whitelist below won't be swapped</li>
            </ul>

            <p className="font-semibold text-white mt-4">Example:</p>
            <p className="bg-surface-dark p-3 rounded-lg border border-border-dark">
              If your primary token is <span className="text-accent-cyan font-bold">USDC</span> and someone donates <span className="text-accent-yellow font-bold">ETH</span>, the ETH will be automatically swapped to USDC before reaching your wallet.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={helpDialog === "whitelist"} onOpenChange={(open) => !open && setHelpDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleHelp className="h-5 w-5 text-accent-cyan" />
              Token Whitelist (No Auto-Swap)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-300">
            <p className="font-semibold text-white">What is this?</p>
            <p>The whitelist lets you accept certain tokens directly without auto-swapping them to your primary token.</p>

            <WhitelistFlow />

            <p className="font-semibold text-white mt-4">Why use it?</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Hold multiple cryptocurrencies for diversification</li>
              <li>Avoid swap fees for tokens you want to keep</li>
              <li>Accept stablecoins like USDC or USDT directly</li>
            </ul>

            <p className="font-semibold text-white mt-4">Example:</p>
            <p className="bg-surface-dark p-3 rounded-lg border border-border-dark">
              If you whitelist <span className="text-accent-cyan font-bold">USDC</span>, <span className="text-accent-yellow font-bold">ETH</span>, and <span className="text-accent-purple font-bold">USDT</span>, donations in these tokens will go directly to your wallet without being swapped.
            </p>

            <p className="text-xs text-slate-400 mt-4 italic">
              💡 Tip: Whitelisted tokens with active Auto Yield subscriptions cannot be removed until you unsubscribe.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={helpDialog === "yield"} onOpenChange={(open) => !open && setHelpDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleHelp className="h-5 w-5 text-accent-cyan" />
              Auto Yield by Token
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-300">
            <p className="font-semibold text-white">What is this?</p>
            <p>Auto Yield allows you to earn passive income on your whitelisted tokens by subscribing to DeFi yield protocols.</p>

            <YieldFlow />

            <p className="font-semibold text-white mt-4">How does it work?</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Each whitelisted token can subscribe to one yield protocol</li>
              <li>Protocols are sorted by APR (highest first)</li>
              <li>Your donations automatically start earning yield</li>
              <li>Rewards compound over time</li>
            </ul>

            <p className="font-semibold text-white mt-4">Example:</p>
            <p className="bg-surface-dark p-3 rounded-lg border border-border-dark">
              If you subscribe <span className="text-accent-cyan font-bold">USDC</span> to a protocol offering <span className="text-green-400 font-bold">8.5% APR</span>, every USDC donation you receive will automatically earn that yield rate.
            </p>

            <p className="text-xs text-slate-400 mt-4 italic">
              ⚠️ Note: Once subscribed, the token cannot be removed from your whitelist until you unsubscribe from the yield protocol.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <TransactionProgressModal
        open={txState.open}
        title={txState.step === "signing" ? "Check your wallet" : "Processing transaction"}
        description={txState.step === "signing" ? "Please sign the transaction in your wallet." : "Waiting for blockchain confirmation..."}
        steps={progressSteps}
      />
    </div >
  );
}

// Auto Yield by Token (collapsible list)
function AutoYieldByTokenSection({
  tokens,
  whitelist,
  subscriptions,
  disabled,
  providersByUnderlying,
  onToggle,
}: {
  tokens: (TokenDto & { logoURI?: string })[];
  whitelist: Set<string>;
  subscriptions: Record<string, string | null>;
  disabled: boolean;
  providersByUnderlying: Record<string, any[]>;
  onToggle: (tokenId: string, representativeAddress: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const shownTokens = useMemo(() => {
    // Only tokens that have ACTIVE providers (as underlying)
    return tokens.filter((t) => Array.isArray(providersByUnderlying[String(t.id)]) && providersByUnderlying[String(t.id)].length > 0);
  }, [tokens, providersByUnderlying]);

  return (
    <div className="space-y-2">
      {shownTokens.map((t) => {
        const sym = (t.symbol || "").toUpperCase();
        const tokenId = String(t.id);
        const offers: any[] = (providersByUnderlying[tokenId] || []) as any[];
        const minApr = offers.length ? Number(offers[offers.length - 1]?.apr ?? 0) : 0;
        const maxApr = offers.length ? Number(offers[0]?.apr ?? 0) : 0;
        const active = subscriptions[tokenId] ?? null;
        const knownActive = !!active && offers.some((p) => {
          const repAddr: string = (p?.representativeToken?.address as string) || "";
          return repAddr && active.toLowerCase() === repAddr.toLowerCase();
        });
        const isWhitelisted = whitelist.has(tokenId);
        const isOpen = expanded[tokenId] ?? false;
        return (
          <div key={tokenId} className="rounded-2xl border-2 border-[var(--color-border-dark)] bg-[var(--color-surface-card)]">
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
                <span className="text-sm font-bold text-white">{sym}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--color-accent-cyan)]">{minApr.toFixed(2)}%~{maxApr.toFixed(2)}%</span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </span>
            </button>
            {isOpen && (
              <div className="mx-3 mb-3 rounded-xl border-2 border-[var(--color-border-dark)] bg-[var(--color-surface-dark)]">
                {offers.map((p, idx) => {
                  const isBest = idx === 0;
                  const rep = p.representativeToken;
                  const name: string = p.protocolName || p.protocol || rep?.symbol || "Provider";
                  const icon: string | undefined = p.protocolImageUrl || rep?.logoURI || undefined;
                  const aprNum = Number(p.apr ?? 0);
                  const repAddr: string = (rep?.address as string) || "";
                  const isActive = active != null && repAddr && active.toLowerCase() === repAddr.toLowerCase();
                  const subscribeDisabled = disabled || (!isWhitelisted && !isActive) || (knownActive && !isActive);
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3 border-b border-[var(--color-border-dark)] px-4 py-3 last:border-none">
                      <div className="flex items-center gap-3">
                        {isBest && (
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-[var(--color-secondary)] to-[#FB923C] text-[10px] font-bold text-black ring-2 ring-[var(--color-secondary)]/50 border border-black">1</span>
                        )}
                        {icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={icon} alt={name} className="h-6 w-6 rounded" />
                        ) : null}
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-bold text-white">{name}</span>
                          {!isWhitelisted && !isActive && (
                            <span className="text-xs text-slate-400">Whitelist to enable</span>
                          )}
                          {!!active && !knownActive && idx === 0 && (
                            <span className="text-xs text-[var(--color-secondary)]">On-chain subscription found (not in list)</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-sm font-bold text-[var(--color-accent-cyan)]">
                          <TrendingUp className="h-4 w-4 text-[var(--color-accent-cyan)]" />
                          {aprNum.toFixed(2)}%
                        </span>
                        <Button
                          onClick={() => onToggle(tokenId, repAddr)}
                          disabled={subscribeDisabled || !repAddr}
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
      {shownTokens.length === 0 && (
        <p className="py-4 text-center text-sm text-slate-400">No auto-yield providers available.</p>
      )}
    </div>
  );
}
