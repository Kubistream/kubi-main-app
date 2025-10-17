"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { History, LayoutDashboard, MonitorPlay, Trophy, UserRound } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

type DashboardNavItem = {
  label: string;
  href: string;
  icon?: ReactNode;
  target?: string;
  rel?: string;
  disabled?: boolean;
};

const STATIC_NAV: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Leaderboard", href: "/dashboard/leaderboard", icon: <Trophy className="h-5 w-5" /> },
  { label: "Tx History", href: "/dashboard/history", icon: <History className="h-5 w-5" /> },
  { label: "Profile", href: "/dashboard/profile", icon: <UserRound className="h-5 w-5" /> },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const overlayNav: DashboardNavItem = user?.streamerId
    ? {
        label: "Overlay",
        href: `/overlay/${user.streamerId}`,
        icon: <MonitorPlay className="h-5 w-5" />,
        target: "_blank",
        rel: "noopener noreferrer",
      }
    : {
        label: "Overlay",
        href: "#",
        icon: <MonitorPlay className="h-5 w-5" />,
        disabled: true,
      };

  const navItems: DashboardNavItem[] = [
    ...STATIC_NAV.slice(0, 3),
    overlayNav,
    ...STATIC_NAV.slice(3),
  ];

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
        {navItems.map((item) => {
          const isActive =
            !item.disabled &&
            (pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href)));

          const baseClasses =
            "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition";

          const content = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl text-[22px] text-rose-400 transition group-hover:text-rose-500",
                  isActive && "bg-white text-rose-500 shadow-inner shadow-rose-200",
                  item.disabled && "group-hover:text-rose-400",
                )}
              >
                {item.icon ?? item.label.slice(0, 1)}
              </span>
              {item.label}
            </>
          );

          if (item.disabled) {
            return (
              <span
                key={item.label}
                className={cn(
                  baseClasses,
                  "cursor-not-allowed text-slate-400",
                )}
                aria-disabled="true"
              >
                {content}
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              target={item.target}
              rel={item.rel}
              className={cn(
                baseClasses,
                "text-slate-600 hover:bg-rose-50 hover:text-slate-900",
                isActive && "bg-gradient-to-r from-[#FFEEF5] to-[#FFE7DA] text-slate-900 shadow-md shadow-rose-200",
              )}
            >
              {content}
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
