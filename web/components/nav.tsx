"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Module 1 · Emerging Demand" },
  { href: "/competitive-radar", label: "Module 2 · Competitive Radar" },
  { href: "/ask", label: "Ask AI" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 text-sm">
      {LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-1.5 ${active ? "bg-accent text-white" : "text-foreground hover:bg-accent-soft"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
