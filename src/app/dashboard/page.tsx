import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardLandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-rose-100 via-white to-rose-50 px-6 py-16 text-slate-900">
      <Card className="w-full max-w-2xl border-white/70 bg-white/90 text-center shadow-lg shadow-rose-200/40">
        <CardHeader className="space-y-4">
          <CardTitle className="text-3xl font-semibold text-slate-900">Your creator hub</CardTitle>
          <CardDescription className="text-base text-slate-600">
            Create donation links, customise your profile, and preview the supporter experience while we prepare analytics and overlays.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Button asChild className="w-full">
              <Link href="/dashboard/create-link">Create link &amp; QR</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full text-slate-900">
              <Link href="/onboarding">Edit profile</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/donate/demo">Preview donation page</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
