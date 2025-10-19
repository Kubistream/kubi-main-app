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
  // UI state for yield representative token form (UI only for now)
  const [baseToken, setBaseToken] = useState("");
  const [repToken, setRepToken] = useState("");
  const [minAmount, setMinAmount] = useState(""
  );
  const [uiNote, setUiNote] = useState<string | null>(null);

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
                <Label htmlFor="baseToken">Original token address</Label>
                <Input
                  id="baseToken"
                  value={baseToken}
                  onChange={(e) => setBaseToken(e.target.value)}
                  placeholder="0x..."
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="repToken">Representative token address</Label>
                <Input
                  id="repToken"
                  value={repToken}
                  onChange={(e) => setRepToken(e.target.value)}
                  placeholder="0x..."
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="minAmount">Minimum amount to yield</Label>
                <Input
                  id="minAmount"
                  type="number"
                  min={0}
                  step="any"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="e.g. 0.1"
                  autoComplete="off"
                />
              </div>
            </div>

            {uiNote && <p className="text-sm text-slate-600">{uiNote}</p>}

            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => setUiNote("UI only for now — saving will be wired to contracts/DB later.")}
                disabled={!baseToken || !repToken || !minAmount}
              >
                Save Mapping (UI only)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function readErc20Meta(address: string): Promise<{ symbol: string; decimals: number } | null> {
  try {
    const provider = getRpcProvider();
    const erc20 = new Contract(address, ERC20ABI as any, provider);
    const [symbol, decimals] = await Promise.all([
      erc20.symbol().catch(() => null),
      erc20.decimals().catch(() => null),
    ]);
    if (!symbol || typeof decimals !== "number") return null;
    return { symbol, decimals };
  } catch {
    return null;
  }
}
