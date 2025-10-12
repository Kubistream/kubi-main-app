import type { ReactNode } from "react";

import Link from "next/link";
import Image from "next/image";

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
];

const resourceLinks = ["Docs & SDK", "Guides", "Brand assets"];
const communityLinks = ["Discord", "Twitter/X", "GitHub"];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/60 bg-white/80">
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center">
              <Image src="/assets/brand/logo2.png" alt="Kubi logo" width={150} height={150} />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Creator-friendly on-chain donations. Built for diverse communities.
            </p>
          </div>

          <FooterColumn title="Product">
            {productLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-sm text-slate-600 transition hover:text-slate-900">
                {link.label}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title="Resources">
            {resourceLinks.map((item) => (
              <span key={item} className="text-sm text-slate-600">
                {item}
              </span>
            ))}
          </FooterColumn>

          <FooterColumn title="Community">
            {communityLinks.map((item) => (
              <span key={item} className="text-sm text-slate-600">
                {item}
              </span>
            ))}
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-col gap-3 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Kubi Labs. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FooterColumnProps {
  title: string;
  children: ReactNode;
}

function FooterColumn({ title, children }: FooterColumnProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
