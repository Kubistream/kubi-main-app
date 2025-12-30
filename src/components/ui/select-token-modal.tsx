"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Token {
  symbol: string;
  name: string;
  address: string;
  logoURI?: string;
  decimals?: number;
}

interface SelectTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: Token) => void;
  balances?: { [address: string]: number };
  tokens?: Token[];
}

// Stable empty fallbacks to avoid new identity each render
const EMPTY_BALANCES: { [address: string]: number } = Object.freeze({});
const EMPTY_TOKENS: ReadonlyArray<Token> = Object.freeze([]);

export function SelectTokenModal({ isOpen, onClose, onSelectToken, balances, tokens: propTokens }: SelectTokenModalProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [search, setSearch] = useState("");

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

    fetch("/api/tokens")
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
  // localBalances is memoized above; no state updates here to avoid re-render loops

  const filtered = (tokens || []).filter(
    (t) =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Search token or paste address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
        />

        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {filtered.map((token) => (
            <div
              key={token.address}
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

                {localBalances[token.address.toLowerCase()] === undefined
                  ? "–"
                  : Number(localBalances[token.address.toLowerCase()] || 0).toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}
              </span>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">Loading...</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
