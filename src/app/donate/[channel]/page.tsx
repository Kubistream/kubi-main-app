"use client";

import { FormEvent, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BrowserProvider, Contract, formatEther, formatUnits, JsonRpcProvider } from "ethers";
import { parseUnits, parseEther, getAddress } from "ethers";
// === Konstanta kontrak donasi (isi dari ABI dan address yang diberikan user) ===
const DONATION_CONTRACT_ADDRESS = "0x4ff45f64d60fe55eff49077c876d3ea27936a7cd"; // Ganti dengan address kontrak sebenarnya
const DONATION_ABI = [
  // Contoh ABI, ganti dengan ABI sebenarnya
  "function donate(address donor, address token, uint256 amount, address streamer, uint256 minAmountOut, uint256 deadline) payable"
];

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";
import { useWallet } from "@/hooks/use-wallet";
import { SelectTokenModal } from "@/components/ui/select-token-modal";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

export default function DonatePage() {
  const params = useParams<{ channel: string }>();
  const channel = params?.channel ?? "";
  const [displayName, setDisplayName] = useState<string>("");
  const [streamerAddress, setStreamerAddress] = useState<string>("");
  const [streamerId, setStreamerId] = useState<string>("");
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
      } catch {
        setDisplayName(channel);
        setStreamerAddress("");
        setStreamerId("");
      }
    };
    fetchStreamer();
  }, [channel]);
  const { isConnected, address } = useWallet();
  const [donorDisplayName, setDonorDisplayName] = useState<string>("");

  useEffect(() => {
    if (!address) return;
    const fetchDonor = async () => {
      try {
        console.log("Fetching donor info for address:", address);
        const res = await fetch(`/api/donor/${address}`);
        if (!res.ok) throw new Error("Failed to fetch donor");
        const data = await res.json();
        if (data.displayName) {
          setDonorDisplayName(data.displayName);
          setName(data.displayName); // isi otomatis field nama
        }
      } catch {
        setDonorDisplayName("");
      }
    };
    fetchDonor();
  }, [address]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [rawAmount, setRawAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
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

  // helper function to format amount input
  const formatAmount = (value: string) => {
    if (!value) return "";
    const numeric = value.replace(/,/g, ".");
    const num = parseFloat(numeric);
    if (isNaN(num)) return "";
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
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
        const newBalances: { [address: string]: string } = {};

        console.log("🔁 Starting token balance loop for", tokens.length, "tokens");
        for (const token of tokens) {
          console.log("🔍 Checking token:", token);
          try {
            if (token.isNative) {
              const balance = await provider.getBalance(address);
              newBalances["native"] = formatEther(balance);
              console.log(`✅ Native balance: ${newBalances["native"]}`);
            } else if (token.address) {
              const code = await provider.getCode(token.address);
              console.log("📦 Code length:", code.length);
              if (code === "0x") {
                console.warn(`⚠️ ${token.address} is not a contract`);
                continue;
              }

              const contract = new Contract(token.address, ERC20_ABI, provider);
              const decimals = await withTimeout(contract.decimals(), 8000).catch(() => 18);
              const balanceRaw = await withTimeout(contract.balanceOf(address), 8000).catch(() => 0n);
              const balance = formatUnits(balanceRaw, decimals);
              newBalances[token.address.toLowerCase()] = balance;
              console.log(`✅ ${token.symbol} balance:`, balance);
            }
            await new Promise((r) => setTimeout(r, 200));
          } catch (err) {
            console.error(`❌ Error fetching ${token.symbol}:`, err);
          }
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
    try {
      setSubmitted(true);
      // 1. Init provider & signer
      const provider = new BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      // 2. Prepare contract
      const contract = new Contract(DONATION_CONTRACT_ADDRESS, DONATION_ABI, signer);
      // 3. Ambil amountIn
      let amountIn;
      let decimals = 18;
      const cleanAmount = amount.replace(/,/g, ".").trim();
      if (!cleanAmount || isNaN(Number(cleanAmount))) {
        throw new Error("Invalid amount");
      }

      let erc20;
      if (selectedToken.isNative) {
        amountIn = parseEther(cleanAmount);
      } else if (selectedToken.address) {
        erc20 = new Contract(selectedToken.address, ERC20_ABI, signer);
        decimals = await erc20.decimals();
        amountIn = parseUnits(cleanAmount, decimals);
      } else {
        throw new Error("Invalid token selection");
      }
      // 4. Jika token ERC20, cek allowance dan approve jika kurang
      if (!selectedToken.isNative && selectedToken.address && erc20) {
        const spender = DONATION_CONTRACT_ADDRESS;
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
        // 🧠 SIWE session already active via AuthProvider, no need to sign message again
        await fetch(`/api/save-donation/${channel}`, {
          method: "POST",
          credentials: "include", // ensure SIWE session cookie is sent
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txHash: tx.hash,
            message,
            donorWallet: getAddress(address!),
            streamerId: streamerId,
            tokenInId: selectedToken.isNative
              ? "0x0000000000000000000000000000000000000000"
              : getAddress(selectedToken.address!),
            tokenOutId: selectedToken.isNative
              ? "0x0000000000000000000000000000000000000000"
              : getAddress(selectedToken.address!),
            amountInUsd: 0,
            amountOutUsd: 0,
            amountInIdr: 0,
            amountOutIdr: 0,
          }),
        });
        console.log("✅ Donation data sent to API");
      } catch (apiErr) {
        console.error("❌ Failed to send donation data:", apiErr);
      }

      alert("Donation sent successfully!");
      setSubmitted(false);
    } catch (err: any) {
      setSubmitted(false);
      alert("Failed to send donation: " + (err?.message || err));
      console.error("Donation error:", err);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-rose-100 via-white to-rose-50 px-6 py-20 text-slate-900">
      <div className="w-full max-w-xl space-y-6">
        <Card className="border-white/70 bg-white/90 text-center shadow-md shadow-rose-200/40">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-slate-900">
              Support {displayName || "Your Favourite Streamer"}
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Connect your wallet to tip and share a message that will appear live on stream.
            </CardDescription>
          </CardHeader>
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
                      // ambil hanya angka dan titik
                      const raw = e.target.value.replace(/[^\d.]/g, "");
                      setRawAmount(raw);
                      if (raw === "") {
                        setAmount("");
                        return;
                      }
                      const num = parseFloat(raw);
                      if (!isNaN(num)) {
                        // tampilkan diformat agar mudah dibaca
                        setAmount(num.toLocaleString(undefined, { maximumFractionDigits: 4 }));
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
                        const bal = parseFloat(balances[selectedToken.isNative ? "native" : (selectedToken.address ? selectedToken.address.toLowerCase() : "")] || "0");
                        if (!isNaN(bal)) {
                          const formatted = formatAmount(((bal * pct) / 100).toFixed(6));
                          setAmount(formatted);
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
                  !amount ||
                  parseFloat(amount) <= 0 ||
                  parseFloat(amount) >
                    parseFloat(balances[selectedToken.isNative ? "native" : (selectedToken.address ? selectedToken.address.toLowerCase() : "")] || "0")
                }
              >
                {submitted ? "Donation queued" : "Send donation"}
              </Button>
              {submitted && (
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-400">
                  Thanks for the support! The streamer will see your alert instantly.
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

