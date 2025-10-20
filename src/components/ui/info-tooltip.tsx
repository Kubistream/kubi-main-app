"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type InfoTooltipProps = {
  content: React.ReactNode;
  label?: React.ReactNode;
  className?: string;
};

export function InfoTooltip({ content, label = "ⓘ", className }: InfoTooltipProps) {
  const id = React.useId();
  return (
    <span
      className={cn(
        "relative inline-flex items-center align-middle group focus:outline-none",
        className,
      )}
      tabIndex={0}
      aria-describedby={id}
    >
      <span className="cursor-help text-xs text-slate-500 select-none" aria-hidden>
        {label}
      </span>
      <span
        role="tooltip"
        id={id}
        className={cn(
          "pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-full",
          "mb-2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg",
          "opacity-0 transition-opacity duration-150 z-50",
          "group-hover:opacity-100 group-focus-within:opacity-100",
        )}
      >
        {content}
      </span>
    </span>
  );
}

