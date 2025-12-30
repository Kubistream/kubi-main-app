"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  variant?: "cyan" | "yellow" | "purple";
}

/**
 * A lightweight, accessible toggle switch styled to match CryptoStream dark theme.
 * Does not rely on Radix; uses a button with role="switch".
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, disabled, onCheckedChange, onClick, variant = "cyan", ...props }, ref) => {
    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      if (disabled) return;
      onCheckedChange?.(!checked);
      onClick?.(e);
    };

    const variantColors = {
      cyan: "bg-accent-cyan",
      yellow: "bg-secondary",
      purple: "bg-primary",
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
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50",
          checked ? `${variantColors[variant]} border-transparent` : "bg-surface-dark border-border-dark",
          className,
        )}
        {...props}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    );
  },
);

Switch.displayName = "Switch";
