"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DonationLinkCardProps {
  link: string;
}

export function DonationLinkCard({ link }: DonationLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error("Failed to copy donation link", error);
    }
  };

  return (
    <div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#FFB15A] via-[#FF6D6D] to-[#FF3D86] p-[1.5px] shadow-[0_24px_50px_-28px_rgba(255,61,134,0.55)]">
      <div className="flex flex-col gap-6 rounded-[2.45rem] bg-white/95 px-8 py-10 text-slate-900 sm:px-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-400">Your Donation Link</p>
          <h3 className="mt-3 text-3xl font-semibold text-[#FF6D6D] sm:text-[2.125rem]">
            Share with your community
          </h3>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            Drop it into OBS, panel descriptions, or social bios. Supporters land directly on your on-chain tipping page.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Input
            readOnly
            value={link}
            className="h-12 flex-1 rounded-full border-2 border-rose-200 bg-white/90 text-base font-medium text-slate-900 shadow-inner focus-visible:ring-0"
          />
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleCopy}
              className="bg-[#FF3D86] px-6 text-sm font-semibold shadow-lg shadow-[#FF3D8644] transition hover:bg-[#FF2A78]"
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-rose-200 bg-white px-4 text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
            >
              Show QR
            </Button>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Tip: customise the slug from <span className="font-medium text-rose-500">Dashboard → Create link &amp; QR</span> for better recall.
        </p>
      </div>
    </div>
  );
}
