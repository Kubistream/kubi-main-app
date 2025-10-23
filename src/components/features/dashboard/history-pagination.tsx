"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface HistoryPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  defaultPageSize: number;
  resetPath: string;
}

export function HistoryPagination({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions,
  defaultPageSize,
  resetPath,
}: HistoryPaginationProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const goToPage = (targetPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (targetPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(targetPage));
    }
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${resetPath}?${query}` : resetPath, { scroll: false });
      router.refresh();
    });
  };

  const changePageSize = (value: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (value === pageSize && params.get("pageSize")) {
      // If nothing changes, no-op
      return;
    }
    if (value === defaultPageSize) {
      params.delete("pageSize");
    } else {
      params.set("pageSize", String(value));
    }
    params.delete("page");
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${resetPath}?${query}` : resetPath, { scroll: false });
      router.refresh();
    });
  };

  const disablePrev = currentPage <= 1 || isPending || totalPages <= 1;
  const disableNext = currentPage >= totalPages || isPending || totalPages <= 1;

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-white/70 bg-white/95 px-4 py-3 text-sm shadow-[0_18px_42px_-24px_rgba(8,47,73,0.35)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        <span>Rows</span>
        <select
          value={String(pageSize)}
          onChange={(event) => changePageSize(Number.parseInt(event.target.value, 10))}
          className="h-9 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          disabled={isPending}
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="text-slate-400">per page</span>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        <span>Page</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{currentPage}</span>
        <span className="text-slate-400">of</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disablePrev}
          onClick={() => goToPage(currentPage - 1)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disableNext}
          onClick={() => goToPage(currentPage + 1)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
