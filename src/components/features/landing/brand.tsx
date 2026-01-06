import type { ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
// Update standard palette to remove pink reliance for landing
export const brandPalette = {
  pink: "#8B5CF6", // Replaced with Purple
  orange: "#06D6A0", // Replaced with Cyan
  cream: "#0f0919", // Dark bg
  ink: "#0f172a", // Dark text
};

interface BeeLogoProps {
  size?: number;
}

export function BeeLogo({ size = 28 }: BeeLogoProps) {
  const s = size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="drop-shadow-sm"
    >
      <path d="M20 12c8 0 12 8 8 14s-16 6-20 0 4-14 12-14z" fill="#8B5CF6" />
      <path d="M28 18c6-6 16-2 16 6s-10 14-16 8-6-8 0-14z" fill="#8B5CF6" />
      <path d="M18 30c6-6 16-2 16 6s-10 14-16 8-6-8 0-14z" fill="#8B5CF6" />
      <path d="M30 34c8 0 12 8 8 14s-16 6-20 0 4-14 12-14z" fill="#8B5CF6" />
      <ellipse cx="44" cy="32" rx="10" ry="9" fill="#06D6A0" />
      <rect x="36" y="28" width="16" height="4" rx="2" fill="#fff" opacity="0.75" />
      <rect x="36" y="34" width="16" height="4" rx="2" fill="#fff" opacity="0.75" />
      <circle cx="54" cy="26" r="4" fill="#06D6A0" />
      <path d="M52 22c1-3 4-4 6-3" stroke="#06D6A0" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function BrandButton({ className, children, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        "bg-[#7C3AED] text-white border-2 border-white shadow-[4px_4px_0px_0px_#06D6A0] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all hover:opacity-100 font-extrabold tracking-wide rounded-xl",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

interface AccentPillProps {
  children: ReactNode;
  className?: string;
}

export function AccentPill({ children, className }: AccentPillProps) {
  return (
    <Badge
      className={cn(
        "rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-widest text-[#06D6A0] backdrop-blur shadow-sm",
        className,
      )}
    >
      {children}
    </Badge>
  );
}
