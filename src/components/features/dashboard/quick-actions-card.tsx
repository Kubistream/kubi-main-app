import Link from "next/link";

import { Button } from "@/components/ui/button";

const QUICK_ACTIONS = [
  {
    label: "Create link & QR",
    href: "/dashboard/create-link",
    variant: "default" as const,
    description: "Generate a fresh donation page slug and QR code.",
    className: "bg-[#FF3D86] hover:bg-[#FF2A78] shadow-lg shadow-[#FF3D8644]",
  },
  {
    label: "Edit profile",
    href: "/onboarding",
    variant: "outline" as const,
    description: "Update your creator handle, avatar, and overlays.",
    className: "border-rose-200 text-rose-500 hover:bg-rose-50",
  },
  {
    label: "Preview donation page",
    href: "/donate/demo",
    variant: "ghost" as const,
    description: "Open the supporter-facing experience in a new tab.",
    className: "text-rose-500 hover:bg-rose-50",
  },
];

export function QuickActionsCard() {
  return (
    <section className="flex h-full flex-col justify-between rounded-3xl border border-white/60 bg-white px-8 py-8 shadow-[0_18px_32px_-26px_rgba(47,42,44,0.35)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-400">Quick actions</p>
        <h3 className="mt-3 text-2xl font-semibold text-slate-900">Jump back into building</h3>
        <p className="mt-2 text-sm text-slate-600">
          Shortcuts you use most. We’ll personalise this module as you grow.
        </p>
      </div>

      <ul className="mt-6 space-y-3">
        {QUICK_ACTIONS.map((action) => (
          <li key={action.href} className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                <p className="text-xs text-slate-500">{action.description}</p>
              </div>
              <Button asChild variant={action.variant} size="sm" className={action.className}>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
