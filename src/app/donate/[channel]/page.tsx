"use client";

import { ChangeEventHandler, FormEvent, useEffect, useRef, useState } from "react";
import { Loader2, PartyPopper, UserRound } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SelectTokenModal } from "@/components/ui/select-token-modal";
import { uploadAvatar } from "@/services/uploads/avatar-service";
import { uploadMedia } from "@/services/uploads/media-service";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDonation, useTokenBalances, type TokenInfo } from "@/hooks/use-donation";
import { getYouTubeId } from "@/components/overlay/donation-card";
import { cn } from "@/lib/utils";
import { TOKEN_PRICES_USD } from "@/constants/token-prices";

// ERC20 ABI disediakan via helper getErc20Contract

// Chain explorer configurations
const CHAIN_EXPLORERS: Record<number, { name: string; url: string }> = {
  84532: { name: "BaseScan", url: "https://sepolia.basescan.org/tx" },
  5003: { name: "MantleScan", url: "https://sepolia.mantlescan.xyz/tx" },
};

const CHAIN_NAMES: Record<number, string> = {
  84532: "Base Sepolia",
  5003: "Mantle Sepolia",
};

const CELEBRATION_MESSAGES = [
  "You just made {streamer}'s day a little brighter. Thank you for the love!",
  "That donation will spark a huge smile from {streamer}. Legendary move!",
  "Your support helps keep {streamer}'s stream thriving. You're the real MVP!",
  "What a boost! {streamer} can't wait to shout you out on stream!",
];

