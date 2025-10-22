"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { brandPalette } from "@/constants/theme";

function addRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

interface DonationLinkCardProps {
  link: string;
}

export function DonationLinkCard({ link }: DonationLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error("Failed to copy donation link", error);
    }
  };

  const handleShowQr = () => {
    if (!link) return;
    setQrOpen(true);
  };

  const handleDownloadPng = () => {
    try {
      const svg = svgRef.current;
      if (!svg) return;
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svg);
      if (!source.match(/^<svg[^>]+xmlns=/)) {
        source = source.replace(
          /^<svg/,
          '<svg xmlns="http://www.w3.org/2000/svg"',
        );
      }

      const svgBlob = new Blob([source], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        const viewBox = svg.getAttribute("viewBox")?.split(" ");
        const widthAttr = svg.getAttribute("width");
        const heightAttr = svg.getAttribute("height");
        let width = viewBox?.[2]
          ? Number.parseFloat(viewBox[2])
          : widthAttr
            ? Number.parseFloat(widthAttr)
            : svg.clientWidth;
        let height = viewBox?.[3]
          ? Number.parseFloat(viewBox[3])
          : heightAttr
            ? Number.parseFloat(heightAttr)
            : svg.clientHeight;
        if (!Number.isFinite(width) || width <= 0) {
          width = 256;
        }
        if (!Number.isFinite(height) || height <= 0) {
          height = width;
        }
        const baseSize = Math.max(width, height);
        const scaleFactor = 9;
        const qrSize = baseSize * scaleFactor;
        const padding = Math.round(qrSize * 0.14);
        const exportSize = qrSize + padding * 2;
        const borderRadius = Math.round(exportSize * 0.08);

        const canvas = document.createElement("canvas");
        canvas.width = exportSize;
        canvas.height = exportSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          return;
        }
        ctx.imageSmoothingEnabled = false;

        if (borderRadius > 0) {
          ctx.save();
          addRoundedRectPath(ctx, 0, 0, exportSize, exportSize, borderRadius);
          ctx.clip();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, exportSize, exportSize);
          ctx.drawImage(image, padding, padding, qrSize, qrSize);
          ctx.restore();
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, exportSize, exportSize);
          ctx.drawImage(image, padding, padding, qrSize, qrSize);
        }

        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        let idPart = "qr";
        try {
          const u = new URL(link);
          const parts = u.pathname.split("/").filter(Boolean);
          idPart = parts[parts.length - 1] || idPart;
        } catch {
          // ignore
        }
        a.download = `donation-qr-${idPart}.png`;
        a.href = pngUrl;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      };
      image.onerror = (error) => {
        console.error("Failed to load QR image for download", error);
        URL.revokeObjectURL(url);
      };
      image.src = url;
    } catch (error) {
      console.error("Failed to download QR image", error);
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
              onClick={handleShowQr}
              variant="outline"
              className="border-rose-200 bg-white px-4 text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
              aria-label="Show QR code"
              disabled={!link}
            >
              Show QR
            </Button>
          </div>
        </div>

        {/* <p className="text-xs text-slate-500">
          Tip: customise the slug from <span className="font-medium text-rose-500">Dashboard → Create link &amp; QR</span> for better recall.
        </p> */}
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="rounded-2xl">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setQrOpen(false)}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">Donation QR</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-5 pt-2">
            <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm shadow-rose-100/50">
              <QRCodeSVG
                ref={svgRef}
                value={link}
                size={220}
                bgColor="transparent"
                fgColor={brandPalette.pink}
                title="Donation link QR"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadPng}
                aria-label="Download QR as PNG"
                className="border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                <Download className="mr-2 h-4 w-4" /> Download PNG
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
