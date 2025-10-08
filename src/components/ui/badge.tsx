import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-transparent bg-rose-100 text-rose-600",
  secondary: "border-transparent bg-indigo-100 text-indigo-700",
  outline: "border border-slate-200 text-slate-600",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em]",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