export default function DonatePage() {
  const params = useParams<{ channel: string }>();
  const channel = params?.channel ?? "";
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string>("");
  const [streamerAddress, setStreamerAddress] = useState<string>("");
  const [streamerId, setStreamerId] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [overlaySettings, setOverlaySettings] = useState<{
    minAmountUsd: number;
    minAudioAmountUsd: number;
    minVideoAmountUsd: number;
  } | null>(null);

  useEffect(() => {
    if (!channel) return;
    const fetchStreamer = async () => {
      try {
        const res = await fetch(`/api/streamer/${channel}`);
        if (res.status === 404) {
          router.replace("/404");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch streamer");
        const data = await res.json();
        setDisplayName(data.user.displayName || channel);
        setStreamerAddress(data.user.wallet || "");
        setStreamerId(data.id || "");
        setAvatarUrl(data.user.avatarUrl || "");
        setOverlaySettings(data.overlaySettings || null);
      } catch {
        setDisplayName(channel);
        setStreamerAddress("");
        setStreamerId("");
        setAvatarUrl("");
        setOverlaySettings(null);
      }
    };
    fetchStreamer();
  }, [channel, router]);
  const { isConnected, address } = useAccount();
  const { donate, isPending: isDonationPending, isApproving, isDonating } = useDonation();

  // Transaction Progress State
  const [txStep, setTxStep] = useState<"idle" | "uploading" | "approving" | "signing" | "confirming" | "saving">("idle");

  // Donation Form State
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [rawAmount, setRawAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [lastTxChainId, setLastTxChainId] = useState<number | null>(null);

  // Avatar State
  const [donorAvatarUrl, setDonorAvatarUrl] = useState<string>("");
  const [donorAvatarPreview, setDonorAvatarPreview] = useState<string>("");
  const [selectedDonorFile, setSelectedDonorFile] = useState<File | null>(null);
  const donorFileInputRef = useRef<HTMLInputElement | null>(null);

  // Media State
  const [mediaType, setMediaType] = useState<"TEXT" | "AUDIO" | "VIDEO">("TEXT");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [videoKey, setVideoKey] = useState(0);
  const [isVideoPaused, setIsVideoPaused] = useState(false);

  // Enforce 10s video loop for preview
  useEffect(() => {
    if (mediaType !== "VIDEO" || !getYouTubeId(youtubeUrl) || isVideoPaused) {
      return;
    }
    const interval = setInterval(() => {
      setVideoKey((prev) => prev + 1);
    }, 10500); // Restart every 10.5s
    return () => clearInterval(interval);
  }, [mediaType, youtubeUrl, isVideoPaused]);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Token State
  const [tokens, setTokens] = useState<{ symbol: string; logoURI: string; address?: string; isNative?: boolean; chainId?: number }[]>([]);
  const decimalsCacheRef = useRef<Record<string, number>>({});
  const [selectedToken, setSelectedToken] = useState<{
    symbol: string;
    logoURI: string;
    address?: string;
    isNative?: boolean;
    chainId?: number;
  }>({
    symbol: "MNT",
    logoURI: "https://cryptologos.cc/logos/mantle-mnt-logo.png?v=040",
    isNative: true,
    chainId: 5003,
  });

  const [primaryTokenAddress, setPrimaryTokenAddress] = useState<string | undefined>(undefined);

  // Effects for Donor Profile
  useEffect(() => {
    if (!address) return;
    const fetchDonor = async () => {
      try {
        console.log("Fetching donor info for address:", address);
        const res = await fetch(`/api/donor/${address}`);
        if (!res.ok) throw new Error("Failed to fetch donor");
        const data = await res.json();
        if (data.displayName) {
          setName(data.displayName); // isi otomatis field nama
        }
        setDonorAvatarUrl(data.avatarUrl || "");
        setDonorAvatarPreview("");
        setSelectedDonorFile(null);
      } catch {
        setDonorAvatarUrl("");
        setDonorAvatarPreview("");
        setSelectedDonorFile(null);
      }
    };
    fetchDonor();
  }, [address]);

  useEffect(() => {
    return () => {
      if (donorAvatarPreview) URL.revokeObjectURL(donorAvatarPreview);
    };
  }, [donorAvatarPreview]);

  // Audio Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 10) {
            stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Failed to start recording", err);
      alert("Microphone access denied or not available. Please ensure you have granted permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  // helper function to format amount input
  const formatAmount = (value: string) => {
    if (!value) return "";
    const numeric = value.replace(/,/g, "");
    const num = parseFloat(numeric);
    if (Number.isNaN(num)) return "";
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const clampDecimals = (value: string, maxDecimals = 4) => {
    const dotIndex = value.indexOf(".");
    if (dotIndex === -1) return value;
    if (dotIndex === value.length - 1) return value;
    const whole = value.slice(0, dotIndex);
    const fraction = value.slice(dotIndex + 1, dotIndex + 1 + maxDecimals);
    return fraction.length > 0 ? `${whole}.${fraction}` : whole;
  };

  const handleDonorAvatarClick = () => {
    donorFileInputRef.current?.click();
  };

  const onDonorAvatarSelected: ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    const allowed = new Set(["image/png", "image/jpeg"]);
    if (!allowed.has(file.type)) {
      alert("Only PNG and JPEG images are allowed");
      return;
    }
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert("File too large (max 5MB)");
      return;
    }
    setSelectedDonorFile(file);
    if (donorAvatarPreview) URL.revokeObjectURL(donorAvatarPreview);
    const objectUrl = URL.createObjectURL(file);
    setDonorAvatarPreview(objectUrl);
    event.target.value = "";
  };

  useEffect(() => {
    const fetchAllTokens = async () => {
      try {
        // Fetch only non-representative tokens (base tokens, not yield tokens)
        const res = await fetch("/api/tokens?skipWhitelist=true&representative=false");
        if (!res.ok) throw new Error("Failed to fetch tokens");
        const data = await res.json();

        let list = [] as any[];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.tokens)) list = data.tokens;

        const normalized = list.map((t) => ({
          ...t,
          address: t.address.toLowerCase(),
          // All tokens from database are ERC20 (including mock ETH, MNT)
          // Native token handling disabled - use mock tokens instead
          isNative: false,
        }));

        setTokens(normalized);
        console.log("✅ Tokens loaded:", normalized.length);
      } catch (err) {
        console.error("❌ Error fetching tokens:", err);
        setTokens([]);
      }
    };

    fetchAllTokens();
  }, []);

  // Fetch tokens for the channel when channel is available
  useEffect(() => {
    if (!channel) return;
    const fetchTokens = async () => {
      try {
        const res = await fetch(`/api/tokens/${channel}`);
        if (!res.ok) throw new Error("Failed to fetch tokens");
        const data = await res.json();

        // simpan semua tokens
        // setTokens(data.tokens || []);

        // cari token yang isTokenPrimary === true
        const primary = data.tokens?.find((t: any) => t.isTokenPrimary);
        if (primary) {
          setSelectedToken({
            symbol: primary.symbol,
            logoURI: primary.logoURI,
            address: primary.address,
            isNative: false,
          });
          setPrimaryTokenAddress(primary.address);
          console.log("✅ Primary token detected:", primary.symbol);
        } else {
          // fallback default
          setSelectedToken({
            symbol: "ETH",
            logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            isNative: true,
          });
          setPrimaryTokenAddress(undefined);
        }
      } catch (err) {
        setTokens([]);
      }
    };
    fetchTokens();
  }, [channel]);

  // Gunakan hook untuk fetch balances
  const { balances, isLoading: isBalancesLoading, fetchBalances } = useTokenBalances(tokens);

  // Trigger fetch balances saat tokens berubah atau wallet connect
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!address) {
      alert("Please connect your wallet first.");
      return;
    }
    if (!streamerAddress) {
      alert("Streamer address not found.");
      return;
    }
    if (!streamerId) {
      alert("Streamer profile not loaded. Please refresh and try again.");
      return;
    }

    setSubmitted(true);
    setTxStep("idle");

    try {
      // Upload avatar first if needed
      let avatarUrlToSave = donorAvatarUrl;
      if (selectedDonorFile) {
        setTxStep("uploading");
        try {
          avatarUrlToSave = await uploadAvatar(selectedDonorFile);
        } catch (uploadErr) {
          console.error("❌ Failed to upload donor avatar:", uploadErr);
        }
      }

      // Handle Audio Upload
      let finalMediaUrl = mediaUrl;
      let finalDuration = mediaType === "VIDEO" ? 15 : 0; // Default video duration buffer

      if (mediaType === "AUDIO") {
        if (!audioBlob) {
          alert("Please record a voice message first.");
          setSubmitted(false);
          return;
        }
        setTxStep("uploading");
        try {
          const audioFile = new File([audioBlob], "voice-message.webm", { type: "audio/webm" });
          finalMediaUrl = await uploadMedia(audioFile);
          finalDuration = recordingTime; // Use actual recorded time
        } catch (err) {
          console.error("Failed to upload audio", err);
          alert("Failed to upload voice message. Please try again.");
          setSubmitted(false);
          setTxStep("idle");
          return;
        }
      } else if (mediaType === "VIDEO") {
        // Simple validation
        if (!getYouTubeId(youtubeUrl)) {
          alert("Please enter a valid YouTube URL");
          setSubmitted(false);
          setTxStep("idle");
          return;
        }
      }

      // Use the wagmi-based donation hook
      setTxStep("approving");
      const result = await donate({
        streamerAddress,
        amount: rawAmount,
        token: {
          symbol: selectedToken.symbol,
          logoURI: selectedToken.logoURI,
          address: selectedToken.address,
          isNative: selectedToken.isNative,
          chainId: selectedToken.chainId,
        },
        tokenOut: primaryTokenAddress,
        name,
        message,
        streamerId,
        channel,
        avatarUrl: avatarUrlToSave,
        mediaType: mediaType,
        mediaUrl: mediaType !== "TEXT" ? finalMediaUrl : undefined,
        mediaDuration: finalDuration,
        chainId: selectedToken.chainId,
      });

      if (!result.success) {
        throw new Error(result.error || "Donation failed");
      }

      // Update avatar state if uploaded
      if (selectedDonorFile && avatarUrlToSave) {
        setDonorAvatarUrl(avatarUrlToSave);
        setSelectedDonorFile(null);
        if (donorAvatarPreview) URL.revokeObjectURL(donorAvatarPreview);
        setDonorAvatarPreview("");
      }

      // Refresh balances from chain
      fetchBalances();

      const messageTemplate = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
      setCelebrationMessage(messageTemplate.replace("{streamer}", displayName || channel));
      setLastTxHash(result.txHash || null);
      setLastTxChainId(selectedToken.chainId || null);
      setAmount("");
      setRawAmount("");
      setMessage("");
      setSubmitted(false);
      setTxStep("idle");
      setShowCelebration(true);
    } catch (err: any) {
      setSubmitted(false);
      setTxStep("idle");
      alert("Failed to send donation: " + (err?.message || err));
      console.error("Donation error:", err);
    }
  };

  const hasAvatar = Boolean(avatarUrl);
  const donorAvatarDisplay = donorAvatarPreview || donorAvatarUrl;
  const hasDonorAvatar = Boolean(donorAvatarDisplay);

  return (
    <>
      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-background-dark)]/90 backdrop-blur px-4">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-[var(--color-surface-card)] border-2 border-[var(--color-border-dark)] px-6 sm:px-8 py-6 shadow-xl w-full max-w-sm">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-cyan)]/20 border-2 border-[var(--color-accent-cyan)]">
              <Loader2 className="h-7 w-7 animate-spin text-[var(--color-accent-cyan)]" />
            </span>

            <div className="space-y-3 text-center w-full">
              <p className="text-sm font-bold text-white">Processing your donation</p>

              {/* Progress Steps */}
              <div className="space-y-2 text-left">
                {/* Upload Step */}
                <div className={cn(
                  "flex items-center gap-2 text-xs transition-all",
                  txStep === "uploading" ? "text-[var(--color-accent-cyan)]" : txStep === "idle" ? "text-slate-500" : "text-slate-400"
                )}>
                  {txStep === "uploading" ? (
                    <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  ) : txStep === "idle" ? (
                    <div className="h-3 w-3 rounded-full border border-slate-500 shrink-0" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-green-500 shrink-0" />
                  )}
                  <span className="truncate">Uploading media...</span>
                </div>

                {/* Approval Step */}
                <div className={cn(
                  "flex items-center gap-2 text-xs transition-all",
                  (txStep === "approving" || isApproving) && !isDonating ? "text-[var(--color-accent-yellow)]" : (txStep === "idle" || txStep === "uploading") ? "text-slate-500" : "text-slate-400"
                )}>
                  {(txStep === "approving" || isApproving) && !isDonating ? (
                    <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  ) : (txStep === "idle" || txStep === "uploading") ? (
                    <div className="h-3 w-3 rounded-full border border-slate-500 shrink-0" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-green-500 shrink-0" />
                  )}
                  <span className="truncate">Token approval...</span>
                </div>

                {/* Transaction Step */}
                <div className={cn(
                  "flex items-center gap-2 text-xs transition-all",
                  isDonationPending ? "text-[var(--color-accent-pink)]" : (txStep === "idle" || txStep === "uploading" || txStep === "approving" || isApproving) ? "text-slate-500" : "text-slate-400"
                )}>
                  {isDonationPending ? (
                    <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  ) : (txStep === "idle" || txStep === "uploading" || txStep === "approving" || isApproving) ? (
                    <div className="h-3 w-3 rounded-full border border-slate-500 shrink-0" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-green-500 shrink-0" />
                  )}
                  <span className="truncate">Confirming transaction...</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 pt-2">
                Please confirm in your wallet and wait for blockchain confirmation.
              </p>
            </div>
          </div>
        </div>
      )}
      <main className="flex min-h-screen flex-col items-center bg-[var(--color-background-dark)] pattern-dots px-4 sm:px-6 py-12 sm:py-20 text-white relative overflow-hidden">
        <div className="absolute top-10 right-20 w-32 h-32 bg-[var(--color-primary)]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-[#6B46C1]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="w-full max-w-xl space-y-4 sm:space-y-6 relative z-10">
          <Card>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent-cyan)] to-[var(--color-secondary)]"></div>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl sm:text-3xl font-black text-white bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent-cyan)] bg-clip-text text-transparent">
                Support {displayName || "Your Favourite Streamer"}
              </CardTitle>
              <CardDescription className="text-sm text-slate-400">
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <div
                className={`grid h-24 w-24 place-items-center overflow-hidden rounded-full border-4 ${hasAvatar ? "border-[var(--color-primary)]" : "border-[var(--color-border-dark)]"
                  }`}
              >
                {hasAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={`${displayName || channel} avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-[var(--color-border-dark)] text-[var(--color-primary)]">
                    <UserRound className="h-12 w-12" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {hasAvatar ? "Profile photo set by the creator." : "This creator has not set a profile photo yet."}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-3 text-center">
                {address && (
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-primary)] font-bold flex items-center justify-center gap-2">
                    <span>Donating from {address.slice(0, 6)}…{address.slice(-4)}</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-300">{CHAIN_NAMES[selectedToken.chainId || 84532] || "Unknown Chain"}</span>
                  </p>
                )}
                {!address && (
                  <p className="text-xs text-slate-400">
                    A connection is required to submit your donation.
                  </p>
                )}
              </div>

              <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  {address && (
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDonorAvatarClick}
                        className="grid h-16 w-16 place-items-center rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      >
                        <div
                          className={`grid h-full w-full place-items-center overflow-hidden rounded-full border-2 ${hasDonorAvatar ? "border-[var(--color-primary)]" : "border-[var(--color-border-dark)]"
                            }`}
                        >
                          {hasDonorAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={donorAvatarDisplay}
                              alt="Your supporter profile avatar"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center bg-[var(--color-border-dark)] text-[var(--color-primary)]">
                              <UserRound className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                      </button>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        ref={donorFileInputRef}
                        onChange={onDonorAvatarSelected}
                        className="hidden"
                      />
                      <p className="text-xs text-slate-400">
                        {hasDonorAvatar ? "Tap to change your supporter photo." : "Tap to add a supporter profile photo."}
                      </p>
                    </div>
                  )}
                  <Label>Your Name</Label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    type="text"
                  />
                  <div className="flex justify-end">
                    <a href="/faucet" target="_blank" className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">water_drop</span>
                      Need testnet tokens?
                    </a>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-col gap-2">
                    <Label>Amount</Label>
                    <div className="flex">
                      <Input
                        required
                        value={amount}
                        onChange={(e) => {
                          const withoutSeparators = e.target.value.replace(/,/g, "");
                          let normalized = withoutSeparators.replace(/[^0-9.]/g, "");
                          normalized = normalized.replace(/\.(?=.*\.)/g, "");
                          normalized = clampDecimals(normalized);
                          if (normalized === "" || normalized === ".") {
                            setRawAmount("");
                            setAmount("");
                            return;
                          }
                          setRawAmount(normalized);
                          const num = parseFloat(normalized);
                          if (!Number.isNaN(num)) {
                            setAmount(num.toLocaleString(undefined, { maximumFractionDigits: 4 }));
                          } else {
                            setAmount(normalized);
                          }
                        }}
                        placeholder="0.05"
                        inputMode="decimal"
                        type="text"
                        className="rounded-r-none"
                      />
                      <button
                        type="button"
                        onClick={() => setIsTokenModalOpen(true)}
                        className="flex items-center gap-2 rounded-r-xl border-2 border-l-0 border-[var(--color-border-dark)] bg-[var(--color-surface-card)] px-3 text-sm font-bold text-white hover:bg-[var(--color-border-dark)] transition-colors"
                      >
                        <img src={selectedToken.logoURI} alt={selectedToken.symbol} className="h-5 w-5 rounded-full" />
                        {selectedToken.symbol}
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
                    </div>

                  </div>
                  {/* Saldo token terpilih */}
                  <p className="text-xs text-slate-400">
                    Balance:{" "}
                    {(() => {
                      const balanceKey = selectedToken.isNative
                        ? `native-${selectedToken.chainId}`
                        : `${selectedToken.chainId}-${selectedToken.address?.toLowerCase() || ""}`;
                      return balances[balanceKey] === undefined
                        ? "–"
                        : Number(balances[balanceKey] || 0).toLocaleString(undefined, {
                          maximumFractionDigits: 4,
                        });
                    })()}
                  </p>
                  {/* Tombol persentase */}
                  <div className="flex gap-2 mt-2">
                    {[25, 50, 75, 100].map((pct) => (
                      <Button
                        key={pct}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const balanceKey = selectedToken.isNative
                            ? `native-${selectedToken.chainId}`
                            : `${selectedToken.chainId}-${selectedToken.address?.toLowerCase() || ""}`;
                          const bal = parseFloat(balances[balanceKey] || "0");
                          if (!Number.isNaN(bal)) {
                            const rawValue = ((bal * pct) / 100).toFixed(6);
                            const clampedRaw = clampDecimals(rawValue);
                            const normalizedRaw = clampedRaw.replace(/\.?0+$/, "");
                            const usableRaw = normalizedRaw === "" ? "0" : normalizedRaw;
                            setRawAmount(usableRaw);
                            setAmount(formatAmount(usableRaw));
                          }
                        }}
                      >
                        {pct}%
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    We&apos;ll autoswap to the creator&apos;s preferred token.
                  </p>

                  {/* Overlay Requirement Alert */}
                  {overlaySettings && (
                    (() => {
                      const minReq = mediaType === 'VIDEO'
                        ? (overlaySettings.minVideoAmountUsd || 0)
                        : mediaType === 'AUDIO'
                          ? (overlaySettings.minAudioAmountUsd || 0)
                          : (overlaySettings.minAmountUsd || 0);

                      const isStable = ["USDC", "USDT", "DAI", "BUSD"].some(s => selectedToken.symbol.toUpperCase().includes(s));
                      // Get price from map or default to 1 for stables, else 0 if unknown
                      let tokenPrice = isStable ? 1 : 0;
                      if (!isStable && selectedToken.address) {
                        tokenPrice = TOKEN_PRICES_USD[selectedToken.address.toLowerCase()] || 0;
                      }

                      const amountVal = parseFloat(rawAmount || "0");
                      const estimatedUsd = amountVal * tokenPrice;

                      // Only show warning if we have a valid price (tokenPrice > 0) AND amount is > 0 AND estimatedUsd < minReq
                      const isLow = tokenPrice > 0 && amountVal > 0 && estimatedUsd < minReq;

                      return (
                        <div className={cn(
                          "text-xs px-3 py-2 rounded-lg border",
                          isLow
                            ? "bg-red-900/20 border-red-500/50 text-red-200"
                            : "bg-blue-900/20 border-blue-500/30 text-blue-200"
                        )}>
                          <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-[16px] mt-0.5">info</span>
                            <div>
                              <p className="font-bold">
                                Overlay Minimum: ${minReq} USD
                                {mediaType !== 'TEXT' && " for " + mediaType.toLowerCase()}
                              </p>
                              {isLow ? (
                                <p className="font-bold mt-1 text-red-400">
                                  ⚠️ Low amount (~${estimatedUsd.toFixed(2)}). Won't trigger overlay.
                                </p>
                              ) : (
                                <p className="opacity-80">
                                  {tokenPrice > 0 ? (
                                    <span>~${estimatedUsd > 0 ? estimatedUsd.toFixed(2) : "0.00"} USD value.</span>
                                  ) : "Ensure value exceeds minimum."}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })()
                  )}
                </div>

                <div className="space-y-2">
                  <div className="relative grid grid-cols-3 gap-1 p-1 bg-[var(--color-surface-card)] border border-[var(--color-border-dark)] rounded-xl">
                    {/* Sliding Indicator */}
                    <div
                      className={cn(
                        "absolute top-1 bottom-1 rounded-lg shadow-lg transition-all duration-300 ease-out z-[1] border-2 border-white/20",
                        mediaType === "TEXT" && "bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]",
                        mediaType === "AUDIO" && "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)] text-black",
                        mediaType === "VIDEO" && "bg-pink-600 shadow-[0_0_15px_rgba(236,72,153,0.5)]"
                      )}
                      style={{
                        width: "calc((100% - 16px) / 3)",
                        left: mediaType === "TEXT"
                          ? "4px"
                          : mediaType === "AUDIO"
                            ? "calc(8px + (100% - 16px) / 3)"
                            : "calc(12px + 2 * (100% - 16px) / 3)"
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => setMediaType("TEXT")}
                      className={cn(
                        "relative flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors z-10",
                        mediaType === "TEXT" ? "text-white" : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                      Message
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaType("AUDIO");
                        setMessage("");
                      }}
                      className={cn(
                        "relative flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors z-10",
                        mediaType === "AUDIO" ? "text-black" : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      <span className="material-symbols-outlined text-[18px]">mic</span>
                      Audio
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaType("VIDEO");
                        setMessage("");
                      }}
                      className={cn(
                        "relative flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors z-10",
                        mediaType === "VIDEO" ? "text-white" : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      <span className="material-symbols-outlined text-[18px]">movie</span>
                      Video
                    </button>
                  </div>

                  {mediaType === "TEXT" && (
                    <div className="space-y-2">
                      <Label>Message (optional)</Label>
                      <Textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Show some love!"
                        rows={4}
                      />
                    </div>
                  )}

                  {mediaType === "VIDEO" && (
                    <div className="space-y-3">
                      <Label>
                        YouTube Video URL
                        <span className="text-xs text-slate-400 font-normal ml-2">(Max 10s preview)</span>
                      </Label>
                      <Input
                        value={youtubeUrl}
                        onChange={(e) => {
                          const url = e.target.value;
                          setYoutubeUrl(url);
                          setMediaUrl(url);
                        }}
                        placeholder="https://youtube.com/watch?v=dQw..."
                      />

                      {/* Video Preview */}
                      {getYouTubeId(youtubeUrl) && (
                        <div className="rounded-xl overflow-hidden border-2 border-[var(--color-border-dark)] bg-black aspect-video relative group">
                          <iframe
                            key={videoKey}
                            src={`https://www.youtube.com/embed/${getYouTubeId(youtubeUrl)}?start=0&end=10&autoplay=${isVideoPaused ? 0 : 1}&loop=1&playlist=${getYouTubeId(youtubeUrl)}&controls=0&modestbranding=1&rel=0&disablekb=1&fs=0`}
                            className="absolute inset-0 w-full h-full pointer-events-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                          {/* Pause/Play Button Overlay */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsVideoPaused(!isVideoPaused);
                              if (isVideoPaused) {
                                setVideoKey(prev => prev + 1); // Restart when unpausing
                              }
                            }}
                            className="absolute bottom-3 right-3 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-white text-xl">
                              {isVideoPaused ? "play_arrow" : "pause"}
                            </span>
                          </button>
                        </div>
                      )}

                      {!getYouTubeId(youtubeUrl) && youtubeUrl.length > 10 && (
                        <p className="text-xs text-red-400">Invalid YouTube URL</p>
                      )}
                    </div>
                  )}

                  {mediaType === "AUDIO" && (
                    <div className="space-y-3">
                      <Label>Voice Message</Label>

                      {!audioBlob ? (
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={isRecording ? stopRecording : startRecording}
                            className={cn(
                              "w-full py-8 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all",
                              isRecording
                                ? "bg-red-500/10 border-red-500 animate-pulse"
                                : "border-[var(--color-border-dark)] hover:border-[var(--color-accent-yellow)] hover:bg-[var(--color-surface-card)]"
                            )}
                          >
                            <div className={cn(
                              "w-16 h-16 rounded-full flex items-center justify-center transition-all",
                              isRecording ? "bg-red-500 text-white" : "bg-[var(--color-surface-card)] border-2 border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)]"
                            )}>
                              <span className="material-symbols-outlined text-3xl">
                                {isRecording ? "stop" : "mic"}
                              </span>
                            </div>
                            <span className={cn("text-sm font-bold", isRecording ? "text-red-500" : "text-slate-400")}>
                              {isRecording ? `Recording... ${recordingTime}s` : "Tap to Record"}
                            </span>
                          </button>
                          <p className="text-xs text-slate-500 text-center">Max 10 seconds</p>
                        </div>
                      ) : (
                        <div className="p-4 bg-[var(--color-surface-card)] border border-[var(--color-border-dark)] rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const audio = new Audio(URL.createObjectURL(audioBlob));
                                audio.play();
                              }}
                              className="w-10 h-10 rounded-full bg-[var(--color-accent-yellow)] text-black flex items-center justify-center hover:scale-105 transition-transform"
                            >
                              <span className="material-symbols-outlined text-xl">play_arrow</span>
                            </button>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white">Voice Message</span>
                              <span className="text-xs text-slate-400">{Math.ceil(audioBlob.size / 1024)} KB • {recordingTime}s</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAudioBlob(null);
                              setRecordingTime(0);
                            }}
                            className="text-slate-400 hover:text-red-400 p-2"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    !address ||
                    submitted ||
                    !rawAmount ||
                    parseFloat(rawAmount) <= 0 ||
                    parseFloat(rawAmount) >
                    parseFloat(
                      balances[
                      selectedToken.isNative
                        ? `native-${selectedToken.chainId}`
                        : `${selectedToken.chainId}-${selectedToken.address?.toLowerCase() || ""}`
                      ] || "0"
                    )
                  }
                >
                  {submitted ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    "Send donation"
                  )}
                </Button>
                {submitted && (
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]">
                    Hang tight—your donation is being confirmed on-chain.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        <SelectTokenModal
          key={Object.keys(balances).join(",")}
          isOpen={isTokenModalOpen}
          onClose={() => setIsTokenModalOpen(false)}
          onSelectToken={(token) => {
            setSelectedToken({
              symbol: (token as any).symbol,
              logoURI: (token as any).logoURI ?? "",
              address: (token as any).address,
              isNative: (token as any).isNative ?? false,
              chainId: (token as any).chainId,
            });
            setIsTokenModalOpen(false);
          }}
          tokens={tokens.map(t => ({ ...t, name: t.symbol, address: t.address ?? "" }))}
          balances={Object.fromEntries(Object.entries(balances).map(([k, v]) => [k, parseFloat(v)]))}
          defaultChainId={selectedToken.chainId || 5003}
        />
      </main>
      <Dialog open={showCelebration} onOpenChange={(open) => setShowCelebration(open)}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader className="space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-cyan)]/20 border-2 border-[var(--color-accent-cyan)]">
              <PartyPopper className="h-8 w-8 text-[var(--color-accent-cyan)]" />
            </div>
            <DialogTitle className="text-2xl font-black text-white">Donation complete!</DialogTitle>
            <DialogDescription className="text-sm text-slate-300">
              {celebrationMessage || `Your support just made ${(displayName || channel)} smile!`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              We&apos;ve shared your message with {displayName || channel}. Keep spreading good vibes!
            </p>
            {lastTxHash && (() => {
              const explorer = CHAIN_EXPLORERS[lastTxChainId || 84532] || CHAIN_EXPLORERS[84532];
              return (
                <a
                  href={`${explorer.url}/${lastTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]/10 px-4 py-2 text-sm font-bold text-[var(--color-accent-cyan)] transition hover:bg-[var(--color-accent-cyan)]/20"
                >
                  View transaction on {explorer.name}
                </a>
              );
            })()}
            <Button className="w-full" onClick={() => setShowCelebration(false)}>
              Keep supporting
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
