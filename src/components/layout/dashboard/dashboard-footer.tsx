"use client";

export function DashboardFooter() {
  return (
    <footer className="border-t border-rose-200/50 bg-white/70 px-6 py-4 text-xs text-slate-500 sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Kubi Labs. Built for creators and communities.</p>
        <div className="flex gap-4">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Status</span>
        </div>
      </div>
    </footer>
  );
}
