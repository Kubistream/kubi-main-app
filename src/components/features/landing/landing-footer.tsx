import type { ReactNode } from "react";

import Link from "next/link";
import Image from "next/image";

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
];

const resourceLinks = ["Docs", "Brand assets"];
const communityLinks = ["Discord", "Twitter/X", "GitHub"];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0f0919]">
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center">
              <Image src="/assets/brand/logo2.png" alt="Kubi logo" width={120} height={120} className="w-auto h-10" />
            </div>
            <p className="mt-4 text-sm text-slate-400 font-medium leading-relaxed">
              Creator-friendly on-chain donations. Built for diverse communities.
            </p>
          </div>

          <FooterColumn title="Product">
            {productLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-sm font-bold text-slate-500 transition hover:text-[#06D6A0]">
                {link.label}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title="Resources">
            {resourceLinks.map((item) => (
              <span key={item} className="text-sm font-bold text-slate-500 hover:text-white cursor-pointer transition-colors">
                {item}
              </span>
            ))}
          </FooterColumn>

          <FooterColumn title="Community">
            {communityLinks.map((item) => (
              <span key={item} className="text-sm font-bold text-slate-500 hover:text-[#06D6A0] cursor-pointer transition-colors">
                {item}
              </span>
            ))}
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs font-bold text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Kubi Labs. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="cursor-pointer hover:text-white transition-colors">Privacy</span>
            <span className="cursor-pointer hover:text-white transition-colors">Terms</span>
            <span className="cursor-pointer hover:text-white transition-colors">Security</span>
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
    <div className="space-y-4">
      <p className="text-base font-black text-white">{title}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
