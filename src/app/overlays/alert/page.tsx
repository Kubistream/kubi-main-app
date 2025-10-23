import { Card } from "@/components/ui/card";
import { brandPalette } from "@/constants/theme";
import { Link2 } from "lucide-react";

export const dynamic = "force-static";

export default function AlertOverlayPage() {
  // Dummy data for initial embed preview
  const data = {
    title: "Alert Message",
    sender: "John",
    amount: "10.000",
    note: "Goodluck bro! ❤️",
  } as const;

  return (
    <div
      className="relative grid min-h-dvh place-items-center p-6"
      style={{
        // Soft lilac/pink haze background to match brand
        background: `radial-gradient(1200px 600px at 20% 10%, ${brandPalette.lilac}66, transparent), radial-gradient(1000px 500px at 80% 90%, ${brandPalette.cream}80, transparent)`,
      }}
    >
      <Card className="w-[640px] max-w-[92vw] overflow-hidden rounded-3xl border-white/70 bg-white/80 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.25)] backdrop-blur">
        {/* Header: bleed to card edges */}
        <div
          className="-mx-6 -mt-6 flex items-center justify-between rounded-t-3xl px-6 py-3 text-white"
          style={{
            background: `linear-gradient(90deg, ${brandPalette.pink}, ${brandPalette.orange})`,
          }}
        >
          <span className="text-base font-semibold tracking-tight drop-shadow">{data.title}</span>
          <Link2 className="h-6 w-6 opacity-95 drop-shadow" />
        </div>

        {/* Divider under header (bold like in mock) */}
        <div className="-mx-6 h-[3px] w-[calc(100%+3rem)] bg-black/25" />

        {/* Body */}
        <div className="py-7 text-center">
          <div className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            <span
              className="bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent"
              style={{ WebkitTextStroke: "0.2px rgba(0,0,0,0.06)" }}
            >
              {data.sender}
            </span>
            <span className="mx-2"> tip you </span>
            <span
              className="bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent"
              style={{ WebkitTextStroke: "0.2px rgba(0,0,0,0.06)" }}
            >
              {data.amount}
            </span>
          </div>

          <div className="mt-4 text-3xl font-semibold text-slate-700 sm:text-4xl">
            {data.note}
          </div>
        </div>
      </Card>
    </div>
  );
}
