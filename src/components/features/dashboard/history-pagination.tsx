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
    <div className="flex flex-col gap-3 rounded-2xl border border-border-dark bg-surface-card px-4 py-3 text-sm shadow-xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
        <span>Rows</span>
        <select
          value={String(pageSize)}
          onChange={(event) => changePageSize(Number.parseInt(event.target.value, 10))}
          className="h-9 rounded-xl border border-border-dark bg-surface-dark px-3 text-xs font-semibold text-white shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          disabled={isPending}
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option} className="bg-surface-dark text-white">
              {option}
            </option>
          ))}
        </select>
        <span className="text-gray-600">per page</span>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
        <span>Page</span>
        <span className="rounded-lg bg-primary/20 px-3 py-1 text-primary font-bold">{currentPage}</span>
        <span className="text-gray-600">of</span>
        <span className="rounded-lg bg-surface-dark px-3 py-1 text-white">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disablePrev}
          onClick={() => goToPage(currentPage - 1)}
          className="inline-flex items-center gap-2 rounded-xl border border-border-dark bg-surface-dark px-4 py-2 text-sm font-semibold text-gray-300 shadow-sm transition hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disableNext}
          onClick={() => goToPage(currentPage + 1)}
          className="inline-flex items-center gap-2 rounded-xl border border-border-dark bg-surface-dark px-4 py-2 text-sm font-semibold text-gray-300 shadow-sm transition hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
