import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, SourceLink, humanize } from "@/components/ui";

export const TABS = [
  { key: "summary", label: "Executive Summary" },
  { key: "developments", label: "Silicon Developments" },
  { key: "hiring", label: "Hiring Intelligence" },
  { key: "ecosystem", label: "Supplier & Ecosystem" },
  { key: "intel", label: "Intel Relationship" },
  { key: "filings", label: "Filings & Disclosures" },
  { key: "assessment", label: "Assessment" },
  { key: "evidence", label: "Evidence & Sources" },
] as const;

export type Params = { tab: string; co: string | null; [k: string]: string | null };

export function href(p: Params, change: Record<string, string | null>) {
  const next = { ...p, ...change };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v && !(k === "tab" && v === "summary")) qs.set(k, v);
  const s = qs.toString();
  return s ? `/?${s}` : "/";
}

export function Chip({ to, active, children, title }: { to: string; active?: boolean; children: ReactNode; title?: string }) {
  return (
    <Link href={to} title={title} scroll={false}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${
        active ? "border-foreground bg-foreground text-white" : "border-border bg-surface text-foreground hover:border-accent"}`}>
      {children}
    </Link>
  );
}

export function SectionTitle({ n, title, scope, children }: { n?: number; title: string; scope: string; children?: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-mono text-lg font-semibold uppercase tracking-wide">{n ? `${n}. ` : ""}{title}</h1>
        <span className="rounded border border-border bg-surface px-2 py-0.5 font-mono text-xs uppercase text-muted">{scope}</span>
      </div>
      {children && <p className="mt-1 max-w-4xl text-sm text-muted">{children}</p>}
    </div>
  );
}

export function Panel({ title, note, action, children }: { title: string; note?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider">{title}</h2>
          {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Tile({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="font-mono text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {note && <div className="mt-1 text-xs text-muted">{note}</div>}
    </div>
  );
}

export function Bar({ label, n, max, to }: { label: ReactNode; n: number; max: number; to?: string }) {
  const body = (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-48 shrink-0 truncate">{label}</span>
      <div className="h-2 flex-1 rounded bg-accent-soft">
        <div className="h-2 rounded bg-accent" style={{ width: `${max ? (n / max) * 100 : 0}%` }} />
      </div>
      <span className="w-10 text-right tabular-nums">{n}</span>
    </div>
  );
  return to ? <Link href={to} scroll={false} className="block rounded hover:bg-accent-soft/50">{body}</Link> : body;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return `${MONTHS[Number(m) - 1]} ${y.slice(2)}`;
}

// Stacked monthly columns: confirmed facts (solid) and press-released intent (light).
export function MonthColumns({ rows }: { rows: { month: string; a: number; b?: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.a + (r.b ?? 0)));
  return (
    <div className="flex h-40 items-end gap-1.5">
      {rows.map((r) => (
        <div key={r.month} className="flex flex-1 flex-col items-center gap-1" title={`${r.month}: ${r.a}${r.b !== undefined ? ` confirmed, ${r.b} intent` : ""}`}>
          <span className="text-[10px] tabular-nums text-muted">{r.a + (r.b ?? 0)}</span>
          <div className="flex w-full flex-col justify-end" style={{ height: `${((r.a + (r.b ?? 0)) / max) * 110}px` }}>
            {r.b ? <div className="w-full rounded-t bg-sky-300" style={{ flex: r.b }} /> : null}
            <div className={`w-full bg-accent ${r.b ? "" : "rounded-t"}`} style={{ flex: r.a }} />
          </div>
          <span className="text-[10px] text-muted">{monthLabel(r.month)}</span>
        </div>
      ))}
    </div>
  );
}

export function SignalCard({ s }: {
  s: { signal_id: string; short_name: string; signal_type: string; title: string; summary: string | null; event_date: string | null;
    publication_date: string | null; evidence_class: string; excerpt: string | null; url: string; source_name: string | null;
    source_type: string; sources: number };
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] uppercase text-accent">{humanize(s.signal_type)}</span>
        <Badge value={s.evidence_class} />
        <span className="ml-auto text-xs font-medium">{s.short_name}</span>
      </div>
      <Link href={`/events/m1_signal/${s.signal_id}`} className="text-sm font-semibold leading-snug hover:underline">{s.title}</Link>
      {s.summary && <p className="mt-1 text-xs text-muted">{s.summary}</p>}
      {s.excerpt && (
        <blockquote className="mt-2 rounded-md border border-emerald-200 bg-emerald-50/60 p-2 text-xs">
          <div className="mb-0.5 font-mono text-[10px] uppercase text-emerald-800">Verbatim source excerpt</div>
          “{s.excerpt}”
        </blockquote>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-muted">
        <span>{s.event_date ? (s.event_date > today ? `Target ${s.event_date}` : `Event ${s.event_date}`) : `Published ${s.publication_date}`}</span>
        <span>{humanize(s.source_type)}</span>
        <SourceLink url={s.url} label={s.source_name} />
        {s.sources > 1 && <span>+{s.sources - 1} corroborating</span>}
        <Link href={`/events/m1_signal/${s.signal_id}`} className="ml-auto text-accent">Inspect evidence →</Link>
      </div>
    </article>
  );
}
