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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDonation, useTokenBalances, type TokenInfo } from "@/hooks/use-donation";

// ERC20 ABI disediakan via helper getErc20Contract

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
      } catch {
        setDisplayName(channel);
        setStreamerAddress("");
        setStreamerId("");
        setAvatarUrl("");
      }
    };
    fetchStreamer();
  }, [channel, router]);
  const { isConnected, address } = useAccount();
  const { donate, isPending: isDonationPending, isApproving } = useDonation();
  const [donorAvatarUrl, setDonorAvatarUrl] = useState<string>("");
  const [donorAvatarPreview, setDonorAvatarPreview] = useState<string>("");
  const [selectedDonorFile, setSelectedDonorFile] = useState<File | null>(null);
  const donorFileInputRef = useRef<HTMLInputElement | null>(null);

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
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [rawAmount, setRawAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<{
    symbol: string;
    logoURI: string;
    address?: string;
    isNative?: boolean;
  }>({
    symbol: "ETH",
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
    isNative: true,
  });
  const [tokens, setTokens] = useState<{ symbol: string; logoURI: string; address?: string; isNative?: boolean }[]>([]);
  const decimalsCacheRef = useRef<Record<string, number>>({});

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
        const res = await fetch("/api/tokens");
        if (!res.ok) throw new Error("Failed to fetch tokens");
        const data = await res.json();

        let list = [] as any[];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.tokens)) list = data.tokens;

        const normalized = list.map((t) => ({
          ...t,
          address: t.address.toLowerCase(),
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
          console.log("✅ Primary token detected:", primary.symbol);
        } else {
          // fallback default
          setSelectedToken({
            symbol: "ETH",
            logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            isNative: true,
          });
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
    if (!isConnected) {
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

    try {
      // Upload avatar first if needed
      let avatarUrlToSave = donorAvatarUrl;
      if (selectedDonorFile) {
        try {
          avatarUrlToSave = await uploadAvatar(selectedDonorFile);
        } catch (uploadErr) {
          console.error("❌ Failed to upload donor avatar:", uploadErr);
        }
      }

      // Use the wagmi-based donation hook
      const result = await donate({
        streamerAddress,
        amount: rawAmount,
        token: {
          symbol: selectedToken.symbol,
          logoURI: selectedToken.logoURI,
          address: selectedToken.address,
          isNative: selectedToken.isNative,
        },
        name,
        message,
        streamerId,
        channel,
        avatarUrl: avatarUrlToSave,
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
      setAmount("");
      setRawAmount("");
      setMessage("");
      setSubmitted(false);
      setShowCelebration(true);
    } catch (err: any) {
      setSubmitted(false);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-background-dark)]/90 backdrop-blur">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-[var(--color-surface-card)] border-2 border-[var(--color-border-dark)] px-8 py-6 shadow-xl">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-cyan)]/20 border-2 border-[var(--color-accent-cyan)]">
              <Loader2 className="h-7 w-7 animate-spin text-[var(--color-accent-cyan)]" />
            </span>
            <div className="space-y-1 text-center">
              <p className="text-sm font-bold text-white">Processing your donation</p>
              <p className="text-xs text-slate-400">
                We&apos;re locking in your support on Base. This usually takes just a moment.
              </p>
            </div>
          </div>
        </div>
      )}
      <main className="flex min-h-screen flex-col items-center bg-[var(--color-background-dark)] pattern-dots px-6 py-20 text-white relative overflow-hidden">
        <div className="absolute top-10 right-20 w-32 h-32 bg-[var(--color-primary)]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-[#6B46C1]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="w-full max-w-xl space-y-6 relative z-10">
          <Card>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent-cyan)] to-[var(--color-secondary)]"></div>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-black text-white bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent-cyan)] bg-clip-text text-transparent">
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
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-3 text-center">
                {/* <ConnectWalletButton label="Connect to donate" /> */}
                {isConnected && address && (
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-primary)] font-bold">
                    Donating from {address.slice(0, 6)}…{address.slice(-4)}
                  </p>
                )}
                {!isConnected && (
                  <p className="text-xs text-slate-400">
                    A connection is required to submit your donation.
                  </p>
                )}
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {isConnected && (
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
                </div>
                <div className="space-y-2">
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
                  {/* Saldo token terpilih */}
                  <p className="text-xs text-slate-400">
                    Balance:{" "}
                    {balances[selectedToken.isNative ? "native" : (selectedToken.address ? selectedToken.address.toLowerCase() : "")] === undefined
                      ? "–"
                      : Number(balances[selectedToken.isNative ? "native" : (selectedToken.address ? selectedToken.address.toLowerCase() : "")] || 0).toLocaleString(undefined, {
                        maximumFractionDigits: 4,
                      })}
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
                          const bal = parseFloat(
                            balances[
                            selectedToken.isNative
                              ? "native"
                              : selectedToken.address
                                ? selectedToken.address.toLowerCase()
                                : ""
                            ] || "0"
                          );
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
                </div>

                <div className="space-y-2">
                  <Label>Message (optional)</Label>
                  <Textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Show some love!"
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    !isConnected ||
                    submitted ||
                    !rawAmount ||
                    parseFloat(rawAmount) <= 0 ||
                    parseFloat(rawAmount) >
                    parseFloat(
                      balances[
                      selectedToken.isNative
                        ? "native"
                        : selectedToken.address
                          ? selectedToken.address.toLowerCase()
                          : ""
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
            });
            setIsTokenModalOpen(false);
          }}
          tokens={tokens.map(t => ({ ...t, name: t.symbol, address: t.address ?? "" }))}
          balances={Object.fromEntries(Object.entries(balances).map(([k, v]) => [k, parseFloat(v)]))}
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
            {lastTxHash && (
              <a
                href={`https://sepolia.basescan.org/tx/${lastTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl border-2 border-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]/10 px-4 py-2 text-sm font-bold text-[var(--color-accent-cyan)] transition hover:bg-[var(--color-accent-cyan)]/20"
              >
                View transaction on BaseScan
              </a>
            )}
            <Button className="w-full" onClick={() => setShowCelebration(false)}>
              Keep supporting
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
