import * as React from "react";

import { cn } from "@/lib/utils";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-dark bg-surface-card p-6 shadow-xl relative overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn("space-y-2 mb-6", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("space-y-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardProps) {
  return <div className={cn("flex items-center justify-between mt-6 pt-6 border-t border-border-dark", className)} {...props} />;
}

export function CardTitle({ className, ...props }: CardProps) {
  return (
    <h3
      className={cn("text-lg font-black text-white font-display", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: CardProps) {
  return (
    <p className={cn("text-sm leading-relaxed text-gray-400", className)} {...props} />
  );
}
