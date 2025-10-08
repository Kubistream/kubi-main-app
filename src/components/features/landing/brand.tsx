import type { ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { brandPalette } from "@/constants/theme";

export { brandPalette };

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
      <path d="M20 12c8 0 12 8 8 14s-16 6-20 0 4-14 12-14z" fill={brandPalette.pink} />
      <path d="M28 18c6-6 16-2 16 6s-10 14-16 8-6-8 0-14z" fill={brandPalette.pink} />
      <path d="M18 30c6-6 16-2 16 6s-10 14-16 8-6-8 0-14z" fill={brandPalette.pink} />
      <path d="M30 34c8 0 12 8 8 14s-16 6-20 0 4-14 12-14z" fill={brandPalette.pink} />
      <ellipse cx="44" cy="32" rx="10" ry="9" fill={brandPalette.orange} />
      <rect x="36" y="28" width="16" height="4" rx="2" fill="#fff" opacity="0.75" />
      <rect x="36" y="34" width="16" height="4" rx="2" fill="#fff" opacity="0.75" />
      <circle cx="54" cy="26" r="4" fill={brandPalette.orange} />
      <path d="M52 22c1-3 4-4 6-3" stroke={brandPalette.orange} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function BrandButton({ className, children, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        "bg-gradient-to-r from-[#FF3D86] to-[#FFA24C] text-white shadow-lg shadow-[#FF3D8644] hover:opacity-95",
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
        "rounded-full border border-white/50 bg-white/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-rose-500 backdrop-blur",
        className,
      )}
    >
      {children}
    </Badge>
  );
}
