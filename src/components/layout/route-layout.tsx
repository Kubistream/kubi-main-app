"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";

type Props = {
  children: React.ReactNode;
};

export default function RouteLayout({ children }: Props) {
  const pathname = usePathname();
  const isOverlay = pathname?.startsWith("/overlay/") ?? false;

  if (isOverlay) {
    // Do NOT wrap overlay routes with the site AppLayout or site styles.
    return <>{children}</>;
  }

  // Default site experience with AppLayout and site styles.
  return (
    <div className="bg-slate-950 text-slate-100 min-h-dvh antialiased">
      <AppLayout>{children}</AppLayout>
    </div>
  );
}

