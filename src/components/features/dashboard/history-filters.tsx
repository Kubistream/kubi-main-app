"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

type Option = {
  value: string;
  label: string;
};

interface HistoryFiltersProps {
  statusOptions: Option[];
  tokenOptions: Option[];
  resetPath: string;
}

export function HistoryFilters({ statusOptions, tokenOptions, resetPath }: HistoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const statusParam = searchParams?.get("status") ?? "all";
  const tokenParam = searchParams?.get("token") ?? "all";

  const [status, setStatus] = useState(statusParam);
  const [token, setToken] = useState(tokenParam);

  useEffect(() => {
    setStatus(statusParam);
  }, [statusParam]);

  useEffect(() => {
    setToken(tokenParam);
  }, [tokenParam]);

  const updateQuery = (nextStatus: string, nextToken: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("page");
    if (!nextStatus || nextStatus === "all") {
      params.delete("status");
    } else {
      params.set("status", nextStatus);
    }
    if (!nextToken || nextToken === "all") {
      params.delete("token");
    } else {
      params.set("token", nextToken);
    }
    const query = params.toString();
    router.replace(query ? `${resetPath}?${query}` : resetPath, { scroll: false });
    router.refresh();
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    startTransition(() => updateQuery(value, token));
  };

  const handleTokenChange = (value: string) => {
    setToken(value);
    startTransition(() => updateQuery(status, value));
  };

  const handleReset = () => {
    setStatus("all");
    setToken("all");
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.delete("status");
      params.delete("token");
      params.delete("page");
      const query = params.toString();
      router.replace(query ? `${resetPath}?${query}` : resetPath, { scroll: false });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Status</span>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(event) => handleStatusChange(event.target.value)}
            className="h-10 rounded-full border border-slate-200 bg-white px-4 pr-8 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Token</span>
          <select
            id="token"
            name="token"
            value={token}
            onChange={(event) => handleTokenChange(event.target.value)}
            className="h-10 rounded-full border border-slate-200 bg-white px-4 pr-8 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            {tokenOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-white px-5 py-2 text-sm font-semibold text-sky-600 shadow-sm transition hover:bg-sky-50 disabled:opacity-60"
        >
          Reset filters
        </Button>
      </div>
    </div>
  );
}
