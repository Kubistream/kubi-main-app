"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, user, isSigning } = useAuth();
  const [guardMessage, setGuardMessage] = useState<string | null>("Checking permissions...");

  useEffect(() => {
    if (status === "loading" || isSigning) {
      setGuardMessage(isSigning ? "Awaiting wallet signature..." : "Loading your session...");
      return;
    }

    if (status !== "authenticated" || !user) {
      setGuardMessage("Redirecting to onboarding...");
      router.replace("/onboarding");
      return;
    }

    if (user.role !== "SUPERADMIN") {
      setGuardMessage("Redirecting...");
      router.replace("/dashboard");
      return;
    }

    setGuardMessage(null);
  }, [status, user, isSigning, router]);

  if (guardMessage) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-700">
        <p className="text-sm">{guardMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}

