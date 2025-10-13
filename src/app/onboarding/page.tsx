"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";
import { useWallet } from "@/hooks/use-wallet";
import { useAuth } from "@/providers/auth-provider";

export default function OnboardingPage() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  // On onboarding we intentionally do not auto-trigger SIWE sign-in.
  // Do not destructure `signIn` here to avoid accidental use.
  const { status: authStatus, user, isSigning, signIn, refresh: refreshAuth } = useAuth();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setErrorMessage(null);
  }, [address]);

  const handleGoToDashboard = async () => {
    if (!isConnected || isSigning || isNavigating) return;
    setIsNavigating(true);
    setErrorMessage(null);

    try {
      if (authStatus !== "authenticated" || !user) {
        // Promote to streamer on first-time sign-in from onboarding
        await signIn({ createStreamerProfile: true });
        await refreshAuth();
      }

      // Decide destination based on latest server-backed profile.
      // Only navigate when the profile endpoint confirms an authorised session.
      const response = await fetch("/api/streamers/me", { credentials: "include" });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("You need to sign the message to continue.");
        }
        throw new Error("Unable to verify your session. Please try again.");
      }

      const data = (await response.json()) as {
        profile: { isComplete: boolean } | null;
      };

      const destination = data.profile?.isComplete ? "/dashboard" : "/dashboard/profile?onboarding=1";
      router.push(destination);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to proceed. Please try again.");
    } finally {
      setIsNavigating(false);
    }
  };

  const statusMessage = useMemo(() => {
    if (!isConnected) {
      return "Connect a wallet to begin your streamer onboarding.";
    }
    if (isSigning) {
      return "Check your wallet to sign the message.";
    }
    if (authStatus === "loading") {
      return "Verifying your session...";
    }
    if (authStatus === "authenticated") {
      if (!user) return "You’re signed in. Continue below.";
      return user.profile.isComplete
        ? "You’re signed in. Open your dashboard."
        : "You’re signed in. Finish your profile setup.";
    }
    if (errorMessage) {
      return errorMessage;
    }
    return "Getting ready to launch your creator dashboard.";
  }, [authStatus, errorMessage, isConnected, isSigning, user]);

  const showConnectButton = !isConnected || authStatus !== "authenticated";
  const canProceed = isConnected && !isSigning && authStatus !== "loading" && !isNavigating;

  return (
    <section className="space-y-10 text-slate-900">
      <div className="rounded-3xl border border-white/60 bg-white/80 px-6 py-8 shadow-[0_20px_40px_-30px_rgba(47,42,44,0.35)] sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-400">Onboarding</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Bring your creator brand on-chain</h2>
        <p className="mt-4 max-w-2xl text-sm text-slate-600 sm:text-base">
          Connect your wallet to personalise Kubi with your creator identity. Once verified, we’ll take you straight to your
          dashboard or profile setup so you can start receiving on-chain support.
        </p>
      </div>

      <Card className="border-white/70 bg-white/95 shadow-xl shadow-rose-200/40">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-slate-900">
            Launch your streamer experience
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            A quick wallet signature lets us securely recognise you as a creator. New streamers jump into profile setup; returning ones land in the dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-rose-100 p-8 text-center">
            <p className="max-w-sm text-sm text-slate-600">{statusMessage}</p>

            {showConnectButton && (
              <ConnectWalletButton label="Connect wallet" />
            )}

            <Button
              type="button"
              className="mt-2"
              disabled={!canProceed}
              onClick={handleGoToDashboard}
            >
              Go to dashboard
            </Button>
          </div>

          {errorMessage && (
            <p className="text-center text-xs font-medium text-rose-500">
              {errorMessage}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
