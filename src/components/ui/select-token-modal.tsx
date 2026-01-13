"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Chain configurations
const CHAINS: Record<number, {
  name: string;
  shortName: string;
  color: string;
  iconUrl: string;
}> = {
  84532: {
    name: "Base Sepolia",
    shortName: "Base",
    color: "from-[#0052FF] to-[#003DD9]",
    iconUrl: "https://avatars.githubusercontent.com/u/108554348?s=200&v=4",
  },
  5003: {
    name: "Mantle Sepolia",
    shortName: "Mantle",
    color: "from-[#65B3AE] to-[#4A9591]",
    iconUrl: "https://cryptologos.cc/logos/mantle-mnt-logo.png?v=040",
  },
};

const CHAIN_IDS = [5003, 84532];

interface Token {
  symbol: string;
  name: string;
  address: string;
  logoURI?: string;
  decimals?: number;
  chainId?: number;
}

interface SelectTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: Token) => void;
  balances?: { [address: string]: number };
  tokens?: Token[];
  defaultChainId?: number;
}

// Stable empty fallbacks to avoid new identity each render
const EMPTY_BALANCES: { [address: string]: number } = Object.freeze({});
const EMPTY_TOKENS: ReadonlyArray<Token> = Object.freeze([]);

export function SelectTokenModal({
  isOpen,
  onClose,
  onSelectToken,
  balances,
  tokens: propTokens,
  defaultChainId = 5003
}: SelectTokenModalProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [search, setSearch] = useState("");
  const [activeChain, setActiveChain] = useState<number>(defaultChainId);

  // Ensure stable reference when balances is undefined
  const stableBalances = balances ?? EMPTY_BALANCES;
  const localBalances = useMemo(() => {
    const normalized: { [address: string]: number } = {};
    for (const addr in stableBalances) {
      if (Object.prototype.hasOwnProperty.call(stableBalances, addr)) {
        normalized[addr.toLowerCase()] = stableBalances[addr];
      }
    }
    return normalized;
  }, [stableBalances]);

  useEffect(() => {
    if (!isOpen) return;

    const providedTokens = propTokens ?? EMPTY_TOKENS;
    if (providedTokens.length > 0) {
      const normalized = providedTokens.map((t) => ({
        ...t,
        address: t.address.toLowerCase(),
      }));
      setTokens(normalized);
      return;
    }

    // Fetch only non-representative tokens (base tokens, not yield tokens)
    fetch("/api/tokens?skipWhitelist=true&representative=false")
      .then((res) => res.json())
      .then((data) => {
        let list: Token[] = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.tokens)) list = data.tokens;
        const normalized = list.map((t) => ({
          ...t,
          address: t.address.toLowerCase(),
        }));
        setTokens(normalized);
      })
      .catch(() => setTokens([]));
  }, [isOpen, propTokens]);

  // Filter tokens by search and active chain
  const filtered = useMemo(() => {
    return (tokens || []).filter(
      (t) =>
        t.chainId === activeChain &&
        (t.symbol.toLowerCase().includes(search.toLowerCase()) ||
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.address.toLowerCase().includes(search.toLowerCase()))
    );
  }, [tokens, search, activeChain]);

  const activeChainConfig = CHAINS[activeChain];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
        </DialogHeader>

        {/* Chain Tabs */}
        <div className="flex gap-1 p-1 bg-[var(--color-surface-card)] border border-[var(--color-border-dark)] rounded-xl mb-3">
          {CHAIN_IDS.map((chainId) => {
            const chain = CHAINS[chainId];
            const isActive = activeChain === chainId;
            return (
              <button
                key={chainId}
                type="button"
                onClick={() => setActiveChain(chainId)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200
                  ${isActive
                    ? `bg-gradient-to-r ${chain.color} text-white shadow-md`
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <img
                  src={chain.iconUrl}
                  alt={chain.shortName}
                  className={`w-5 h-5 rounded-full ${isActive ? '' : 'opacity-60'}`}
                />
                <span>{chain.shortName}</span>
              </button>
            );
          })}
        </div>

        <Input
          placeholder="Search token or paste address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
        />

        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {filtered.map((token) => (
            <div
              key={`${token.chainId}-${token.address}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-border-dark bg-surface-dark hover:bg-white/10 hover:border-primary cursor-pointer transition-colors duration-200"
              onClick={() => {
                onSelectToken(token);
                onClose();
              }}
            >
              <img
                src={token.logoURI || "/default-token.png"}
                alt={token.symbol}
                className="w-8 h-8 rounded-full border border-border-dark"
              />
              <div className="flex flex-col flex-grow">
                <span className="font-bold text-base text-white">{token.symbol}</span>
                <span
                  className="text-sm text-gray-500 truncate max-w-[180px] font-mono"
                  title={token.address}
                >
                  {token.address.slice(0, 6)}...{token.address.slice(-4)}
                </span>
              </div>
              <span className="text-sm font-mono ml-auto min-w-[60px] text-right text-accent-cyan font-bold">
                {(() => {
                  // Balance key includes chainId to differentiate same token across chains
                  const balanceKey = `${token.chainId}-${token.address.toLowerCase()}`;
                  const balance = localBalances[balanceKey];
                  return balance === undefined
                    ? "–"
                    : Number(balance || 0).toLocaleString(undefined, {
                      maximumFractionDigits: 4,
                    });
                })()}
              </span>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                {tokens.length === 0 ? "Loading..." : `No tokens found on ${activeChainConfig?.shortName || 'this network'}`}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
