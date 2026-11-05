import Link from "next/link";
import type { ReactNode } from "react";
import { Panel, Tile } from "@/components/dash";
import { Empty, SourceLink, Table, Td } from "@/components/ui";
import type { Assessed, Config } from "@/lib/scoring";

export const OUTCOME: Record<string, { label: string; tone: string }> = {
  qualified: { label: "Qualified", tone: "border-emerald-300 bg-emerald-50 text-emerald-800" },
  conditional: { label: "Conditional", tone: "border-amber-300 bg-amber-50 text-amber-900" },
  not_qualified_q1: { label: "Not qualified (Q1)", tone: "border-rose-300 bg-rose-50 text-rose-800" },
  not_qualified_fit: { label: "Not qualified (fit)", tone: "border-rose-300 bg-rose-50 text-rose-800" },
};
export const RELEVANCE: Record<string, { label: string; tone: string }> = {
  direct_fit: { label: "Direct Fit", tone: "border-emerald-300 bg-emerald-50 text-emerald-800" },
  adjacent_fit: { label: "Adjacent Fit", tone: "border-sky-300 bg-sky-50 text-sky-800" },
  no_identified_fit: { label: "No Identified Fit", tone: "border-slate-300 bg-slate-50 text-slate-600" },
};
const CONF: Record<string, string> = { high: "High", medium: "Medium", low: "Low" };
const ANSWER: Record<string, { label: string; tone: string }> = {
  yes: { label: "Yes", tone: "text-emerald-700" }, needs_validation: { label: "Needs validation", tone: "text-amber-700" }, no: { label: "No", tone: "text-rose-700" },
};

export function Pill({ tone, children, title }: { tone: string; children: ReactNode; title?: string }) {
  return <span title={title} className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}>{children}</span>;
}

function TierPill({ tier, cfg }: { tier: number; cfg: Config }) {
  const tone = tier === 1 ? "border-emerald-300 bg-emerald-50 text-emerald-800" : tier === 2 ? "border-sky-300 bg-sky-50 text-sky-800"
    : tier === 3 ? "border-amber-300 bg-amber-50 text-amber-900" : "border-slate-300 bg-slate-50 text-slate-600";
  return <Pill tone={tone} title={cfg.tiers.find((t) => t.tier === tier)?.label}>Tier {tier}</Pill>;
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2" title={`${score} / 100`}>
      <span className="w-10 text-right font-semibold tabular-nums">{score}</span>
      <span className="h-2 w-20 rounded bg-accent-soft"><span className="block h-2 rounded bg-accent" style={{ width: `${score}%` }} /></span>
    </div>
  );
}

export function AssessmentTable({ rows, cfg, link }: { rows: Assessed[]; cfg: Config; link: (id: string) => string }) {
  const cat = (r: Assessed, k: string) => r.mappings.find((m) => m.category === k)?.relevance ?? "no_identified_fit";
  return (
    <Table head={["Company", "Development stage", "Score /100", "Tier", "Evidence confidence", "Qualification",
      ...cfg.mapping.categories.map((c) => c.label.split(" / ")[0] + (c.key === "design_ip" ? " / IP" : "")), ""]}>
      {rows.map((r) => (
        <tr key={r.company_id}>
          <Td><Link href={link(r.company_id)} className="font-medium text-accent hover:underline">{r.short_name}</Link></Td>
          <Td className="whitespace-nowrap">{r.development_stage} · {cfg.development_stages.find((s) => s.stage === r.development_stage)?.label}</Td>
          <Td><ScoreBar score={r.score} /></Td>
          <Td><TierPill tier={r.tier} cfg={cfg} /></Td>
          <Td>{CONF[r.evidence_confidence] ?? r.evidence_confidence}</Td>
          <Td><Pill tone={OUTCOME[r.outcome].tone}>{OUTCOME[r.outcome].label}</Pill></Td>
          {cfg.mapping.categories.map((c) => <Td key={c.key}><Pill tone={RELEVANCE[cat(r, c.key)].tone}>{RELEVANCE[cat(r, c.key)].label}</Pill></Td>)}
          <Td><Link href={link(r.company_id)} className="text-xs text-accent">Details →</Link></Td>
        </tr>
      ))}
    </Table>
  );
}

