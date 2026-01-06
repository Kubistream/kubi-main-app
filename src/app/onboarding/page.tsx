"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import { useWallet } from "@/hooks/use-wallet";
import { useAuth } from "@/providers/auth-provider";

type OnboardingStep = "idle" | "connecting" | "signing" | "verifying" | "navigating" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const { status: authStatus, user, isSigning, signIn, refresh: refreshAuth } = useAuth();
  const { openConnectModal } = useConnectModal();

  const [step, setStep] = useState<OnboardingStep>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isProcessingRef = useRef(false);
  const hasTriedAutoSignIn = useRef(false);

  // Reset error when address changes
  useEffect(() => {
    setErrorMessage(null);
    hasTriedAutoSignIn.current = false;
  }, [address]);

  // Navigate to appropriate dashboard
  const navigateToDashboard = useCallback(async () => {
    setStep("navigating");

    try {
      const me = await fetch("/api/auth/me", { credentials: "include" });
      if (!me.ok) {
        throw new Error("Unable to verify your session.");
      }
      const meData = (await me.json()) as {
        user: { role: "USER" | "STREAMER" | "SUPERADMIN" } | null
      };
      const role = meData.user?.role;

      if (role === "SUPERADMIN") {
        router.push("/dashboard/admin");
        return;
      }

      const response = await fetch("/api/streamers/me", { credentials: "include" });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please try again.");
        }
        throw new Error("Unable to verify your profile.");
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

      setStep("done");
      router.push(isReady ? "/dashboard" : "/dashboard/profile?onboarding=1");
    } catch (err) {
      setStep("idle");
      setErrorMessage(err instanceof Error ? err.message : "Navigation failed. Please try again.");
      isProcessingRef.current = false;
    }
  }, [router]);

  // Auto sign-in after wallet connect
  useEffect(() => {
    if (
      isConnected &&
      authStatus === "unauthenticated" &&
      !isSigning &&
      !isProcessingRef.current &&
      !hasTriedAutoSignIn.current
    ) {
      hasTriedAutoSignIn.current = true;
      isProcessingRef.current = true;
      setStep("signing");
      setErrorMessage(null);

      signIn({ createStreamerProfile: true })
        .then(() => refreshAuth())
        .then(() => {
          setStep("verifying");
          // Directly navigate after successful sign-in
          return navigateToDashboard();
        })
        .catch((err) => {
          setStep("idle");
          setErrorMessage(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
          isProcessingRef.current = false;
          hasTriedAutoSignIn.current = false;
        });
    }
  }, [isConnected, authStatus, isSigning, signIn, refreshAuth, navigateToDashboard]);

  // Auto navigate if already authenticated (e.g., page reload)
  useEffect(() => {
    if (
      authStatus === "authenticated" &&
      user &&
      isConnected &&
      !isProcessingRef.current &&
      step === "idle"
    ) {
      isProcessingRef.current = true;
      navigateToDashboard();
    }
  }, [authStatus, user, isConnected, navigateToDashboard, step]);

  // Single unified action button
  const handleMainAction = useCallback(async () => {
    if (isProcessingRef.current || isSigning) return;

    setErrorMessage(null);

    if (!isConnected) {
      setStep("connecting");
      openConnectModal?.();
      return;
    }

    if (authStatus === "authenticated" && user) {
      isProcessingRef.current = true;
      await navigateToDashboard();
      return;
    }

    // Need to sign in
    isProcessingRef.current = true;
    setStep("signing");

    try {
      await signIn({ createStreamerProfile: true });
      await refreshAuth();
      setStep("verifying");
    } catch (err) {
      setStep("idle");
      setErrorMessage(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
      isProcessingRef.current = false;
    }
  }, [isConnected, authStatus, user, isSigning, openConnectModal, signIn, refreshAuth, navigateToDashboard]);

  // Dynamic button config
  const buttonConfig = useMemo(() => {
    if (step === "done") {
      return { label: "Redirecting...", icon: "check_circle", disabled: true };
    }
    if (step === "navigating") {
      return { label: "Opening Dashboard...", icon: "rocket_launch", disabled: true };
    }
    if (step === "verifying" || (authStatus === "loading" && isConnected)) {
      return { label: "Verifying...", icon: "hourglass_top", disabled: true };
    }
    if (step === "signing" || isSigning) {
      return { label: "Check Your Wallet", icon: "wallet", disabled: true };
    }
    if (step === "connecting") {
      return { label: "Connecting...", icon: "link", disabled: true };
    }
    if (!isConnected) {
      return { label: "Connect Wallet", icon: "wallet", disabled: false };
    }
    if (authStatus === "authenticated" && user) {
      return { label: "Go to Dashboard", icon: "arrow_forward", disabled: false };
    }
    return { label: "Sign In", icon: "login", disabled: false };
  }, [step, authStatus, isConnected, isSigning, user]);

  // Status message
  const statusMessage = useMemo(() => {
    if (step === "done") {
      return "All set! Redirecting you now...";
    }
    if (step === "navigating") {
      return "Opening your dashboard...";
    }
    if (step === "verifying") {
      return "Verifying your session...";
    }
    if (step === "signing" || isSigning) {
      return "Please sign the message in your wallet to continue.";
    }
    if (step === "connecting") {
      return "Connecting your wallet...";
    }
    if (errorMessage) {
      return errorMessage;
    }
    if (!isConnected) {
      return "Connect your wallet to start streaming and earning.";
    }
    if (authStatus === "authenticated" && user) {
      return user.profile.isComplete
        ? "You're all set! Open your dashboard."
        : "Almost there! Complete your profile setup.";
    }
    if (authStatus === "authenticated") {
      return "Signed in! Continue to your dashboard.";
    }
    return "Sign in to access your creator dashboard.";
  }, [step, errorMessage, isConnected, isSigning, authStatus, user]);

  // Progress indicator
  const progressSteps = useMemo(() => {
    const steps = [
      { id: "connect", label: "Connect" },
      { id: "sign", label: "Sign" },
      { id: "go", label: "Go!" },
    ];

    let activeIndex = 0;
    if (isConnected) activeIndex = 1;
    if (authStatus === "authenticated") activeIndex = 2;
    if (step === "navigating" || step === "done") activeIndex = 3;

    return steps.map((s, i) => ({
      ...s,
      status: i < activeIndex ? "complete" : i === activeIndex ? "active" : "pending",
    }));
  }, [isConnected, authStatus, step]);

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-dark to-[#0f141e] pattern-dots-subtle text-white px-4">
      <div className="w-full max-w-lg">
        {/* Card with fun shadow */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent-purple to-secondary rounded-3xl blur-lg opacity-20 animate-pulse"></div>
          <div className="relative bg-surface-card border border-border-dark rounded-3xl p-8 sm:p-10 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <Image
                src="/assets/illustrations/mascot2.png"
                alt="Kubi mascot"
                width={320}
                height={240}
                priority
                className="h-auto w-52 sm:w-64 drop-shadow-lg"
              />

              <h1 className="mt-6 text-4xl sm:text-5xl font-black tracking-tight font-display text-gradient-crypto">
                Welcome to Kubi!
              </h1>

              {/* Progress Steps */}
              <div className="mt-6 flex items-center gap-2">
                {progressSteps.map((pStep, index) => (
                  <div key={pStep.id} className="flex items-center gap-2">
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                        ${pStep.status === "complete"
                          ? "bg-accent-cyan text-black scale-100"
                          : pStep.status === "active"
                            ? "bg-primary text-white scale-110 animate-pulse"
                            : "bg-surface-dark text-gray-500 border border-border-dark scale-90"
                        }
                      `}
                    >
                      {pStep.status === "complete" ? (
                        <span className="material-symbols-outlined text-sm">check</span>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold transition-colors duration-300 ${pStep.status === "pending" ? "text-gray-500" : "text-white"
                        }`}
                    >
                      {pStep.label}
                    </span>
                    {index < progressSteps.length - 1 && (
                      <div
                        className={`w-6 h-0.5 transition-colors duration-300 ${pStep.status === "complete" ? "bg-accent-cyan" : "bg-border-dark"
                          }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <p className="mt-4 max-w-md text-base text-gray-400 font-medium min-h-[3rem] flex items-center justify-center">
                {statusMessage}
              </p>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-4">
              <button
                type="button"
                disabled={buttonConfig.disabled}
                onClick={handleMainAction}
                className={`
                  relative overflow-hidden
                  bg-secondary hover:bg-[#ffe100] text-black 
                  px-8 py-4 rounded-xl 
                  shadow-secondary active:shadow-none active:translate-y-[2px] 
                  font-extrabold text-lg
                  transition-all duration-200 
                  flex items-center gap-3 
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0
                  ${buttonConfig.disabled ? "" : "hover:scale-[1.02] hover:-translate-y-0.5"}
                `}
              >
                {buttonConfig.disabled && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
                )}
                <span className="material-symbols-outlined text-xl">
                  {buttonConfig.icon}
                </span>
                {buttonConfig.label}
              </button>

              {isConnected && address && (
                <p className="text-xs text-accent-cyan font-mono bg-surface-dark px-3 py-1 rounded-full border border-border-dark">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              )}
            </div>

            {errorMessage && (
              <div className="mt-4 flex items-center justify-center gap-2 text-center text-sm font-semibold text-red-500 animate-shake">
                <span className="material-symbols-outlined text-lg">error</span>
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(200%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </section>
  );
}
