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
  const isOnboarding = pathname?.startsWith("/onboarding") ?? false;
  const isDashboard = pathname?.startsWith("/dashboard") ?? false;

  // Overlay and onboarding routes don't use site AppLayout
  if (isOverlay || isOnboarding || isDashboard) {
    return <>{children}</>;
  }

  // Default site experience with AppLayout and site styles.
  return (
    <div className="bg-background-dark text-white min-h-dvh antialiased font-display">
      <AppLayout>{children}</AppLayout>
    </div>
  );
}


