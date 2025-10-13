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
import { brandPalette } from "@/constants/theme";

interface FormState {
  slug: string;
  message: string;
}

export default function CreateLinkPage() {
  const { profile, isConnected, isLoading } = useStreamerProfile();
  const [form, setForm] = useState<FormState>({ slug: "", message: "" });
  const [origin, setOrigin] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!profile?.username) return;
    setForm((prev) => ({
      ...prev,
      slug: prev.slug || profile.username || "",
    }));
  }, [profile]);

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
    <main className="min-h-screen bg-gradient-to-br from-rose-100 via-white to-rose-50 px-6 py-20 text-slate-900">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[2fr,1fr]">
        <Card className="border-white/70 bg-white/90 shadow-lg shadow-rose-200/40">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-slate-900">
              Create your shareable link &amp; QR
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Choose a slug for supporters to visit. We&apos;ll generate a donation URL and QR code you can drop into OBS or share anywhere.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isConnected && (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-center">
                <p className="text-sm text-slate-600">
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
                  <span className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-400">
                    /donate/
                  </span>
                  <Input
                    required
                    value={form.slug}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, slug: event.target.value }))
                    }
                    placeholder={profile?.username ?? "your-handle"}
                    pattern="[a-zA-Z0-9_-]+"
                    title="Use letters, numbers, dashes, or underscores"
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
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-400">
                  Link generated! Share it with your community.
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col border-white/70 bg-white/95 text-center shadow-lg shadow-rose-200/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">QR preview</CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Scan or share this code with supporters.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center gap-6">
            <div className="rounded-3xl border border-rose-100 bg-rose-50/80 p-6">
              {donationUrl ? (
                <QRCodeSVG value={donationUrl} size={180} bgColor="transparent" fgColor={brandPalette.pink} />
              ) : (
                <div className="flex h-[180px] w-[180px] items-center justify-center text-xs text-slate-500">
                  Enter a slug to generate QR
                </div>
              )}
            </div>
            <Separator className="my-2" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-rose-300">Share this link</p>
              <p className="mt-2 break-all text-sm font-medium text-slate-900">
                {donationUrl || "Your link will appear here"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
