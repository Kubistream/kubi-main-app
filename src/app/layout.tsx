import type { Metadata } from "next";
import { Geist, Geist_Mono, Modak, Inter, Space_Grotesk } from "next/font/google";
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

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Outfit:wght@300..900&display=swap" rel="stylesheet" />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${modak.variable} ${inter.variable} ${spaceGrotesk.variable} bg-slate-950 text-slate-100 antialiased`}
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
