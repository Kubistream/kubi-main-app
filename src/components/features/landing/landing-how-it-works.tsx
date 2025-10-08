"use client";

import { useState, type ReactNode } from "react";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { brandPalette } from "./brand";
import { streamerSteps, supporterSteps } from "./data";

export function LandingHowItWorks() {
  const [view, setView] = useState<"streamer" | "supporter">("streamer");
  const steps = view === "streamer" ? streamerSteps : supporterSteps;

  return (
    <section id="how" className="bg-gradient-to-b from-white to-rose-50/40">
      <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-16">
        <header className="mb-8 text-center">
          <h2 className="text-3xl font-semibold" style={{ color: brandPalette.ink }}>
            How it works
          </h2>
          <p className="mt-2 text-base text-slate-600">
            Launch your donation experience in minutes—no custom code required.
          </p>
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
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-lg font-semibold text-rose-500">
                    {step.step}
                  </span>
                  <span className="text-3xl" aria-hidden>
                    {step.icon}
                  </span>
                </div>
                <div>
                  <CardTitle>{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
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
      variant={active ? "default" : "ghost"}
      className={active ? "bg-gradient-to-r from-[#FF3D86] to-[#FFA24C] text-white" : "text-slate-600"}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
