import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Intel Chiplet Market Signals",
  description: "Emerging demand and competitive movement radar — evidence-led sample POC",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <div className="text-sm font-semibold tracking-wide text-accent">INTEL CHIPLET MARKET SIGNALS</div>
              <div className="text-xs text-muted">Sample POC · Data period: last 12 months</div>
            </div>
            <Suspense fallback={<nav className="h-8" />}>
              <Nav />
            </Suspense>
          </div>
        </header>
        <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6">
          <Suspense fallback={<div className="text-sm text-muted">Loading records…</div>}>{children}</Suspense>
        </main>
        <footer className="border-t border-border py-3 text-center text-xs text-muted">
          Every figure on these pages is computed from stored records; open any record to see its source.
        </footer>
      </body>
    </html>
  );
}
