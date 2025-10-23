"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ToggleSize = "sm" | "default";

export interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  size?: ToggleSize;
}

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, pressed = false, disabled, onPressedChange, onClick, size = "default", children, ...props }, ref) => {
    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      if (disabled) return;
      onPressedChange?.(!pressed);
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={pressed}
        data-state={pressed ? "on" : "off"}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-full border text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:pointer-events-none disabled:opacity-50",
          size === "sm" ? "h-9 px-3" : "h-10 px-4",
          pressed
            ? "border-rose-500 bg-rose-500 text-white hover:bg-rose-500"
            : "border-slate-200 bg-white text-slate-800 hover:bg-rose-50",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Toggle.displayName = "Toggle";

