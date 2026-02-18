import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { HealthBanner } from "@/components/HealthBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GO Transit Reliability Router",
  description: "Reliability-first route planning for GO Transit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <HealthBanner />
          <header className="bg-green-700 text-white shadow-md">
            <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-3">
              <span className="text-xl font-bold tracking-tight">GO</span>
              <span className="h-5 w-px bg-green-500" />
              <span className="text-sm font-medium text-green-100">
                Reliability Router
              </span>
            </div>
          </header>
          <div className="mx-auto max-w-2xl px-4 py-8">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
