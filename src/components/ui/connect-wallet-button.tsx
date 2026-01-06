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

        const primaryButtonClass =
          "inline-flex items-center justify-center rounded-xl bg-secondary px-5 py-2.5 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(243,224,59,0.3)] transition-all duration-150 hover:bg-[#ffe100] hover:shadow-[0_0_30px_rgba(243,224,59,0.5)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary";

        const secondaryButtonClass =
          "hidden sm:inline-flex items-center gap-2 rounded-xl border border-border-dark bg-surface-dark/50 px-4 py-2 text-sm font-bold text-white transition hover:bg-surface-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

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
              <button type="button" onClick={openConnectModal} className={primaryButtonClass}>
                {computedLabel ?? "Connect wallet"}
              </button>
            )}

            {connected && chain?.unsupported && (
              <button type="button" onClick={openChainModal} className={primaryButtonClass}>
                Switch network
              </button>
            )}

            {connected && !chain?.unsupported && (
              <div className="flex items-center gap-2">
                <button type="button" onClick={openChainModal} className={secondaryButtonClass}>
                  {chain.hasIcon && chain.iconUrl && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
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
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-accent-cyan">Network</span>
                  <span>{chain.name ?? "Connected"}</span>
                </button>
                <button type="button" onClick={openAccountModal} className={primaryButtonClass}>
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
