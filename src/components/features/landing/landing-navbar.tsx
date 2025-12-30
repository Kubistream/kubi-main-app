"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";

import { AccentPill, BrandButton, brandPalette } from "./brand";
import { LANDING_GUIDES_SECTION_ID } from "./landing-hero";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLaunchApp } from "@/hooks/use-launch-app";

interface LandingNavbarProps {
  roleLabel: string;
}

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: `#${LANDING_GUIDES_SECTION_ID}`, label: "Guides" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNavbar({ roleLabel }: LandingNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const { onLaunch, label: ctaLabel, disabled } = useLaunchApp();

  const scrollToSection = (hash: string) => {
    const targetId = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!targetId) return;
    const section = document.getElementById(targetId);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNavItemClick = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith("#")) {
      event.preventDefault();
      scrollToSection(href);
    }
    setMobileOpen(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateNavHeight = () => {
      const height = headerRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty("--landing-nav-height", `${height}px`);
    };

    updateNavHeight();
    window.addEventListener("resize", updateNavHeight);

    return () => {
      window.removeEventListener("resize", updateNavHeight);
      document.documentElement.style.removeProperty("--landing-nav-height");
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const frame = window.requestAnimationFrame(() => {
      const height = headerRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty("--landing-nav-height", `${height}px`);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [mobileOpen]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-white/10 bg-[#0f0919]/80 backdrop-blur-md transition-all"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="Kubi Home">
            <Image src="/assets/brand/logo2.png" alt="Kubi" width={90} height={90} className="w-auto h-8 md:h-10" />
          </Link>
          <AccentPill className="hidden sm:inline-flex">
            Beta
          </AccentPill>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-bold text-slate-400 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-[var(--color-accent-cyan)]"
              onClick={handleNavItemClick(link.href)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={onLaunch}
            disabled={disabled}
            className="inline-flex h-10 items-center rounded-lg border-2 border-[#7C3AED] px-6 text-sm font-bold text-[#7C3AED] transition-all hover:bg-[#7C3AED] hover:text-white shadow-[2px_2px_0px_0px_#7C3AED] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
          >
            {ctaLabel}
          </button>
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-xl font-bold text-white transition hover:bg-white/10 md:hidden"
          type="button"
          onClick={() => setMobileOpen((previous) => !previous)}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-white/10 bg-[#0f0919] transition-all duration-200 md:hidden",
          mobileOpen
            ? "max-h-[calc(100vh-var(--landing-nav-height,0px))] overflow-y-auto opacity-100"
            : "max-h-0 overflow-hidden opacity-0",
        )}
      >
        <div className="flex flex-col gap-6 px-6 py-8 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#F778BA]">Role: {roleLabel}</span>
          </div>

          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-lg font-bold hover:text-white"
                onClick={handleNavItemClick(link.href)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <BrandButton
            className="h-12 w-full justify-center text-base mt-2"
            type="button"
            disabled={disabled}
            onClick={() => {
              onLaunch();
              setMobileOpen(false);
            }}
          >
            {ctaLabel}
          </BrandButton>
        </div>
      </div>
    </header>
  );
}
