"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function AutoYieldBadge({
  available,
  compact = false,
  className,
  label,
}: {
  available: boolean;
  compact?: boolean;
  className?: string;
  label?: string;
}) {
  const base = compact
    ? "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
    : "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em]";

  const success = "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
  const danger = "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";

  const Icon = available ? CheckCircle2 : XCircle;

  return (
    <span className={cn(base, available ? success : danger, className)}>
      <Icon className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden="true" />
      {label ?? (available ? "Auto Yield Available" : "Auto Yield Not Available")}
    </span>
  );
}

