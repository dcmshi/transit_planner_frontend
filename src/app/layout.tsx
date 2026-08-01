import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { HealthBanner } from "@/components/HealthBanner";
import { AlertsBanner } from "@/components/AlertsBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
          <ErrorBoundary>
            <HealthBanner />
            <AlertsBanner />
            <header className="bg-brand text-white shadow-md">
              <div className="mx-auto max-w-5xl px-4 py-4 flex items-center gap-3">
                <span className="text-xl font-bold tracking-tight">GO</span>
                <span className="h-5 w-px bg-white/30" />
                <span className="text-sm font-medium text-white/80">
                  Reliability Router
                </span>
              </div>
            </header>
            <div className="mx-auto max-w-5xl px-4 py-8">
              {children}
            </div>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
