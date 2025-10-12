export default function OverlayLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Minimal layout for overlay pages. No site AppLayout/styles applied.
  return (
    <div className="fixed inset-0">
      {children}
    </div>
  );
}

