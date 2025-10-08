import * as React from "react";

import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  fallback?: string;
}

export function Avatar({ className, fallback, children, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full bg-indigo-200 text-base font-semibold text-indigo-900",
        className,
      )}
      {...props}
    >
      {children ?? fallback}
    </div>
  );
}
