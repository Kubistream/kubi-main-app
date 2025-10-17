"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { History, LayoutDashboard, Settings, Trophy, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

type DashboardNavItem = {
  label: string;
  href: string;
  icon?: ReactNode;
};

function buildNav(isSuperAdmin: boolean): DashboardNavItem[] {
  if (isSuperAdmin) {
    // Superadmin sees only Admin section
    return [{ label: "Admin", href: "/dashboard/admin", icon: <Settings className="h-5 w-5" /> }];
  }
  // Streamers/users see the standard creator dashboard nav
  return [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Leaderboard", href: "/dashboard/leaderboard", icon: <Trophy className="h-5 w-5" /> },
    { label: "Tx History", href: "/dashboard/history", icon: <History className="h-5 w-5" /> },
    { label: "Profile", href: "/dashboard/profile", icon: <UserRound className="h-5 w-5" /> },
  ];
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPERADMIN";
  const DASHBOARD_NAV = buildNav(Boolean(isSuperAdmin));

  return (
    <aside className="hidden w-64 flex-col border-r border-rose-100 bg-white text-slate-900 shadow-lg shadow-rose-200/40 md:flex lg:w-72">
      <div className="flex items-center gap-3 border-b border-rose-100 px-6 py-8">
        <div>
          <Image
            src="/assets/brand/logo2.png"
            alt="Kubi badge"
            width={100}
            height={100}
            className=""
            priority
          />
        </div>
        <div>
          <p className="text-xs text-slate-500">Creator Suite</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        {DASHBOARD_NAV.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-slate-900",
                isActive && "bg-gradient-to-r from-[#FFEEF5] to-[#FFE7DA] text-slate-900 shadow-md shadow-rose-200",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl text-[22px] text-rose-400 transition group-hover:text-rose-500",
                  isActive && "bg-white text-rose-500 shadow-inner shadow-rose-200",
                )}
              >
                {item.icon ?? item.label.slice(0, 1)}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-rose-100 px-6 py-6 text-xs text-slate-500">
        <p>Need help?</p>
        <p className="mt-1 font-medium text-slate-600">support@kubilabs.xyz</p>
      </div>
    </aside>
  );
}
