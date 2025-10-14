"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * A lightweight, accessible toggle switch styled to match this project's UI.
 * Does not rely on Radix; uses a button with role="switch".
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, disabled, onCheckedChange, onClick, ...props }, ref) => {
    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      if (disabled) return;
      onCheckedChange?.(!checked);
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        data-state={checked ? "on" : "off"}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "peer inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-rose-500" : "bg-slate-200",
          className,
        )}
        {...props}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </button>
    );
  },
);

Switch.displayName = "Switch";

