"use client";

import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";
import { useWallet } from "@/hooks/use-wallet";

export default function DonatePage() {
  const params = useParams<{ channel: string }>();
  const channel = params?.channel ?? "";
  const { isConnected, address } = useWallet();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isConnected) return;

    setSubmitted(true);
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-rose-100 via-white to-rose-50 px-6 py-20 text-slate-900">
      <div className="w-full max-w-xl space-y-6">
        <Card className="border-white/70 bg-white/90 text-center shadow-md shadow-rose-200/40">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-slate-900">
              Support {channel || "your favourite streamer"}
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Connect your wallet to tip and share a message that will appear live on stream.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-white/70 bg-white/95 shadow-lg shadow-rose-200/30">
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <ConnectWalletButton label="Connect to donate" />
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
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  required
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.05"
                  min="0"
                  step="0.0001"
                  type="number"
                />
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
                disabled={!isConnected || submitted || !amount}
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
    </main>
  );
}
