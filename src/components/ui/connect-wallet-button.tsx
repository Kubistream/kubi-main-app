"use client";

import Image from "next/image";

import { ConnectButton } from "@rainbow-me/rainbowkit";

import { useAuth } from "@/providers/auth-provider";

interface ConnectWalletButtonProps {
  label?: string;
}

export function ConnectWalletButton({ label }: ConnectWalletButtonProps) {
  const { status, isSigning } = useAuth();

  const computedLabel = (() => {
    if (label) return label;
    if (isSigning) return "Check your wallet";
    if (status === "authenticated") return undefined;
    return "Connect wallet";
  })();

  return (
    <ConnectButton.Custom>
      {({
        account,
        authenticationStatus,
        chain,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready && account && chain && (!authenticationStatus || authenticationStatus === "authenticated");

        const gradientButtonClass =
          "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#FFA24C] via-[#FF5F74] to-[#FF3D86] px-6 py-2 text-sm font-semibold text-white shadow-[0_14px_24px_-12px_rgba(255,61,134,0.5)] transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[0_18px_32px_-12px_rgba(255,61,134,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5F74]";

        const secondaryButtonClass =
          "inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200/80";

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {!connected && (
              <button type="button" onClick={openConnectModal} className={gradientButtonClass}>
                {computedLabel ?? "Connect wallet"}
              </button>
            )}

            {connected && chain?.unsupported && (
              <button type="button" onClick={openChainModal} className={gradientButtonClass}>
                Switch network
              </button>
            )}

            {connected && !chain?.unsupported && (
              <div className="flex items-center gap-2">
                <button type="button" onClick={openChainModal} className={secondaryButtonClass}>
                  {chain.hasIcon && chain.iconUrl && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/70">
                      <Image
                        alt={chain.name ?? "Chain icon"}
                        src={chain.iconUrl}
                        width={14}
                        height={14}
                        className="h-3.5 w-3.5"
                        unoptimized
                      />
                    </span>
                  )}
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-400">Network</span>
                  <span>{chain.name ?? "Connected"}</span>
                </button>
                <button type="button" onClick={openAccountModal} className={gradientButtonClass}>
                  {account.displayName}
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
