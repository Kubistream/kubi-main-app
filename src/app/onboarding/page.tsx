"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
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
      const needsRoleUpgrade =
        authStatus === "authenticated" && user?.role === "USER";

      if (authStatus !== "authenticated" || !user || needsRoleUpgrade) {
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
        onboardingComplete?: boolean;
        hasPrimaryToken?: boolean;
      };

      const isReady =
        typeof data.onboardingComplete === "boolean"
          ? data.onboardingComplete
          : Boolean(data.profile?.isComplete) && Boolean(data.hasPrimaryToken);

      const destination = isReady ? "/dashboard" : "/dashboard/profile?onboarding=1";
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
      if (user.role === "USER") {
        return "Ready to upgrade your account. Continue to become a streamer.";
      }
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
    <section className="flex items-center justify-center text-slate-900">
      <Card className="mx-auto w-full max-w-2xl border-white/70 bg-white/95 p-0 shadow-xl shadow-rose-200/40">
        <CardContent className="space-y-6 p-8 sm:p-10">
          <div className="flex flex-col items-center text-center">
            <Image
              src="/assets/illustrations/mascot2.png"
              alt="Kubi mascot"
              width={320}
              height={240}
              priority
              className="h-auto w-52 sm:w-64"
            />

            <h1
              className="font-modak modak-readable modak-stroke-warm modak-stroke-strong mt-4 bg-gradient-to-r from-[#FFA24C] via-[#FF5F74] to-[#FF3D86] bg-clip-text text-4xl tracking-wider text-transparent drop-shadow-[0_2px_1px_rgba(255,61,134,0.25)] sm:text-5xl"
            >
              Welcome to Kubi!
            </h1>

            <p className="mt-4 max-w-md text-balance text-base text-slate-600 sm:text-lg">
              {statusMessage}
            </p>
          </div>

          <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {showConnectButton && (
              <ConnectWalletButton label="Connect Wallet" />
            )}

            <Button
              type="button"
              variant="secondary"
              disabled={!canProceed}
              onClick={handleGoToDashboard}
              className="rounded-full border border-rose-200/70 bg-white/90 px-6 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
            >
              Go to Dashboard
            </Button>
          </div>

          {errorMessage && (
            <p className="text-center text-xs font-medium text-rose-500">{errorMessage}</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
