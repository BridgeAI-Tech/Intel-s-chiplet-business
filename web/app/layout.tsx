import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { AskDrawer } from "@/components/ask-drawer";
// import { Nav } from "@/components/nav";
import { moduleCompanies } from "@/lib/dashboard";
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
            <a href="/">
              <div className="text-sm font-semibold tracking-wide text-accent">INTEL CHIPLET MARKET SIGNALS</div>
              <div className="text-xs text-muted">Which companies are building their own chips — and who supplies them</div>
            </a>
            {/* Module navigation hidden for the client sample: everything is on the dashboard and in Ask Intelligence.
            <Suspense fallback={<nav className="h-8" />}>
              <Nav />
            </Suspense> */}
          </div>
        </header>
        <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6">
          <Suspense fallback={<div className="text-sm text-muted">Loading records…</div>}>{children}</Suspense>
        </main>
        <Suspense fallback={null}>
          <AskIntelligence />
        </Suspense>
        <footer className="border-t border-border bg-surface py-3 text-xs text-muted">
          <div className="mx-auto flex max-w-screen-2xl justify-center px-4">
            <a href="https://bridgeaitech.com" target="_blank" rel="noreferrer" className="flex items-center gap-2">
              <span>Powered by</span>
              <Image src="/bridgeai-logo.png" alt="BridgeAI — AI that works!" width={273} height={78} className="h-8 w-auto" />
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}

async function AskIntelligence() {
  const companies = await moduleCompanies();
  return <AskDrawer companies={companies.map(({ company_id, short_name }) => ({ company_id, short_name }))} />;
}
