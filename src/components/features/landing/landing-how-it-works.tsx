"use client";

import { useState, type ReactNode } from "react";
import { Wallet, Share2, Download, Coins, Send, Bell } from "lucide-react";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingHowItWorks() {
  const [view, setView] = useState<"streamer" | "supporter">("streamer");
  const steps =
    view === "streamer"
      ? [
        { title: "Connect Your Wallet", description: "Authenticate quickly with your favorite wallet.", icon: Wallet },
        { title: "Share Donation Link", description: "Drop your link on socials, chat, or bio.", icon: Share2 },
        { title: "Receive Donation", description: "Funds flow straight into your wallet.", icon: Download },
      ]
      : [
        { title: "Choose Amount & Token", description: "Pick tokens you already hold.", icon: Coins },
        { title: "Sign & Send", description: "Confirm safely from your wallet.", icon: Send },
        { title: "Trigger the Alert", description: "Your message appears on stream.", icon: Bell },
      ];

  return (
    <section id="how" className="bg-[#0f0919]">
      <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-16">
        <header className="mb-8 text-center">
          <h2 className="text-4xl font-black tracking-tighter text-white sm:text-5xl md:text-6xl drop-shadow-md">
            <span className="bg-gradient-to-r from-[#5EEAD4] to-[#A78BFA] bg-clip-text text-transparent">
              How It Works?
            </span>
          </h2>
        </header>

        <div className="mx-auto flex max-w-lg items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 transition-all">
          <TogglePill active={view === "streamer"} onClick={() => setView("streamer")}>
            Streamers
          </TogglePill>
          <TogglePill active={view === "supporter"} onClick={() => setView("supporter")}>
            Supporters
          </TogglePill>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.title} className="hover:border-[#623AD6] transition-all duration-300 group">
              <CardHeader className="flex flex-col items-center gap-6 text-center pb-8 pt-10">
                <div className="relative p-5 bg-white/5 rounded-2xl border border-white/10 group-hover:bg-white/10 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                  <step.icon className="h-14 w-14 text-[#5EEAD4] group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-white leading-tight mb-3">{step.title}</CardTitle>
                  <p className="text-slate-400 font-medium">{step.description}</p>
                </div>
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
      variant="ghost"
      className={cn(
        "text-base sm:text-lg w-full font-bold transition-all rounded-lg",
        active
          ? "bg-[#7C3AED] text-white shadow-[2px_2px_0_0_#000] hover:shadow-none transform hover:translate-x-[1px] hover:translate-y-[1px]"
          : "text-slate-400 hover:text-white hover:bg-white/5"
      )}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
