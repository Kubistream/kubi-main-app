"use client";

import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
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
    <main className="flex min-h-screen flex-col items-center bg-slate-950 px-6 py-20 text-slate-100">
      <div className="w-full max-w-xl space-y-6">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center">
          <h1 className="text-3xl font-semibold text-white">
            Support {channel || "your favourite streamer"}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Connect your wallet to tip and share a message that will appear live
            on stream.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <ConnectWalletButton label="Connect to donate" />
            {isConnected && address && (
              <p className="text-xs text-slate-400">
                Donating from {address.slice(0, 6)}…{address.slice(-4)}
              </p>
            )}
            {!isConnected && (
              <p className="text-xs text-slate-500">
                A connection is required to submit your donation.
              </p>
            )}
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-200">
                Amount
              </label>
              <input
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.05"
                min="0"
                step="0.0001"
                type="number"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="mt-1 text-xs text-slate-500">
                We&apos;ll autoswap to the creator&apos;s preferred token.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">
                Message (optional)
              </label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Show some love!"
                rows={4}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700"
              disabled={!isConnected || submitted || !amount}
            >
              {submitted ? "Donation queued" : "Send donation"}
            </button>
            {submitted && (
              <p className="text-xs text-emerald-300">
                Thanks for the support! The streamer will see your alert instantly.
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
