"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function LandingHowItWorks() {
  const [view, setView] = useState<"streamer" | "supporter">("streamer");
  const steps =
    view === "streamer"
      ? [
          { step: "1", title: "Connect Your Wallet", description: "Authenticate quickly with your favorite wallet.", image: "/assets/illustrations/connect-wallet.png" },
          { step: "2", title: "Share Donation Link", description: "Drop your link on socials, chat, or bio.", image: "/assets/illustrations/share-link.png" },
          { step: "3", title: "Receive Donation", description: "Funds flow straight into your wallet.", image: "/assets/illustrations/receive-donation.png" },
        ]
      : [
          { step: "1", title: "Choose Amount & Token", description: "Pick tokens you already hold.", image: "/assets/illustrations/choose-token.png" },
          { step: "2", title: "Sign & Send", description: "Confirm safely from your wallet.", image: "/assets/illustrations/sign-send.png" },
          { step: "3", title: "Trigger the Alert", description: "Your message appears on stream.", image: "/assets/illustrations/alert.png" },
        ];

  return (
    <section id="how" className="bg-gradient-to-b from-white to-rose-50/40">
      <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-16">
        <header className="mb-8 text-center">
          <h2 className="font-modak modak-readable modak-stroke-warm text-3xl font-extrabold tracking-wider sm:text-4xl md:text-5xl">
            <span className="bg-gradient-to-b from-[#FF3D86] via-[#FF6D6D] to-[#FFA24C] bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]">
              How It Works?
            </span>
          </h2>
        </header>

        <div className="mx-auto flex max-w-3xl items-center justify-center gap-3 rounded-full border border-rose-200 bg-white/80 p-1 shadow-sm">
          <TogglePill active={view === "streamer"} onClick={() => setView("streamer")}>
            Streamers
          </TogglePill>
          <TogglePill active={view === "supporter"} onClick={() => setView("supporter")}>
            Supporters
          </TogglePill>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.title} className="border-white/70 bg-white">
              <CardHeader className="flex flex-col items-center gap-4 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-lg font-semibold text-rose-500">
                  {step.step}
                </span>
                <Image
                  src={step.image}
                  alt={step.title}
                  width={180}
                  height={140}
                  className="mx-auto h-24 w-auto sm:h-28"
                />
                <CardTitle className="text-lg text-slate-900">{step.title}</CardTitle>
                {/* <CardDescription className="text-slate-600">{step.description}</CardDescription> */}
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

interface TogglePillProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

function TogglePill({ active, onClick, children }: TogglePillProps) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      className={active ? "bg-gradient-to-r from-[#FF3D86] to-[#FFA24C] text-white" : "text-slate-600"}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
