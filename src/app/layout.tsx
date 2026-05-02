import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { Analytics } from "@vercel/analytics/next";

const nunito = Nunito({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "KindPoints",
  description: "A warm family reward points tracker for growth, repair, and teamwork.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "KindPoints",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={nunito.className}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
