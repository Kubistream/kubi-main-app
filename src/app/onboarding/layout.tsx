import type { ReactNode } from "react";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center bg-gradient-to-b from-[#FFF1E4] via-white to-[#FFF7F7] px-4 py-10 text-slate-900 sm:px-8">
      <main className="w-full max-w-4xl">{children}</main>
    </div>
  );
}
