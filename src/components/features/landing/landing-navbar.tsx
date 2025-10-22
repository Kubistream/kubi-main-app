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
      className="sticky top-0 z-40 border-b border-rose-200/70 backdrop-blur"
      style={{ backgroundColor: `${brandPalette.cream}CC` }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="Kubi Home">
            <Image src="/assets/brand/logo2.png" alt="Kubi" width={100} height={100} />
          </Link>
          <AccentPill className="hidden sm:inline-flex">
            <span className="flex items-center gap-1 text-rose-500">
              Beta
            </span>
          </AccentPill>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-slate-900"
              onClick={handleNavItemClick(link.href)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {/* <Badge className="rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-rose-500">
            Role · {roleLabel}
          </Badge> */}
          <button
            type="button"
            onClick={onLaunch}
            disabled={disabled}
            className="inline-flex h-11 items-center rounded-full border border-rose-200 px-5 text-base font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {ctaLabel}
          </button>
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
          mobileOpen
            ? "max-h-[calc(100vh-var(--landing-nav-height,0px))] overflow-y-auto opacity-100"
            : "max-h-0 overflow-hidden opacity-0",
        )}
        style={{ backgroundColor: `${brandPalette.cream}F2` }}
      >
        <div className="flex flex-col gap-4 px-6 py-6 text-sm text-slate-700">
          <Badge className="w-max rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-rose-500">
            Role · {roleLabel}
          </Badge>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base font-medium"
              onClick={handleNavItemClick(link.href)}
            >
              {link.label}
            </Link>
          ))}
          <BrandButton
            className="h-12 w-full justify-center text-base"
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
