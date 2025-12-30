import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-border-dark bg-surface-dark px-4 py-3 text-sm text-white font-medium transition placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