export function Shortlist({ ranked, cfg, link }: { ranked: Assessed[]; cfg: Config; link: (id: string) => string }) {
  const qualified = ranked.filter((r) => r.outcome === "qualified");
  const shortlist = qualified.slice(0, cfg.shortlist.shortlist_max);
  const conditional = ranked.filter((r) => r.outcome === "conditional");
  return (
    <Panel title={`Prospect shortlist (target ${cfg.shortlist.shortlist_min}–${cfg.shortlist.shortlist_max})`}
      note="Qualified companies only, ordered by score and tier, development stage, evidence confidence, then Intel portfolio fit. Not by score alone.">
      {shortlist.length ? (
        <ol className="space-y-2">
          {shortlist.map((r, i) => (
            <li key={r.company_id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">{i + 1}</span>
              <Link href={link(r.company_id)} className="font-semibold text-accent hover:underline">{r.short_name}</Link>
              <span className="tabular-nums">{r.score}</span><TierPill tier={r.tier} cfg={cfg} />
              <span className="text-xs text-muted">Stage {r.development_stage} · {CONF[r.evidence_confidence]} confidence</span>
              {i === 0 && <Pill tone="border-accent bg-accent-soft text-accent">Deep-dive candidate</Pill>}
            </li>
          ))}
        </ol>
      ) : <Empty>No company passes all three qualification questions yet.</Empty>}
      {shortlist.length < cfg.shortlist.shortlist_min && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
          Only {shortlist.length} {shortlist.length === 1 ? "company is" : "companies are"} fully qualified — below the target of {cfg.shortlist.shortlist_min}.
          {conditional.length ? ` ${conditional.length} Conditional ${conditional.length === 1 ? "company needs" : "companies need"} one more question validated (listed below) before they can join the shortlist.` : ""}
        </p>
      )}
      {conditional.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 text-xs font-medium text-muted">Conditional — retain for monitoring / validation</div>
          <div className="flex flex-wrap gap-1.5">
            {conditional.map((r) => <Link key={r.company_id} href={link(r.company_id)} className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-900 hover:underline">{r.short_name} · {r.score}</Link>)}
          </div>
        </div>
      )}
    </Panel>
  );
}

export function AssessmentDetail({ a, cfg, records }: {
  a: Assessed; cfg: Config;
  records: Map<string, { label: string; href: string; date: string | null; cls: string | null; url: string | null }>;
}) {
  const Refs = ({ ids }: { ids: string[] }) => ids.length ? (
    <ul className="mt-1 space-y-0.5">
      {ids.map((id) => { const r = records.get(id); return r ? (
        <li key={id} className="text-xs"><Link href={r.href} className="text-accent hover:underline">{r.label}</Link>
          <span className="text-muted">{r.date ? ` · ${r.date}` : ""}{r.cls ? ` · ${r.cls === "confirmed_fact" ? "confirmed" : "announced plan"}` : ""}</span>
          {r.url && <> · <SourceLink url={r.url} label="source" /></>}</li>) : null; })}
    </ul>) : <p className="mt-1 text-xs text-muted">No supporting record.</p>;
  const stage = cfg.development_stages.find((s) => s.stage === a.development_stage);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Tile label="Overall score" value={`${a.score} / 100`} />
        <Tile label="Score tier" value={`Tier ${a.tier}`} note={cfg.tiers.find((t) => t.tier === a.tier)?.label} />
        <Tile label="Development stage" value={`${a.development_stage} of 5`} note={stage?.label} />
        <Tile label="Evidence confidence" value={CONF[a.evidence_confidence]} note={`${Math.round(a.primary_share * 100)}% primary sources`} />
        <Tile label="Qualification" value={OUTCOME[a.outcome].label} />
        <Tile label="Framework" value={a.framework_version} note={`Assessed ${a.assessed_at.slice(0, 10)}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Custom-silicon activity">
          <p className="text-sm">{a.custom_silicon_activity}</p>
        </Panel>
        <Panel title={`Development stage ${a.development_stage} — ${stage?.label}`} note={stage?.criteria}>
          <p className="text-sm">{a.stage_rationale}</p>
          <Refs ids={a.stage_record_ids} />
        </Panel>
      </div>

      <Panel title="Weighted market signal score" note="Each dimension rated 1–5; points = rating ÷ 5 × weight (weights from Settings)">
        <Table head={["Dimension", "Weight", "Rating", "Points", "Why (with supporting records)"]}>
          {cfg.dimensions.map((d) => {
            const r = a.ratings[d.key];
            return (
              <tr key={d.key}>
                <Td className="font-medium">{d.label}</Td>
                <Td className="tabular-nums">{d.weight}%</Td>
                <Td className="whitespace-nowrap"><b className="tabular-nums">{r.rating}</b>/5 <span className="text-xs text-muted">{cfg.rating_scale.find((s) => s.rating === r.rating)?.label}</span>
                  {r.insufficient && <div className="mt-1"><Pill tone="border-amber-300 bg-amber-50 text-amber-900" title="Job postings were not collected for this company">Insufficient data</Pill></div>}</Td>
                <Td className="tabular-nums">{Math.round((r.rating / 5) * d.weight * 10) / 10}</Td>
                <Td><p className="text-xs">{r.rationale}</p><Refs ids={r.record_ids} /></Td>
              </tr>
            );
          })}
          <tr><Td className="font-semibold">Total</Td><Td>100%</Td><Td>—</Td><Td className="font-semibold tabular-nums">{a.score}</Td><Td>{" "}</Td></tr>
        </Table>
      </Panel>

      <Panel title={`Qualification — ${OUTCOME[a.outcome].label}`} note={cfg.qualification.outcomes[a.outcome]}>
        <div className="grid gap-3 md:grid-cols-3">
          {cfg.qualification.questions.map((q) => {
            const v = a.qualification[q.key];
            return (
              <div key={q.key} className="rounded-lg border border-border p-3">
                <div className="text-xs font-semibold uppercase text-muted">{q.key.toUpperCase()} · {q.label}</div>
                <div className="mt-1 text-xs text-muted">{q.question}</div>
                <div className={`mt-2 text-sm font-semibold ${ANSWER[v.answer].tone}`}>{ANSWER[v.answer].label}
                  <span className="ml-2 text-xs font-normal text-muted">requirement {v.requirement_status}</span></div>
                <p className="mt-1 text-xs">{v.rationale}</p>
                <Refs ids={v.record_ids} />
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Intel portfolio mapping" note="Potential areas of alignment — not confirmation that the company requires or intends to procure Intel services">
        <div className="grid gap-3 lg:grid-cols-3">
          {a.mappings.map((m) => (
            <div key={m.category} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{cfg.mapping.categories.find((c) => c.key === m.category)?.label}</span>
                <Pill tone={RELEVANCE[m.relevance].tone}>{RELEVANCE[m.relevance].label}</Pill>
              </div>
              <dl className="mt-2 space-y-1.5 text-xs">
                <div><dt className="text-muted">Company activity</dt><dd>{m.activity}</dd></div>
                <div><dt className="text-muted">Requirement ({m.requirement_status})</dt><dd>{m.requirement}</dd></div>
                <div><dt className="text-muted">Intel offering</dt><dd>{m.offering_name ? <>{m.offering_name}{m.offering_url && <> · <SourceLink url={m.offering_url} label="intel.com" /></>}</> : "None identified"}</dd></div>
                {m.offering_excerpt && <blockquote className="border-l-2 border-accent pl-2 text-muted">“{m.offering_excerpt}”</blockquote>}
                <div><dt className="text-muted">Why</dt><dd>{m.rationale}</dd></div>
              </dl>
              <Refs ids={JSON.parse(m.record_ids || "[]")} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Opportunity interpretation">
        <p className="text-sm">{a.opportunity_interpretation}</p>
        {a.checks.length > 0 && (
          <details className="mt-3 text-xs text-muted">
            <summary className="cursor-pointer">Rule checks applied automatically ({a.checks.length})</summary>
            <ul className="mt-1 list-disc pl-5">{a.checks.map((c) => <li key={c}>{c}</li>)}</ul>
          </details>
        )}
      </Panel>
    </div>
  );
}
