import Link from "next/link";
import { monthLabel } from "@/components/dash";

// Fixed colour per company (validated categorical slots 1-3; colour follows the company, never its rank).
// Values are always printed next to the marks, so colour is never the only cue.
export const COMPANY_COLOR: Record<string, string> = {
  cmp_aws: "#2a78d6", cmp_cerebras: "#eb6834", cmp_tesla: "#1baf7a", cmp_meta: "#7c5cd6", cmp_microsoft: "#c23b6e",
};
const LIGHT = "#9cc3ef";   // lighter step of the blue ramp, for the second part of a two-part bar

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />{i.label}
        </span>
      ))}
    </div>
  );
}

// Grouped horizontal bars: one block per measure, one bar per company. Each measure has its own scale,
// because the measures are different things (developments vs jobs vs partners).
export function CompareBars({ companies, measures }: {
  companies: { id: string; name: string; href: string }[];
  measures: { label: string; hint: string; values: Record<string, number> }[];
}) {
  return (
    <div className="space-y-5">
      <Legend items={companies.map((c) => ({ label: c.name, color: COMPANY_COLOR[c.id] ?? "#2a78d6" }))} />
      {measures.map((m) => {
        const max = Math.max(1, ...Object.values(m.values));
        return (
          <div key={m.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{m.label}</span>
              <span className="text-xs text-muted">{m.hint}</span>
            </div>
            <div className="space-y-1">
              {companies.map((c) => {
                const v = m.values[c.id] ?? 0;
                return (
                  <Link key={c.id} href={c.href} scroll={false} title={`${c.name} · ${m.label}: ${v}`}
                    className="group flex items-center gap-2 text-xs">
                    <span className="w-16 shrink-0 text-muted group-hover:text-foreground">{c.name}</span>
                    <span className="flex h-4 flex-1 items-center">
                      <span className="h-3 rounded-r transition-opacity group-hover:opacity-80"
                        style={{ width: `${Math.max(v ? 2 : 0, (v / max) * 100)}%`, background: COMPANY_COLOR[c.id] }} />
                      <span className="ml-1.5 font-medium tabular-nums">{v}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// One 100% bar split in two, with both parts labelled in words and numbers.
export function SplitBar({ a, b, aLabel, bLabel, aHint, bHint }: {
  a: number; b: number; aLabel: string; bLabel: string; aHint: string; bHint: string;
}) {
  const total = Math.max(1, a + b);
  return (
    <div>
      <div className="flex h-7 gap-0.5 overflow-hidden rounded-md">
        <div className="flex items-center justify-start bg-accent px-2 text-xs font-semibold text-white" style={{ width: `${(a / total) * 100}%` }}
          title={`${aLabel}: ${a}`}>{Math.round((a / total) * 100)}%</div>
        <div className="flex items-center justify-end px-2 text-xs font-semibold text-foreground" style={{ width: `${(b / total) * 100}%`, background: LIGHT }}
          title={`${bLabel}: ${b}`}>{Math.round((b / total) * 100)}%</div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
        <div><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-accent align-middle" /><b>{a}</b> {aLabel}<div className="mt-0.5 text-muted">{aHint}</div></div>
        <div className="text-right"><b>{b}</b> {bLabel}<span className="ml-1.5 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: LIGHT }} /><div className="mt-0.5 text-muted">{bHint}</div></div>
      </div>
    </div>
  );
}

// Monthly columns, confirmed (dark) stacked under announced (light), with the total printed on top.
export function MonthBars({ rows }: { rows: { month: string; a: number; b: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.a + r.b));
  return (
    <div>
      <Legend items={[{ label: "Confirmed", color: "var(--accent)" }, { label: "Announced plan", color: LIGHT }]} />
      <div className="mt-3 flex h-44 items-end gap-1.5 border-b border-border">
        {rows.map((r) => (
          <div key={r.month} className="group flex h-full flex-1 flex-col items-center justify-end"
            title={`${monthLabel(r.month)}: ${r.a} confirmed, ${r.b} announced`}>
            <span className="mb-1 text-[10px] tabular-nums text-muted group-hover:text-foreground">{r.a + r.b}</span>
            <div className="flex w-full max-w-9 flex-col gap-0.5" style={{ height: `${((r.a + r.b) / max) * 85}%` }}>
              {r.b > 0 && <div className="w-full rounded-t" style={{ flex: r.b, background: LIGHT }} />}
              {r.a > 0 && <div className={`w-full bg-accent ${r.b ? "" : "rounded-t"}`} style={{ flex: r.a }} />}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5">
        {rows.map((r) => <span key={r.month} className="flex-1 text-center text-[10px] text-muted">{monthLabel(r.month)}</span>)}
      </div>
    </div>
  );
}

// Ranked single-series bars (one hue), value printed at the end of each bar.
export function RankBars({ rows, unit }: { rows: { label: string; n: number; href?: string }[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="space-y-1.5">
      {rows.map((r) => {
        const body = (
          <div className="group flex items-center gap-2 text-xs" title={`${r.label}: ${r.n}${unit ? " " + unit : ""}`}>
            <span className="w-40 shrink-0 truncate group-hover:text-accent">{r.label}</span>
            <span className="flex h-4 flex-1 items-center">
              <span className="h-3 rounded-r bg-accent" style={{ width: `${Math.max(2, (r.n / max) * 100)}%` }} />
              <span className="ml-1.5 font-medium tabular-nums">{r.n}</span>
            </span>
          </div>
        );
        return r.href ? <Link key={r.label} href={r.href} scroll={false} className="block">{body}</Link> : <div key={r.label}>{body}</div>;
      })}
    </div>
  );
}
