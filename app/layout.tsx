import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import NavigationBar from "@/components/NavigationBar";

export const metadata: Metadata = {
  title: "Intel Chiplet Market Signals | Emerging Demand & Competitive Movement",
  description: "Executive Market Signals & Competitive Intelligence POC for Intel Commercial Marketing & Foundry Services",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#070e1b] text-slate-100 antialiased flex flex-col">
        {/* Global Navigation Header */}
        <header className="border-b border-[#1b2a47] bg-[#0a1529]/95 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Intel Brand Logo and Title */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#0068B5] text-white font-black tracking-widest text-lg shadow-lg shadow-[#0068B5]/30">
                  i
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#00C7FD]">
                      Intel Commercial Marketing & Foundry Intelligence
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[#132c4d] text-cyan-300 rounded border border-[#1e4a7a]">
                      POC Modules 1 & 2
                    </span>
                  </div>
                  <h1 className="text-base font-bold tracking-tight text-white">
                    CHIPLET MARKET SIGNALS RADAR
                  </h1>
                </div>
              </div>

              {/* Status and Controls */}
              <div className="flex items-center space-x-4 text-xs">
                <div className="hidden sm:flex items-center space-x-2 text-slate-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Data Period: <strong className="text-slate-200">Last 12 Months</strong></span>
                </div>
                <div className="px-2.5 py-1 rounded bg-[#10233d] border border-[#1e3e68] text-slate-300 font-mono text-[11px]">
                  SQLite: Active (Seed v1.2)
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0068B5] to-[#00C7FD] flex items-center justify-center text-white font-bold text-xs ring-2 ring-[#0068B5]/40">
                  IM
                </div>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <NavigationBar />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-[#162744] bg-[#070e1b] py-4 text-center text-xs text-slate-500">
          <p>
            Intel Chiplet Market Signals POC • Modules 1 & 2 • Confidential for Intel Commercial Marketing & Research Teams
          </p>
        </footer>
      </body>
    </html>
  );
}
