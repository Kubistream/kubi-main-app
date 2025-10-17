"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFeeConfig } from "@/services/contracts/settings";

export default function AdminOverviewPage() {
  const [feeBps, setFeeBps] = useState<number | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cfg = await getFeeConfig();
        if (!mounted) return;
        setFeeBps(cfg.bps);
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
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : error ? (
              <p className="text-sm text-rose-500">{error}</p>
            ) : (
              <div className="text-sm text-slate-700">
                <p>
                  Fee BPS: <span className="font-semibold text-slate-900">{feeBps}</span>
                </p>
                <p className="mt-1">
                  Recipient: <span className="font-mono">{recipient}</span>
                </p>
              </div>
            )}
            <div className="pt-2">
              <Button asChild>
                <Link href="/dashboard/admin/fees">Edit Fee</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Whitelist</CardTitle>
            <CardDescription>Manage global whitelist status per token</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Add or remove tokens from the global whitelist to control which assets can be used.
            </p>
            <div className="pt-2">
              <Button variant="secondary" asChild>
                <Link href="/dashboard/admin/whitelist">Open Whitelist Manager</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

