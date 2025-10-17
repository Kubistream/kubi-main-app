"use client";

import { useCallback, useState } from "react";
import { Contract, getAddress } from "ethers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ERC20ABI from "@/abis/ERC20.json";
import { getRpcProvider } from "@/services/contracts/provider";
import { isGloballyWhitelisted, setGlobalWhitelist } from "@/services/contracts/settings";

const BASESCAN_TX_URL = "https://sepolia.basescan.org/tx/";

export default function AdminWhitelistPage() {
  const [tokenInput, setTokenInput] = useState<string>("");
  const [checking, setChecking] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [decimals, setDecimals] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const clearState = useCallback(() => {
    setAllowed(null);
    setSymbol(null);
    setDecimals(null);
    setError(null);
    setTxHash(null);
  }, []);

  const onCheck = async () => {
    clearState();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check whitelist");
    } finally {
      setChecking(false);
    }
  };

  const onSet = async (nextAllowed: boolean) => {
    try {
      setError(null);
      setTxHash(null);
      const addr = getAddress(tokenInput);
      const { hash } = await setGlobalWhitelist(addr, nextAllowed);
      setAllowed(nextAllowed);
      setTxHash(hash);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update whitelist");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-400">Super Admin</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Global Token Whitelist</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Check and update whitelist status for any ERC‑20 token.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Manage Whitelist</CardTitle>
          <CardDescription>Query and toggle whitelist status</CardDescription>
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
              <Button onClick={onCheck} disabled={checking || tokenInput.trim() === ""}>
                {checking ? "Checking..." : "Check"}
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-rose-500">{error}</p>}

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
                <Button variant="outline" onClick={() => onSet(true)} disabled={allowed === true}>
                  Allow
                </Button>
                <Button variant="outline" onClick={() => onSet(false)} disabled={allowed === false}>
                  Block
                </Button>
              </div>

              {txHash && (
                <p className="mt-3 text-sm text-slate-600">
                  Updated. View tx: {" "}
                  <a className="text-rose-600 underline" href={BASESCAN_TX_URL + txHash} target="_blank" rel="noreferrer">
                    {txHash.slice(0, 8)}...{txHash.slice(-6)}
                  </a>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
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

