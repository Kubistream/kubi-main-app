"use client";

import { useEffect, useState } from "react";
import { getAddress } from "ethers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getFeeConfig, setFeeConfig } from "@/services/contracts/settings";

const BASESCAN_TX_URL = "https://sepolia.basescan.org/tx/";

export default function AdminFeesPage() {
  const [bps, setBps] = useState<number>(0);
  const [recipient, setRecipient] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cfg = await getFeeConfig();
        if (!mounted) return;
        setBps(cfg.bps);
        setRecipient(cfg.recipient);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load fee config");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onSave = async () => {
    try {
      setError(null);
      setTxHash(null);
      if (!Number.isFinite(bps) || bps < 0 || bps > 10000) {
        throw new Error("Fee bps must be between 0 and 10000.");
      }
      const checksummed = getAddress(recipient);
      setSaving(true);
      const { hash } = await setFeeConfig(bps, checksummed);
      setTxHash(hash);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update fee config");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-accent-pink">Super Admin</p>
        <h1 className="text-3xl font-black text-white font-display">Edit Global Fee</h1>
        <p className="max-w-2xl text-sm text-slate-400">Update fee bps and recipient wallet for protocol fees.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Fee Configuration</CardTitle>
          <CardDescription>Changes require an on-chain transaction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-slate-400">Loading...</p>
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
                    value={Number.isFinite(bps) ? bps : 0}
                    onChange={(e) => setBps(Number.parseInt(e.target.value || "0", 10))}
                    placeholder="e.g. 100 = 1%"
                  />
                </div>
                <div>
                  <Label htmlFor="recipient">Fee recipient</Label>
                  <Input
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                  />
                </div>
              </div>

              {error && <p className="text-sm text-[var(--color-primary)]">{error}</p>}
              {txHash && (
                <p className="text-sm text-slate-400">
                  Updated. View tx: {" "}
                  <a className="text-[var(--color-accent-cyan)] underline" href={BASESCAN_TX_URL + txHash} target="_blank" rel="noreferrer">
                    {txHash.slice(0, 8)}...{txHash.slice(-6)}
                  </a>
                </p>
              )}

              <div className="pt-2">
                <Button onClick={onSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

