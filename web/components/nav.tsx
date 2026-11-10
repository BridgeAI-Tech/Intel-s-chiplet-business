"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function Nav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const isSources = pathname === "/" && tab === "sources";
  const isRadar = pathname.startsWith("/competitive-radar");
  const isDemand = pathname === "/" && !isSources;

  return (
    <nav id="tour-nav" className="flex flex-wrap items-center gap-1.5 text-xs">
      <Link
        href="/"
        className={`rounded-lg px-3 py-1.5 font-medium transition ${
          isDemand
            ? "border border-foreground bg-foreground text-white font-semibold"
            : "border border-border bg-surface text-foreground hover:border-accent hover:text-accent"
        }`}
      >
        Emerging Demand
      </Link>
      <Link
        href="/competitive-radar"
        className={`rounded-lg px-3 py-1.5 font-medium transition ${
          isRadar
            ? "border border-foreground bg-foreground text-white font-semibold"
            : "border border-border bg-surface text-foreground hover:border-accent hover:text-accent"
        }`}
      >
        Competitive Radar
      </Link>
      <Link
        href="/?tab=sources"
        className={`rounded-lg px-3 py-1.5 font-medium transition ${
          isSources
            ? "border border-foreground bg-foreground text-white font-semibold"
            : "border border-border bg-surface text-foreground hover:border-accent hover:text-accent"
        }`}
      >
        Where the data comes from
      </Link>
    </nav>
  );
}
