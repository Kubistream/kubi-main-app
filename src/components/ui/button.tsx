"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "cyan";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-secondary text-black shadow-[0_0_20px_rgba(243,224,59,0.3)] hover:bg-[#ffe100] hover:shadow-[0_0_30px_rgba(243,224,59,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all",
  secondary:
    "bg-primary text-white shadow-[0_0_20px_rgba(98,58,214,0.3)] hover:bg-[#7048E8] hover:shadow-[0_0_30px_rgba(98,58,214,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all",
  outline:
    "border border-border-dark bg-surface-dark text-gray-300 hover:bg-white/10 hover:text-white transition-all",
  ghost:
    "text-gray-400 hover:bg-white/5 hover:text-white transition-colors",
  cyan:
    "bg-accent-cyan text-black shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:brightness-110 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-11 rounded-xl px-6 text-sm font-bold",
  sm: "h-9 rounded-xl px-4 text-sm font-bold",
  lg: "h-12 rounded-xl px-8 text-base font-bold",
  icon: "h-10 w-10 rounded-xl",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

export const buttonVariants = ({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) =>
  cn(
    "inline-flex items-center justify-center whitespace-nowrap font-medium transition focus-visible:outline focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "default", size = "default", asChild = false, children, ...props },
    ref,
  ) => {
    const combined = buttonVariants({ variant, size, className });

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        className: cn(child.props.className, combined),
      });
    }

    return (
      <button ref={ref} className={combined} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
