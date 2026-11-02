import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

export function Card({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {note && <div className="mt-1 text-xs text-muted">{note}</div>}
    </div>
  );
}

const BADGE_TONES: Record<string, string> = {
  confirmed_fact: "bg-emerald-50 text-emerald-800 border-emerald-200",
  corroborated_inference: "bg-amber-50 text-amber-800 border-amber-200",
  press_released_intent: "bg-sky-50 text-sky-800 border-sky-200",
  existing_relationship: "bg-emerald-50 text-emerald-800 border-emerald-200",
  potential_target: "bg-sky-50 text-sky-800 border-sky-200",
  partner_and_competitor: "bg-violet-50 text-violet-800 border-violet-200",
  competitor_only: "bg-rose-50 text-rose-800 border-rose-200",
  research_only: "bg-slate-50 text-slate-700 border-slate-200",
};

export function Badge({ value, label }: { value: string | null | undefined; label?: string }) {
  if (!value) return <span className="text-xs text-muted">—</span>;
  const tone = BADGE_TONES[value] ?? "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <span className={`inline-block whitespace-nowrap rounded border px-1.5 py-0.5 text-xs ${tone}`}>
      {label ?? humanize(value)}
    </span>
  );
}

const ACRONYMS = new Set(["ai", "hpc", "ip", "asic", "rtl", "dft", "osat", "eda", "soc", "cpu", "gpu", "hbm", "ucie",
  "xpu", "emib", "cowos", "soic", "vp", "ma", "sec", "it", "llm", "npu", "dpu", "ipu"]);

export function humanize(code: string) {
  return code
    .split("_")
    .map((w, i) => (ACRONYMS.has(w) ? w.toUpperCase() : i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ")
    .replace(/\bMA\b/, "M&A");
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted">{children}</div>;
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            {head.map((h) => (
              <th key={h} className="px-2 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-2 py-2 align-top ${className}`}>{children}</td>;
}

export function CompanyLink({ id, name }: { id: string; name: string }) {
  return (
    <Link href={`/companies/${id}`} className="font-medium text-accent hover:underline">
      {name}
    </Link>
  );
}

export function SourceLink({ url, label }: { url: string; label?: string | null }) {
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {}
  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
      {label || host}
    </a>
  );
}
