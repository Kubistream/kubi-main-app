"use client";

import { ChangeEventHandler, FormEvent, useEffect, useRef, useState } from "react";
import { Loader2, PartyPopper, UserRound } from "lucide-react";
import { useParams } from "next/navigation";
import { BrowserProvider, Contract, formatEther, formatUnits, JsonRpcProvider } from "ethers";
import { parseUnits, parseEther, getAddress } from "ethers";
// Kontrak & helper modular
import { getDonationContractAddress } from "@/services/contracts/donation";
import { getErc20Contract } from "@/services/contracts/erc20";
import { getDonationContractReadOnly } from "@/services/contracts/factory";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/use-wallet";
import { SelectTokenModal } from "@/components/ui/select-token-modal";
import { uploadAvatar } from "@/services/uploads/avatar-service";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [displayName, setDisplayName] = useState<string>("");
  const [streamerAddress, setStreamerAddress] = useState<string>("");
  const [streamerId, setStreamerId] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  useEffect(() => {
    if (!channel) return;
    const fetchStreamer = async () => {
      try {
        const res = await fetch(`/api/streamer/${channel}`);
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
  }, [channel]);
  const { isConnected, address } = useWallet();
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
  const [balances, setBalances] = useState<{ [address: string]: string }>({});
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

  // Fetch balances for tokens when tokens or address change
  useEffect(() => {
    if (tokens.length === 0) {
      console.log("🚫 fetchBalances skipped: tokens empty");
      return;
    }

    const fetchBalances = async () => {
      try {
        console.log(
          "🔥 useEffect triggered, tokens:",
          tokens.length,
          "address:",
          address,
          "isConnected:",
          isConnected
        );

        let provider;
        let chainId;
        try {
          if (typeof window !== "undefined" && (window as any).ethereum) {
            console.log("🦊 Using BrowserProvider");
            provider = new BrowserProvider((window as any).ethereum, "any");
            chainId = await provider.send("eth_chainId", []);
            if (parseInt(chainId, 16) !== 84532) {
              console.warn(
                `⚠️ Connected chainId ${parseInt(chainId, 16)} is not Base Sepolia (84532). Using fallback provider.`
              );
              provider = new JsonRpcProvider(
                "https://base-sepolia.g.alchemy.com/v2/okjfsx8BQgIIx7k_zPuLKtTUAk9TaJqa"
              );
              chainId = "0x14798"; // 84532 in hex
            }
          } else {
            console.log("🌐 Using fallback JsonRpcProvider");
            provider = new JsonRpcProvider(
              "https://base-sepolia.g.alchemy.com/v2/okjfsx8BQgIIx7k_zPuLKtTUAk9TaJqa"
            );
            chainId = "0x14798"; // 84532 in hex
          }
        } catch (provErr) {
          console.error("💥 Error initializing provider:", provErr);
          setBalances({});
          return;
        }

        if (!provider) {
          console.error("❌ Provider not initialized");
          setBalances({});
          return;
        }
        console.log("✅ Provider initialized:", provider);
        // --- Inisialisasi kontrak donasi untuk cek koneksi RPC
        try {
          const donationContract = getDonationContractReadOnly();
          console.log("🎯 Donation contract connected:", donationContract.target);
        } catch (contractErr) {
          console.error("💥 Error initializing donation contract:", contractErr);
        }

        const network = await provider.getNetwork();
        console.log("🧠 Connected network:", network, "chainId:", chainId);

        if (typeof window !== "undefined" && (window as any).ethereum) {
          (window as any).ethereum.on("chainChanged", () => {
            window.location.reload();
          });
        }

        if (!isConnected || !address) {
          console.warn("⚠️ Wallet not connected, skipping balance fetch");
          setBalances({});
          return;
        }

        console.log("⏳ Fetching balances for address:", address);
        console.log("🔁 Fetching token balances concurrently for", tokens.length, "tokens");

        const balancePromises = tokens.map(async (token) => {
          try {
            if (token.isNative) {
              const balance = await provider.getBalance(address);
              const formatted = formatEther(balance);
              console.log(`✅ Native balance: ${formatted}`);
              return ["native", formatted] as const;
            }

            if (!token.address) {
              console.warn("⚠️ Token without address skipped:", token);
              return null;
            }

            const tokenAddress = token.address.toLowerCase();
            const code = await provider.getCode(tokenAddress);
            if (code === "0x") {
              console.warn(`⚠️ ${tokenAddress} is not a contract`);
              return null;
            }

            const contract = getErc20Contract(tokenAddress, provider);

            let decimals = decimalsCacheRef.current[tokenAddress];
            if (typeof decimals !== "number") {
              decimals = await withTimeout(contract.decimals(), 8000).catch(() => 18);
              decimalsCacheRef.current[tokenAddress] = decimals;
            }

            const balanceRaw = await withTimeout(contract.balanceOf(address), 8000).catch(() => 0n);
            const balance = formatUnits(balanceRaw, decimals);
            console.log(`✅ ${token.symbol} balance:`, balance);
            return [tokenAddress, balance] as const;
          } catch (err) {
            console.error(`❌ Error fetching ${token.symbol}:`, err);
            return null;
          }
        });

        const settled = await Promise.all(balancePromises);
        const newBalances: { [address: string]: string } = {};
        for (const result of settled) {
          if (!result) continue;
          const [key, value] = result;
          newBalances[key] = value;
        }

        console.log("🏁 Finished fetching all balances:", newBalances);
        setBalances(newBalances);
      } catch (error) {
        console.error("💥 fetchBalances failed:", error);
        setBalances({});
      }
    };

    fetchBalances();
  }, [isConnected, address, tokens]);

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
    try {
      setSubmitted(true);
      // 1. Init provider & signer
      const provider = new BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      // 2. Prepare contract
      const contract = new Contract(getDonationContractAddress(), [
        "function donate(address addressSupporter, address tokenIn, uint256 amount, address streamer, uint256 amountOutMin, uint256 deadline) payable",
      ], signer);
      // 3. Ambil amountIn
      let amountIn;
      let decimals = 18;
      let cleanAmount = rawAmount.trim();
      if (cleanAmount.endsWith(".")) {
        cleanAmount = cleanAmount.slice(0, -1);
      }
      if (!cleanAmount || Number.isNaN(Number(cleanAmount))) {
        throw new Error("Invalid amount");
      }

      let erc20: Contract | undefined;
      if (selectedToken.isNative) {
        amountIn = parseEther(cleanAmount);
      } else if (selectedToken.address) {
        erc20 = getErc20Contract(selectedToken.address, signer);
        decimals = await erc20.decimals();
        amountIn = parseUnits(cleanAmount, decimals);
      } else {
        throw new Error("Invalid token selection");
      }
      // 4. Jika token ERC20, cek allowance dan approve jika kurang
      if (!selectedToken.isNative && selectedToken.address && erc20) {
        const spender = getDonationContractAddress();
        const owner = getAddress(address!);
        let allowance = await erc20.allowance(owner, spender);
        console.log("🔎 Current allowance:", allowance.toString(), "Needed:", amountIn.toString());
        if (allowance < amountIn) {
          console.log("📝 Approving token for donation contract...");
          try {
            // Approve for amountIn, or you can use ethers.MaxUint256 for unlimited
            const approveTx = await erc20.approve(spender, amountIn);
            setSubmitted(true); // keep loader
            console.log("⏳ Waiting for approve tx:", approveTx.hash);
            await approveTx.wait();
            console.log("✅ Approve succeeded");

            await approveTx.wait();

            // tunggu sampai allowance benar-benar ter-update di node
            let newAllowance = await erc20.allowance(owner, spender);
            let retries = 0;
            while (newAllowance < amountIn && retries < 5) {
              console.log("⌛ waiting allowance update...");
              await new Promise(r => setTimeout(r, 1000));
              newAllowance = await erc20.allowance(owner, spender);
              retries++;
            }
          } catch (approveErr) {
            setSubmitted(false);
            console.error("❌ Approve failed:", approveErr);
            alert("Failed to approve token: " + (approveErr as any)?.message);
            return;
          }
        } else {
          console.log("✅ Allowance sufficient, skipping approve");
        }
      }
      // 5. Panggil donate()
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

      console.log("⏳ Sending donation...", {
        donor: getAddress(address!),
        tokenIn: selectedToken.isNative ? "0x0000000000000000000000000000000000000000" : getAddress(selectedToken.address!),
        streamer: getAddress(streamerAddress),
        amountIn: amountIn.toString(),
      });

      const tx = await contract.donate(
        getAddress(address!), // donor
        selectedToken.isNative ? "0x0000000000000000000000000000000000000000" : getAddress(selectedToken.address!),
        amountIn,
        getAddress(streamerAddress),
        0,
        deadline,
        selectedToken.isNative ? { value: amountIn } : {}
      );
      console.log("🚀 Donate tx sent:", tx.hash);

      await tx.wait();
      console.log("🎉 Donation confirmed!");

      try {
        let avatarUrlToSave = donorAvatarUrl;
        if (selectedDonorFile) {
          try {
            avatarUrlToSave = await uploadAvatar(selectedDonorFile);
          } catch (uploadErr) {
            console.error("❌ Failed to upload donor avatar:", uploadErr);
            alert("Donation succeeded but failed to upload your avatar. Please try again.");
          }
        }

        // 🧠 SIWE session already active via AuthProvider, no need to sign message again
        await fetch(`/api/save-donation/${channel}`, {
          method: "POST",
          credentials: "include", // ensure SIWE session cookie is sent
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txHash: tx.hash,
            message,
            name,
            streamerId,
            avatarUrl: avatarUrlToSave,
          }),
        });
        console.log("✅ Donation data sent to API");
        if (selectedDonorFile && avatarUrlToSave) {
          setDonorAvatarUrl(avatarUrlToSave);
          setSelectedDonorFile(null);
          if (donorAvatarPreview) URL.revokeObjectURL(donorAvatarPreview);
          setDonorAvatarPreview("");
        }
      } catch (apiErr) {
        console.error("❌ Failed to send donation data:", apiErr);
      }

      setBalances((prev) => {
        const balanceKey = selectedToken.isNative
          ? "native"
          : selectedToken.address
            ? selectedToken.address.toLowerCase()
            : null;
        if (!balanceKey) return prev;
        const currentBalance = prev[balanceKey];
        if (currentBalance === undefined) return prev;
        try {
          const decimalsForToken = selectedToken.isNative ? 18 : decimals;
          const currentAmount = parseUnits(currentBalance || "0", decimalsForToken);
          const updatedAmount = currentAmount > amountIn ? currentAmount - amountIn : 0n;
          const formatted = formatUnits(updatedAmount, decimalsForToken);
          return {
            ...prev,
            [balanceKey]: formatted,
          };
        } catch (balanceErr) {
          console.error("❌ Failed to update local balance after donation:", balanceErr);
          return prev;
        }
      });

      const messageTemplate = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
      setCelebrationMessage(messageTemplate.replace("{streamer}", displayName || channel));
      setLastTxHash(tx.hash);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/95 px-8 py-6 shadow-xl shadow-emerald-200/60">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
            </span>
            <div className="space-y-1 text-center">
              <p className="text-sm font-semibold text-slate-900">Processing your donation</p>
              <p className="text-xs text-slate-500">
                We&apos;re locking in your support on Base. This usually takes just a moment.
              </p>
            </div>
          </div>
        </div>
      )}
      <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-rose-100 via-white to-rose-50 px-6 py-20 text-slate-900">
        <div className="w-full max-w-xl space-y-6">
          <Card className="border-white/70 bg-white/90 text-center shadow-md shadow-rose-200/40">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-slate-900">
                Support {displayName || "Your Favourite Streamer"}
              </CardTitle>
              <CardDescription className="text-sm text-slate-600">
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <div
                className={`grid h-24 w-24 place-items-center overflow-hidden rounded-full ring-2 ${
                  hasAvatar ? "ring-emerald-200" : "ring-slate-200"
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
                  <div className="grid h-full w-full place-items-center bg-emerald-100 text-emerald-700">
                    <UserRound className="h-12 w-12" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {hasAvatar ? "Profile photo set by the creator." : "This creator has not set a profile photo yet."}
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/70 bg-white/95 shadow-lg shadow-rose-200/30">
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-3 text-center">
                {/* <ConnectWalletButton label="Connect to donate" /> */}
                {isConnected && address && (
                  <p className="text-xs uppercase tracking-[0.25em] text-rose-400">
                    Donating from {address.slice(0, 6)}…{address.slice(-4)}
                  </p>
                )}
                {!isConnected && (
                  <p className="text-xs text-slate-500">
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
                        className="grid h-16 w-16 place-items-center rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      >
                        <div
                          className={`grid h-full w-full place-items-center overflow-hidden rounded-full ring-2 ${
                            hasDonorAvatar ? "ring-emerald-200" : "ring-slate-200"
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
                            <div className="grid h-full w-full place-items-center bg-emerald-100 text-emerald-700">
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
                      <p className="text-xs text-slate-500">
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
                      className="flex items-center gap-2 rounded-r border border-l-0 border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <img src={selectedToken.logoURI} alt={selectedToken.symbol} className="h-5 w-5 rounded-full" />
                      {selectedToken.symbol}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
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
                  <p className="text-xs text-slate-600">
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
                  <p className="text-xs text-slate-500">
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
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-400">
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
        <DialogContent className="max-w-md rounded-3xl border border-emerald-100 bg-white/95 text-center shadow-2xl shadow-emerald-200/40">
          <DialogHeader className="space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <PartyPopper className="h-8 w-8 text-emerald-600" />
            </div>
            <DialogTitle className="text-2xl font-semibold text-slate-900">Donation complete!</DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              {celebrationMessage || `Your support just made ${(displayName || channel)} smile!`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              We&apos;ve shared your message with {displayName || channel}. Keep spreading good vibes!
            </p>
            {lastTxHash && (
              <a
                href={`https://sepolia.basescan.org/tx/${lastTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
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


function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Operation timed out"));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
