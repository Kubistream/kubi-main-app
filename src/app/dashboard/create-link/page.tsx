"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useStreamerProfile } from "@/hooks/use-streamer-profile";
import { useAuth } from "@/providers/auth-provider";

interface FormState {
  slug: string;
  message: string;
}

export default function CreateLinkPage() {
  const { isConnected, isLoading } = useStreamerProfile();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>({ slug: "", message: "" });
  const [origin, setOrigin] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    setForm((prev) => {
      const nextSlug = user?.id ?? "";
      if (prev.slug === nextSlug) {
        return prev;
      }
      return {
        ...prev,
        slug: nextSlug,
      };
    });
  }, [user?.id]);

  const donationUrl = useMemo(() => {
    if (!form.slug || !origin) return "";
    return `${origin}/donate/${form.slug}`;
  }, [form.slug, origin]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.slug) return;

    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-accent-cyan">Create Link</p>
        <h1 className="text-3xl font-black text-white font-display">Create your shareable link &amp; QR</h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Choose a slug for supporters to visit. We&apos;ll generate a donation URL and QR code you can drop into OBS or share anywhere.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Donation settings</CardTitle>
            <CardDescription>Configure your custom donation link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isConnected && (
              <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-[#2D2452] bg-[#0B061D] p-6 text-center">
                <p className="text-sm text-slate-400">
                  {isLoading
                    ? "Checking your creator profile..."
                    : "Connect your wallet from the header to manage creator links."}
                </p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Donation slug</Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="rounded-xl border-2 border-primary bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">
                    /donate/
                  </span>
                  <Input
                    required
                    value={form.slug}
                    readOnly
                    placeholder={user?.id ?? "Connect to generate"}
                    disabled={!isConnected}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Keep it short and memorable for fans. You can update this later.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Welcome message (optional)</Label>
                <Textarea
                  value={form.message}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, message: event.target.value }))
                  }
                  placeholder="Thanks for supporting the stream!"
                  rows={3}
                  disabled={!isConnected}
                />
              </div>

              <Button type="submit" disabled={!isConnected || !form.slug} className="w-full">
                Generate link
              </Button>
              {submitted && donationUrl && (
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#06D6A0]">
                  Link generated! Share it with your community.
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col text-center">
          <CardHeader>
            <CardTitle>QR preview</CardTitle>
            <CardDescription>Scan or share this code with supporters.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center gap-6">
            <div className="rounded-2xl border-2 border-[#2D2452] bg-[#0B061D] p-6">
              {donationUrl ? (
                <QRCodeSVG value={donationUrl} size={180} bgColor="transparent" fgColor="#623AD6" />
              ) : (
                <div className="flex h-[180px] w-[180px] items-center justify-center text-xs text-slate-500">
                  Enter a slug to generate QR
                </div>
              )}
            </div>
            <Separator className="my-2 bg-[#2D2452]" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-primary font-bold">Share this link</p>
              <p className="mt-2 break-all text-sm font-medium text-white">
                {donationUrl || "Your link will appear here"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

