"use client";

import { useState } from "react";
import Link from "next/link";

import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";
import { AccentPill, BeeLogo, BrandButton, brandPalette } from "./brand";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LandingNavbarProps {
  roleLabel: string;
}

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNavbar({ roleLabel }: LandingNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 border-b border-rose-200/70 backdrop-blur"
      style={{ backgroundColor: `${brandPalette.cream}CC` }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <BeeLogo size={30} />
          <span className="text-xl font-black tracking-tight" style={{ color: brandPalette.ink }}>
            Kubi
          </span>
          <AccentPill className="hidden sm:inline-flex">
            <span className="flex items-center gap-1 text-rose-500">
              Beta
            </span>
          </AccentPill>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Badge className="rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-rose-500">
            Role · {roleLabel}
          </Badge>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-full border border-rose-200 px-5 text-sm font-medium text-rose-500 transition hover:bg-rose-100 hover:text-rose-600"
          >
            Dashboard
          </Link>
          <ConnectWalletButton label="Connect" />
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-white/80 text-sm font-medium text-rose-500 transition hover:bg-rose-100 hover:text-rose-600 md:hidden"
          type="button"
          onClick={() => setMobileOpen((previous) => !previous)}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-rose-200/70 transition-all duration-200 md:hidden",
          mobileOpen ? "max-h-64 opacity-100" : "max-h-0 overflow-hidden opacity-0",
        )}
        style={{ backgroundColor: `${brandPalette.cream}F2` }}
      >
        <div className="flex flex-col gap-4 px-6 py-4 text-sm text-slate-700">
          <Badge className="w-max rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-rose-500">
            Role · {roleLabel}
          </Badge>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-base font-medium" onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          ))}
          <BrandButton className="h-11 justify-center" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </BrandButton>
          <ConnectWalletButton label="Connect" />
        </div>
      </div>
    </header>
  );
}
