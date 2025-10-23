import type { Metadata } from "next";
import { Geist, Geist_Mono, Modak } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Web3Provider } from "@/providers/web3-provider";
import { AuthProvider } from "@/providers/auth-provider";
import RouteLayout from "@/components/layout/route-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const modak = Modak({
  variable: "--font-modak",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kubi Stream",
  description: "Build your Web3-powered donation overlay and manage supporters in one place.",
  icons: {
    icon: [{ url: "/assets/brand/logo.ico" }],
    shortcut: [{ url: "/assets/brand/logo.ico" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${modak.variable} bg-slate-950 text-slate-100 antialiased`}
      >
        <Web3Provider>
          <AuthProvider>
            <RouteLayout>{children}</RouteLayout>
          </AuthProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
