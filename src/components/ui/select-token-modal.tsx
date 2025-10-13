"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Token {
  symbol: string;
  name: string;
  address: string;
  logoURI?: string;
}

interface SelectTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: Token) => void;
  balances?: { [address: string]: number };
}

export function SelectTokenModal({ isOpen, onClose, onSelectToken, balances = {} }: SelectTokenModalProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [search, setSearch] = useState("");
  const [localBalances, setLocalBalances] = useState<{ [address: string]: number }>({});

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/tokens")
        .then((res) => res.json())
        .then((data) => {
        let list: Token[] = [];

        if (Array.isArray(data)) {
            list = data;
        } else if (data && Array.isArray(data.tokens)) {
            list = data.tokens;
        }

        // normalize address ke lowercase supaya cocok sama balances
        const normalized = list.map((t) => ({
            ...t,
            address: t.address.toLowerCase(),
        }));

        setTokens(normalized);
        })
        .catch(() => setTokens([]));
    }, [isOpen]);

  useEffect(() => {
    // Normalize all keys in balances to lowercase for consistent access
    const normalizedBalances: { [address: string]: number } = {};
    for (const addr in balances) {
      if (Object.prototype.hasOwnProperty.call(balances, addr)) {
        normalizedBalances[addr.toLowerCase()] = balances[addr];
      }
    }
    setLocalBalances(normalizedBalances);
    console.log("✅ Updated localBalances:", normalizedBalances);
  }, [balances]);

  const filtered = (tokens || []).filter(
    (t) =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md text-slate-900">
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
              className="flex items-center gap-3 p-2 rounded-md hover:bg-rose-100 cursor-pointer transition-colors duration-300"
              onClick={() => {
                onSelectToken(token);
                onClose();
              }}
            >
              <img
                src={token.logoURI || "/default-token.png"}
                alt={token.symbol}
                className="w-8 h-8 rounded-full border border-gray-300 hover:shadow-md transition-shadow duration-300"
              />
              <div className="flex flex-col flex-grow">
                <span className="font-semibold text-base text-gray-900">{token.symbol}</span>
                <span
                  className="text-sm text-gray-700 truncate max-w-[180px]"
                  title={token.address}
                >
                  {token.address.slice(0, 6)}...{token.address.slice(-4)}
                </span>
              </div>
              <span className="text-sm font-mono ml-auto min-w-[60px] text-right text-slate-800 dark:text-slate-900">
                
              {localBalances[token.address.toLowerCase()] === undefined
                ? "–"
                : Number(localBalances[token.address.toLowerCase()] || 0).toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}
              </span>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">Loading...</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}