"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, ShieldAlert, BookOpen, Bot } from "lucide-react";

export default function NavigationBar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard, badge: null },
    { name: "Emerging Demand", href: "/emerging-demand", icon: Target, badge: "Module 1" },
    { name: "Competitive Radar", href: "/competitive-radar", icon: ShieldAlert, badge: "Module 2" },
    { name: "Evidence Library", href: "/evidence", icon: BookOpen, badge: null },
    { name: "Ask AI (RAG)", href: "/ask-ai", icon: Bot, badge: "Live DB" },
  ];

  return (
    <nav className="flex space-x-1 border-t border-[#162744] pt-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-md transition-all ${
              isActive
                ? "bg-[#112444] text-[#00C7FD] border-b-2 border-[#00C7FD] shadow-inner"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#0c1a32]"
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? "text-[#00C7FD]" : "text-slate-400"}`} />
            <span>{item.name}</span>
            {item.badge && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isActive
                    ? "bg-[#0068B5]/40 text-cyan-200 border border-[#0068B5]"
                    : "bg-[#162744] text-slate-400"
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

