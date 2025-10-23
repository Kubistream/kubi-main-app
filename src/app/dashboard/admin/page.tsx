"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Contract, getAddress } from "ethers";
import ERC20ABI from "@/abis/ERC20.json";
import { getRpcProvider } from "@/services/contracts/provider";
import { getFeeConfig, setFeeConfig, isGloballyWhitelisted, setGlobalWhitelist } from "@/services/contracts/settings";
import { SelectTokenModal } from "@/components/ui/select-token-modal";
import { Switch } from "@/components/ui/switch";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { setYieldConfig as setYieldConfigOnChain, getYieldConfig as readYieldConfig } from "@/services/contracts/yield";
import { DEFAULT_CHAIN_ID } from "@/config/chain-id";
import { parseUnits } from "ethers";

const BASESCAN_TX_URL = "https://sepolia.basescan.org/tx/";

export default function AdminOverviewPage() {
  // Fee config state
  const [feeBps, setFeeBps] = useState<number | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingFee, setSavingFee] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);
  const [feeTxHash, setFeeTxHash] = useState<string | null>(null);

  // Whitelist state
  const [tokenInput, setTokenInput] = useState<string>("");
  const [checking, setChecking] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [decimals, setDecimals] = useState<number | null>(null);
  const [whitelistError, setWhitelistError] = useState<string | null>(null);
  const [whitelistTxHash, setWhitelistTxHash] = useState<string | null>(null);
  // Yield Representative form state
  const [underlying, setUnderlying] = useState<{ symbol: string; name: string; address: string; decimals?: number; logoURI?: string } | null>(null);
  const [representative, setRepresentative] = useState<{ symbol: string; name: string; address: string; decimals?: number; logoURI?: string } | null>(null);
  const [allowedYield, setAllowedYield] = useState<boolean>(true);
  const [minAmount, setMinAmount] = useState("");
  const [savingYield, setSavingYield] = useState(false);
  const [yieldTxHash, setYieldTxHash] = useState<string | null>(null);
  const [yieldError, setYieldError] = useState<string | null>(null);
  const [openUnderlyingModal, setOpenUnderlyingModal] = useState(false);
  const [openRepModal, setOpenRepModal] = useState(false);
  const [underlyingTokens, setUnderlyingTokens] = useState<any[]>([]);
  const [repTokens, setRepTokens] = useState<any[]>([]);
  // Additional protocol metadata for YieldProvider
  const [protocol, setProtocol] = useState("");
  const [protocolName, setProtocolName] = useState("");
  const [protocolImageUrl, setProtocolImageUrl] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cfg = await getFeeConfig();
        if (!mounted) return;
        setFeeBps(cfg.bps);
        setRecipient(cfg.recipient);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load fee config");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load tokens for selects based on representative flag
  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const [undRes, repRes] = await Promise.all([
          // Underlying: tetap filter whitelist global
          fetch(`/api/tokens?representative=false`).then((r) => r.json()).catch(() => ({ tokens: [] })),
          // Representative: hanya filter isRepresentativeToken, lewati whitelist global
          fetch(`/api/tokens?representative=true&skipWhitelist=true`).then((r) => r.json()).catch(() => ({ tokens: [] })),
        ]);
        if (!disposed) {
          setUnderlyingTokens(undRes?.tokens ?? []);
          setRepTokens(repRes?.tokens ?? []);
        }
      } catch {
        if (!disposed) {
          setUnderlyingTokens([]);
          setRepTokens([]);
        }
      }
    })();
    return () => {
      disposed = true;
    };
  }, []);

  const onSaveYieldMapping = async () => {
    try {
      setYieldError(null);
      setYieldTxHash(null);
      if (!underlying || !representative) throw new Error("Select both underlying and representative tokens");
      if (!minAmount || Number(minAmount) <= 0) throw new Error("Minimum amount must be greater than 0");

      // Ensure underlying token is globally whitelisted
      const uwAllowed = await isGloballyWhitelisted(getAddress(underlying.address));
      if (!uwAllowed) throw new Error("Underlying token is not in global whitelist");

      // Use decimals from DB (tokens API) instead of on-chain call
      const dbDecimals = underlying.decimals ?? (underlyingTokens || []).find((x: any) => x.address.toLowerCase() === underlying.address.toLowerCase())?.decimals;
      if (typeof dbDecimals !== "number") throw new Error("Failed to read underlying token decimals from DB");
      const minDonation = parseUnits(minAmount, dbDecimals);

      setSavingYield(true);
      const { hash } = await setYieldConfigOnChain({
        yieldContract: representative.address,
        underlying: underlying.address,
        allowed: allowedYield,
        minDonation,
      });
      setYieldTxHash(hash);

      // Upsert DB YieldProvider mapping
      try {
        await fetch("/api/admin/yield/providers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            representativeAddress: representative.address,
            underlyingAddress: underlying.address,
            chainId: DEFAULT_CHAIN_ID,
            allowed: allowedYield,
            protocol: protocol || undefined,
            protocolName: protocolName || undefined,
            protocolImageUrl: protocolImageUrl || undefined,
          }),
        });
      } catch {}
    } catch (err) {
      setYieldError(err instanceof Error ? err.message : "Failed to save yield mapping");
    } finally {
      setSavingYield(false);
    }
  };

  const onSaveFee = async () => {
    try {
      setFeeError(null);
      setFeeTxHash(null);
      if (!Number.isFinite(feeBps as any) || (feeBps as number) < 0 || (feeBps as number) > 10000) {
        throw new Error("Fee bps must be between 0 and 10000.");
      }
      const checksummed = getAddress(recipient || "");
      setSavingFee(true);
      const { hash } = await setFeeConfig(feeBps as number, checksummed);
      setFeeTxHash(hash);
      // Persist to DB (non-blocking for UX; ignore errors silently here)
      try {
        await fetch("/api/admin/fees/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feeBps: feeBps as number, feeRecipient: checksummed, txHash: hash }),
        });
      } catch {}
    } catch (err) {
      setFeeError(err instanceof Error ? err.message : "Failed to update fee config");
    } finally {
      setSavingFee(false);
    }
  };

  const clearWhitelistState = useCallback(() => {
    setAllowed(null);
    setSymbol(null);
    setDecimals(null);
    setWhitelistError(null);
    setWhitelistTxHash(null);
  }, []);

  const onCheckWhitelist = async () => {
    clearWhitelistState();
    try {
      setChecking(true);
      const addr = getAddress(tokenInput);
      const [status, meta] = await Promise.all([
        isGloballyWhitelisted(addr),
        readErc20Meta(addr),
      ]);
      setAllowed(status);
      setSymbol(meta?.symbol ?? null);
      setDecimals(meta?.decimals ?? null);
      // Sync DB with on-chain state
      try {
        await fetch("/api/admin/whitelist/global", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: addr,
            allowed: status,
            symbol: meta?.symbol,
            decimals: typeof meta?.decimals === "number" ? meta.decimals : undefined,
          }),
        });
      } catch {}
    } catch (err) {
      setWhitelistError(err instanceof Error ? err.message : "Failed to check whitelist");
    } finally {
      setChecking(false);
    }
  };

  const onSetWhitelist = async (nextAllowed: boolean) => {
    try {
      setWhitelistError(null);
      setWhitelistTxHash(null);
      const addr = getAddress(tokenInput);
      const { hash } = await setGlobalWhitelist(addr, nextAllowed);
      setAllowed(nextAllowed);
      setWhitelistTxHash(hash);
      // Update DB record accordingly
      try {
        await fetch("/api/admin/whitelist/global", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: addr,
            allowed: nextAllowed,
            symbol,
            decimals,
          }),
        });
      } catch {}
    } catch (err) {
      setWhitelistError(err instanceof Error ? err.message : "Failed to update whitelist");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-400">Super Admin</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Admin Overview</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Manage global fee configuration and token whitelist. Only visible to superadmins.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Fee Configuration</CardTitle>
            <CardDescription>Global fee applied to donations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : loadError ? (
              <p className="text-sm text-rose-500">{loadError}</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="bps">Fee (bps)</Label>
                    <Input
                      id="bps"
                      type="number"
                      min={0}
                      max={10000}
                      value={Number.isFinite(feeBps) ? (feeBps as number) : 0}
                      onChange={(e) => setFeeBps(Number.parseInt(e.target.value || "0", 10))}
                      placeholder="e.g. 100 = 1%"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipient">Fee recipient</Label>
                    <Input
                      id="recipient"
                      value={recipient ?? ""}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                </div>

                {feeError && <p className="text-sm text-rose-500">{feeError}</p>}
                {feeTxHash && (
                  <p className="text-sm text-slate-600">
                    Updated. View tx: {" "}
                    <a className="text-rose-600 underline" href={BASESCAN_TX_URL + feeTxHash} target="_blank" rel="noreferrer">
                      {feeTxHash.slice(0, 8)}...{feeTxHash.slice(-6)}
                    </a>
                  </p>
                )}

                <div className="pt-2">
                  <Button onClick={onSaveFee} disabled={savingFee}>
                    {savingFee ? "Saving..." : "Save"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Whitelist</CardTitle>
            <CardDescription>Manage global whitelist status per token</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
              <div>
                <Label htmlFor="token">Token address</Label>
                <Input
                  id="token"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="0x..."
                  autoComplete="off"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={onCheckWhitelist} disabled={checking || tokenInput.trim() === ""}>
                  {checking ? "Checking..." : "Check"}
                </Button>
              </div>
            </div>

            {whitelistError && <p className="text-sm text-rose-500">{whitelistError}</p>}

            {allowed !== null && (
              <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
                <p className="text-sm text-slate-700">
                  Status: {" "}
                  <span className={allowed ? "text-green-600" : "text-rose-600"}>
                    {allowed ? "Allowed (whitelisted)" : "Blocked (not whitelisted)"}
                  </span>
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {symbol ? (
                    <>
                      Token: <span className="font-medium text-slate-900">{symbol}</span>{" "}
                      {typeof decimals === "number" && <>(decimals: {decimals})</>}
                    </>
                  ) : (
                    <>Token metadata unavailable</>
                  )}
                </p>

                <div className="mt-3 flex gap-3">
                  <Button variant="outline" onClick={() => onSetWhitelist(true)} disabled={allowed === true}>
                    Allow
                  </Button>
                  <Button variant="outline" onClick={() => onSetWhitelist(false)} disabled={allowed === false}>
                    Block
                  </Button>
                </div>

                {whitelistTxHash && (
                  <p className="mt-3 text-sm text-slate-600">
                    Updated. View tx: {" "}
                    <a className="text-rose-600 underline" href={BASESCAN_TX_URL + whitelistTxHash} target="_blank" rel="noreferrer">
                      {whitelistTxHash.slice(0, 8)}...{whitelistTxHash.slice(-6)}
                    </a>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yield Representative Token</CardTitle>
            <CardDescription>Create or update mapping for yield token</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Underlying token</Label>
                <button
                  type="button"
                  onClick={() => setOpenUnderlyingModal(true)}
                  className="mt-2 flex h-11 w-full items-center justify-between rounded-2xl border border-slate-300 bg-white px-4 text-left text-sm shadow-sm transition hover:border-rose-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
                >
                  <span className="flex items-center gap-2 text-slate-800">
                    {underlying?.logoURI && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={underlying.logoURI!} alt={underlying.symbol} className="h-5 w-5 rounded-full" />
                    )}
                    {underlying ? (
                      <>
                        <span>{underlying.symbol}</span>
                        <span className="truncate text-xs text-slate-500">{underlying.address.slice(0, 6)}...{underlying.address.slice(-4)}</span>
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
              </div>
              <div>
                <Label>Representative token</Label>
                <button
                  type="button"
                  onClick={() => setOpenRepModal(true)}
                  className="mt-2 flex h-11 w-full items-center justify-between rounded-2xl border border-slate-300 bg-white px-4 text-left text-sm shadow-sm transition hover:border-rose-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
                >
                  <span className="flex items-center gap-2 text-slate-800">
                    {representative?.logoURI && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={representative.logoURI!} alt={representative.symbol} className="h-5 w-5 rounded-full" />
                    )}
                    {representative ? (
                      <>
                        <span>{representative.symbol}</span>
                        <span className="truncate text-xs text-slate-500">{representative.address.slice(0, 6)}...{representative.address.slice(-4)}</span>
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
              </div>
              <div className="flex items-center justify-between">
                <Label>Allowed</Label>
                <Switch checked={allowedYield} onCheckedChange={setAllowedYield} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="minAmount">Minimum amount to yield</Label>
                  <InfoTooltip
                    content="Nilai ini akan dikonversi ke base units menggunakan decimals token dari database (parseUnits)."
                  />
                </div>
                <Input
                  id="minAmount"
                  type="number"
                  min={0}
                  step="any"
                  value={minAmount}
                  onChange={(e) => {
                    setMinAmount(e.target.value);
                    // Clear previous error when user edits the value
                    setYieldError(null);
                  }}
                  placeholder="e.g. 0.1"
                  autoComplete="off"
                />
              </div>
              {/* Protocol metadata inputs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="protocol">Protocol</Label>
                  <Input
                    id="protocol"
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value)}
                    placeholder="e.g. aave_v3"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="protocolName">Protocol Name</Label>
                  <Input
                    id="protocolName"
                    value={protocolName}
                    onChange={(e) => setProtocolName(e.target.value)}
                    placeholder="e.g. Aave v3"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="protocolImageUrl">Protocol Image URL</Label>
                  <Input
                    id="protocolImageUrl"
                    value={protocolImageUrl}
                    onChange={(e) => setProtocolImageUrl(e.target.value)}
                    placeholder="https://.../aave.png"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            {yieldError && <p className="text-sm text-rose-500">{yieldError}</p>}
            {yieldTxHash && (
              <p className="text-sm text-slate-600">
                Updated. View tx: {" "}
                <a className="text-rose-600 underline" href={BASESCAN_TX_URL + yieldTxHash} target="_blank" rel="noreferrer">
                  {yieldTxHash.slice(0, 8)}...{yieldTxHash.slice(-6)}
                </a>
              </p>
            )}

            <div className="pt-2">
              <Button variant="outline" onClick={onSaveYieldMapping} disabled={savingYield || !underlying || !representative || !minAmount}>
                {savingYield ? "Saving..." : "Save Mapping"}
              </Button>
            </div>

            {/* Modals for selecting tokens */}
            <SelectTokenModal
              isOpen={openUnderlyingModal}
              onClose={() => setOpenUnderlyingModal(false)}
              onSelectToken={(t) => setUnderlying(t)}
            tokens={(underlyingTokens || []).map((t: any) => ({ symbol: t.symbol, name: t.name ?? t.symbol, address: t.address, decimals: t.decimals, logoURI: t.logoURI }))}
            />
            <SelectTokenModal
              isOpen={openRepModal}
              onClose={() => setOpenRepModal(false)}
              onSelectToken={async (t) => {
                setRepresentative(t);
                setYieldError(null);
                setYieldTxHash(null);
                // Prefill from on-chain config if available
                const cfg = await readYieldConfig(t.address).catch(() => null);
                if (cfg && cfg.underlying) {
                  const found = (underlyingTokens || []).find((x: any) => x.address.toLowerCase() === cfg.underlying.toLowerCase());
                  if (found) setUnderlying({ symbol: found.symbol, name: found.name ?? found.symbol, address: found.address, decimals: found.decimals, logoURI: found.logoURI });
                  setAllowedYield(Boolean(cfg.allowed));
                }
              }}
              tokens={(repTokens || []).map((t: any) => ({ symbol: t.symbol, name: t.name ?? t.symbol, address: t.address, decimals: t.decimals, logoURI: t.logoURI }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function readErc20Meta(address: string): Promise<{ symbol: string | null; decimals: number } | null> {
  try {
    const provider = getRpcProvider();
    const erc20 = new Contract(address, ERC20ABI as any, provider);
    // EIP-20: symbol is optional, decimals is required for our use-case.
    const [symbol, decimals] = await Promise.all([
      erc20.symbol().catch(() => null),
      erc20.decimals().catch(() => null),
    ]);
    if (typeof decimals !== "number") return null;
    return { symbol, decimals };
  } catch {
    return null;
  }
}
