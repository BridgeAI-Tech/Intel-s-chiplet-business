import Link from "next/link";
import { Bar, Chip, MonthColumns, Panel, SectionTitle, SignalCard, Tile, href, monthLabel, type Params } from "@/components/dash";
import { Badge, Empty, SourceLink, Table, Td, humanize } from "@/components/ui";
import * as d from "@/lib/dashboard";

type Props = { p: Params; scope: string };

export async function Summary({ p, scope }: Props) {
  const [k, months, channels, domains, latest, matrix] = await Promise.all([
    d.summary(p.co), d.signalsByMonth(p.co), d.channelCoverage(p.co), d.topDomains(p.co),
    d.signals(p.co, { cls: "confirmed_fact", limit: 6 }), p.co ? Promise.resolve([]) : d.comparison(),
  ]);
  const maxChannel = Math.max(1, ...channels.map((c) => Number(c.n)));
  return (
    <>
      <SectionTitle n={1} title="Executive summary — what the evidence shows" scope={scope}>
        Custom-silicon activity, hiring, suppliers and Intel relationship evidence for {p.co ? scope : "all Module 1 companies"},
        computed only from records whose excerpt was found verbatim in a dated source inside the 12-month window.
      </SectionTitle>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-2 text-xs">
        <span className="font-mono font-semibold uppercase text-emerald-800">Evidence provenance · 100% source-verified</span>
        <span className="text-muted">{Number(k.signals) + Number(k.postings) + Number(k.relationships)} records · {k.sources} source documents</span>
        <span className="ml-auto font-mono uppercase text-muted">Verified sources:</span>
        {domains.map((x) => (
          <Link key={x.source_name} href={href(p, { tab: "evidence", platform: x.source_name })}
            className="rounded border border-border bg-surface px-2 py-0.5 hover:border-accent">{x.source_name} · {x.n}</Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Tile label="Verified signals" value={k.signals} />
        <Tile label="Confirmed facts" value={k.confirmed} note="Completed, officially attributed" />
        <Tile label="Press-released intent" value={k.intents} note="Planned, officially attributed" />
        <Tile label="Silicon job postings" value={k.postings} note="Vacancies, not hires" />
        <Tile label="Supplier / ecosystem links" value={k.relationships} />
        <Tile label="Source documents" value={k.sources} />
        <Tile label="SEC filings used" value={k.filings} />
      </div>

      <div className="mt-4">
        <Panel title="Key developments — latest confirmed facts" action={<Link href={href(p, { tab: "developments" })} className="text-xs text-accent">All developments →</Link>}>
          {latest.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{latest.map((s) => <SignalCard key={s.signal_id} s={s} />)}</div>
          ) : <Empty>No confirmed facts on record for this selection.</Empty>}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Monthly signal breakdown" note="By source publication month · dark = confirmed fact, light = press-released intent">
          {months.length ? <MonthColumns rows={months.map((m) => ({ month: m.month, a: Number(m.confirmed), b: Number(m.intent) }))} />
            : <Empty>No dated signals.</Empty>}
        </Panel>
        <Panel title="Data coverage by channel" note="Distinct source documents behind this selection">
          <div className="space-y-1.5">
            {channels.map((c) => <Bar key={c.source_type} label={humanize(c.source_type)} n={Number(c.n)} max={maxChannel}
              to={href(p, { tab: "evidence", channel: c.source_type })} />)}
          </div>
        </Panel>
      </div>

      {!p.co && (
        <div className="mt-4">
          <Panel title="Company comparison matrix" note="Counts of verified records per company. Click a company to filter every section.">
            <Table head={["Company", "Intel relationship", "Signals", "Confirmed", "Intent", "Job postings", "Ecosystem links", "Sources", "Latest source"]}>
              {matrix.map((r) => (
                <tr key={String(r.company_id)}>
                  <Td><Link href={href(p, { co: String(r.company_id) })} className="font-medium text-accent hover:underline">{r.short_name}</Link></Td>
                  <Td><Badge value={r.intel_relationship_status as string} /></Td>
                  <Td className="tabular-nums">{r.signals}</Td>
                  <Td className="tabular-nums">{r.confirmed}</Td>
                  <Td className="tabular-nums">{r.intents}</Td>
                  <Td className="tabular-nums">{Number(r.postings) || <span className="text-muted">not collected</span>}</Td>
                  <Td className="tabular-nums">{r.relationships}</Td>
                  <Td className="tabular-nums">{r.sources}</Td>
                  <Td className="whitespace-nowrap">{r.latest ?? "—"}</Td>
                </tr>
              ))}
            </Table>
          </Panel>
        </div>
      )}
    </>
  );
}

export async function Developments({ p, scope }: Props) {
  const category = p.category ?? undefined;
  const [cats, rows] = await Promise.all([d.signalCategories(p.co), d.signals(p.co, { category })]);
  const max = Math.max(1, ...cats.map((c) => Number(c.n)));
  return (
    <>
      <SectionTitle n={2} title="Silicon developments" scope={scope}>
        Programme milestones, product launches, partnerships, investment and capacity moves. Each card carries the
        verbatim excerpt from its source.
      </SectionTitle>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Panel title="By category" note="Click to filter">
          <div className="space-y-1.5">
            <Bar label={<b>All categories</b>} n={cats.reduce((a, c) => a + Number(c.n), 0)} max={cats.reduce((a, c) => a + Number(c.n), 0)} to={href(p, { category: null })} />
            {cats.map((c) => <Bar key={c.signal_type} label={humanize(c.signal_type)} n={Number(c.n)} max={max}
              to={href(p, { category: c.signal_type })} />)}
          </div>
        </Panel>
        <div>
          <div className="mb-2 text-xs text-muted">{rows.length} signals{category ? ` · ${humanize(category)}` : ""}</div>
          {rows.length ? <div className="grid gap-3 xl:grid-cols-2">{rows.map((s) => <SignalCard key={s.signal_id} s={s} />)}</div>
            : <Empty>No verified signals for this selection.</Empty>}
        </div>
      </div>
    </>
  );
}

export async function Hiring({ p, scope }: Props) {
  const { mix, trend, recent } = await d.hiringMix(p.co);
  const byCo = new Map<string, typeof mix>();
  mix.forEach((r) => byCo.set(r.short_name, [...(byCo.get(r.short_name) ?? []), r]));
  return (
    <>
      <SectionTitle n={3} title="Hiring intelligence" scope={scope}>
        Silicon-engineering job postings (RTL, verification, physical design, DFT, packaging, process…). Each posting
        was classified from its own description; vacancies are not confirmed hires.
      </SectionTitle>
      {!mix.length ? <Empty>Hiring data not collected for this company in the sample (collected: Cerebras, AWS, Tesla, Tenstorrent).</Empty> : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Engineering role mix">
              <div className="space-y-4">
                {[...byCo.entries()].map(([name, rs]) => {
                  const total = rs.reduce((a, r) => a + Number(r.n), 0);
                  return (
                    <div key={name}>
                      <div className="mb-1 flex justify-between text-sm font-medium"><span>{name}</span><span className="tabular-nums text-muted">{total} postings</span></div>
                      <div className="space-y-1">{rs.map((r) => <Bar key={r.role_category} label={humanize(r.role_category)} n={Number(r.n)} max={total} />)}</div>
                    </div>
                  );
                })}
              </div>
            </Panel>
            <Panel title="Posting trend" note="Postings by posting date (or first-observed date where the provider gives none)">
              <MonthColumns rows={trend.filter((t) => t.month >= "2025-11").map((t) => ({ month: t.month, a: Number(t.n) }))} />
            </Panel>
          </div>
          <div className="mt-4">
            <Panel title="Recent openings">
              <Table head={["Posted / first seen", "Company", "Role", "Category", "Location", "Source"]}>
                {recent.map((j) => (
                  <tr key={String(j.posting_id)}>
                    <Td className="whitespace-nowrap">{j.posting_date ?? j.first_observed_date}</Td>
                    <Td>{j.short_name}</Td>
                    <Td><span title={`Original title: ${j.original_title}`}>{j.normalised_title ?? j.original_title}</span>
                      <div className="text-xs text-muted">{j.seniority ? humanize(j.seniority) : ""}</div></Td>
                    <Td>{j.role_category ? humanize(j.role_category) : "—"}</Td>
                    <Td className="text-xs">{j.location ?? "—"}</Td>
                    <Td>{j.url ? <SourceLink url={j.url} label={j.provider === "predictleads" ? "PredictLeads" : "amazon.jobs"} /> : j.provider}</Td>
                  </tr>
                ))}
              </Table>
            </Panel>
          </div>
        </>
      )}
    </>
  );
}

export async function Ecosystem({ p, scope }: Props) {
  const rows = await d.ecosystem(p.co);
  const partners = new Map<string, number>();
  rows.forEach((r) => partners.set(String(r.partner), (partners.get(String(r.partner)) ?? 0) + 1));
  const top = [...partners.entries()].sort((a, b) => b[1] - a[1]);
  return (
    <>
      <SectionTitle n={4} title="Supplier & ecosystem" scope={scope}>
        Foundry, packaging, memory, IP, EDA and design partners named in verified sources. No undisclosed supplier is inferred.
      </SectionTitle>
      {!rows.length ? <Empty>No supplier or ecosystem relationship found in verified sources.</Empty> : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <Panel title="Partners named">
            <div className="space-y-1.5">{top.map(([n, c]) => <Bar key={n} label={n} n={c} max={top[0][1]} />)}</div>
          </Panel>
          <Panel title="Relationships with evidence">
            <Table head={["Company", "Partner", "Relationship", "Stage", "Evidence", "Source"]}>
              {rows.map((r) => (
                <tr key={String(r.relationship_id)}>
                  <Td className="font-medium">{r.short_name}</Td>
                  <Td>{r.partner}<div className="text-xs text-muted">{humanize(String(r.supplier_category))}</div></Td>
                  <Td>{humanize(String(r.relationship_type))}
                    {r.excerpt && <div className="mt-1 text-xs text-muted">“{r.excerpt}”</div>}</Td>
                  <Td>{r.commercial_stage ? humanize(r.commercial_stage) : "—"}</Td>
                  <Td><Badge value={r.evidence_class} /><div className="text-xs text-muted">{r.event_date ?? r.publication_date}</div></Td>
                  <Td>{r.url ? <SourceLink url={r.url} label={r.source_name} /> : "—"}</Td>
                </tr>
              ))}
            </Table>
          </Panel>
        </div>
      )}
    </>
  );
}

export async function IntelRelationship({ p, scope }: Props) {
  const rows = await d.intelEvidence(p.co);
  const byCo = new Map<string, typeof rows>();
  rows.forEach((r) => byCo.set(String(r.short_name), [...(byCo.get(String(r.short_name)) ?? []), r]));
  return (
    <>
      <SectionTitle n={5} title="Intel relationship" scope={scope}>
        Existing Intel relationships backed by quoted sources. Where no source is on file the status is a research
        classification only. Intel-relevance mapping is part of the assessment rules (pending).
      </SectionTitle>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[...byCo.entries()].map(([name, rs]) => (
          <Panel key={name} title={name} action={<Badge value={rs[0].intel_relationship_status} />}>
            {rs.some((r) => r.link) ? rs.filter((r) => r.link).map((r) => {
              const l = JSON.parse(String(r.link));
              return (
                <blockquote key={String(r.url) + l.excerpt} className="mb-2 border-l-2 border-accent pl-2 text-sm">
                  “{l.excerpt}”
                  <div className="mt-1 text-xs text-muted"><SourceLink url={String(r.url)} label={r.source_name} /> · {r.publication_date ?? "undated"} · <Badge value={l.evidence_class} /></div>
                </blockquote>
              );
            }) : <p className="text-sm text-muted">No Intel relationship evidence on file.</p>}
          </Panel>
        ))}
      </div>
    </>
  );
}

export async function Filings({ p, scope }: Props) {
  const rows = await d.signals(p.co, { sourceType: "regulatory_filing" });
  return (
    <>
      <SectionTitle n={6} title="Filings & disclosures" scope={scope}>
        Statements taken from SEC filings (10-K, 10-Q, IPO prospectus, earnings-release exhibits). Filing dates come from
        the SEC EDGAR index. Amazon filings count for AWS only where the statement names AWS or its chips.
      </SectionTitle>
      {rows.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map((s) => <SignalCard key={s.signal_id} s={s} />)}</div>
        : <Empty>No filing-sourced signals for this selection. SEC filings were read in depth for Cerebras, AWS (Amazon) and Tesla; other companies are private, foreign filers or not yet covered.</Empty>}
    </>
  );
}

export async function Assessment({ scope }: Props) {
  return (
    <>
      <SectionTitle n={7} title="Assessment & Intel mapping" scope={scope} />
      <Panel title="Pending — assessment criteria from the research team">
        <p className="text-sm">
          Development stage, Intel relevance (foundry, design/IP, advanced packaging) and the 3–5 company shortlist will
          be computed from the evidence in sections 2–6 once the scoring and qualification rules are agreed.
          No score is shown until then, so nothing on this dashboard is a judgement the rules have not made.
        </p>
      </Panel>
    </>
  );
}

export async function EvidenceLake({ p, scope }: Props) {
  const { rows, channels, platforms } = await d.evidenceLake(p.co, { channel: p.channel ?? undefined, platform: p.platform ?? undefined });
  const total = channels.reduce((a, c) => a + Number(c.n), 0);
  return (
    <>
      <SectionTitle n={8} title="Evidence & source lake" scope={scope}>
        The source documents every number on this dashboard is computed from, filtered by company, channel and platform.
      </SectionTitle>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] uppercase text-muted">Channel</span>
        <Chip to={href(p, { channel: null, platform: null })} active={!p.channel}>All · {total}</Chip>
        {channels.map((c) => <Chip key={c.source_type} to={href(p, { channel: c.source_type, platform: null })} active={p.channel === c.source_type}>{humanize(c.source_type)} · {c.n}</Chip>)}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] uppercase text-muted">Platform</span>
        <Chip to={href(p, { platform: null })} active={!p.platform}>All</Chip>
        {platforms.map((x) => <Chip key={x.source_name} to={href(p, { platform: x.source_name })} active={p.platform === x.source_name}>{x.source_name} · {x.n}</Chip>)}
      </div>
      <div className="mb-4 grid gap-3 rounded-xl border border-border bg-surface p-4 text-xs md:grid-cols-3">
        <div><b className="font-mono uppercase">1. Raw provider responses</b><p className="mt-1 text-muted">Exa, SEC EDGAR, PredictLeads, amazon.jobs and Explorium responses are stored untouched, with request parameters and fetch time.</p></div>
        <div><b className="font-mono uppercase">2. Extraction + deterministic checks</b><p className="mt-1 text-muted">Gemini extracts structured records; a record is published only if its excerpt is found verbatim in the source and its date is stated in the document and inside the window.</p></div>
        <div><b className="font-mono uppercase">3. Dashboard & Ask AI</b><p className="mt-1 text-muted">Counts and charts are computed from the published records; Ask AI answers only from them, with citations.</p></div>
      </div>
      <div className="mb-2 text-xs text-muted">Showing {rows.length} most recent of the selection</div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((r) => (
          <article key={String(r.source_id)} className="flex flex-col rounded-xl border border-border bg-surface p-4 text-sm">
            <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="font-mono text-muted">{String(r.source_id).toUpperCase().slice(0, 16)}</span>
              {String(r.companies).split(",").map((c) => <span key={c} className="rounded bg-foreground px-1.5 py-0.5 text-white">{c}</span>)}
              <span className="rounded border border-border px-1.5 py-0.5">{humanize(String(r.source_type))}</span>
            </div>
            <SourceLink url={String(r.url)} label={String(r.title ?? r.url)} />
            {r.excerpt && !String(r.excerpt).startsWith("{") && <p className="mt-2 line-clamp-4 text-xs text-muted">“{r.excerpt}”</p>}
            <dl className="mt-auto grid grid-cols-3 gap-2 pt-3 text-[11px]">
              <div><dt className="font-mono uppercase text-muted">Published</dt><dd>{r.publication_date ?? "—"}</dd></div>
              <div><dt className="font-mono uppercase text-muted">Collected</dt><dd>{r.collected_date}</dd></div>
              <div><dt className="font-mono uppercase text-muted">Supports</dt><dd>{r.records} {String(r.via).split(",").map(humanize).join(", ").toLowerCase()}</dd></div>
            </dl>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-[11px]">
              <span className="text-emerald-700">✓ Excerpt verified in source</span>
              <Link href={`/evidence?id=${r.source_id}`} className="text-accent">Record lineage →</Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export async function DataSources({ p, scope }: Props) {
  const { byProvider, runs } = await d.providers(p.co);
  const NAMES: Record<string, [string, string]> = {
    exa: ["Exa search", "Official newsrooms, partner newsrooms and trusted trade press"],
    sec_edgar: ["SEC EDGAR", "10-K, 10-Q, 8-K exhibits, IPO prospectus — read in full"],
    gemini: ["Gemini extraction", "Structured extraction and job classification (temperature 0, schema-validated)"],
    predictleads: ["PredictLeads", "Job postings history (Cerebras, Tesla, Tenstorrent)"],
    amazon_jobs: ["amazon.jobs", "AWS / Annapurna Labs open roles"],
    explorium: ["Explorium", "Firmographics: domain, LinkedIn, HQ, business units"],
    google_news: ["Google News RSS", "Probe only — not used as evidence"],
  };
  return (
    <>
      <SectionTitle title="Data sources & provider health" scope={scope}>
        Providers behind this dashboard and the pipeline runs that populated it. API keys stay server-side.
      </SectionTitle>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {byProvider.map((r) => (
          <Panel key={r.provider} title={NAMES[r.provider]?.[0] ?? r.provider}
            action={<span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] text-emerald-800">CONNECTED</span>}>
            <p className="text-xs text-muted">{NAMES[r.provider]?.[1] ?? ""}</p>
            <div className="mt-2 text-xs"><b className="tabular-nums">{r.calls}</b> stored responses · {r.ok} OK · last {String(r.last).slice(0, 10)}</div>
          </Panel>
        ))}
      </div>
      <div className="mt-4">
        <Panel title="Latest pipeline runs">
          <Table head={["Pipeline", "Started", "Status", "Records published"]}>
            {runs.map((r) => (
              <tr key={String(r.started_at) + r.pipeline}>
                <Td>{humanize(String(r.pipeline))}</Td><Td>{String(r.started_at).slice(0, 16).replace("T", " ")}</Td>
                <Td>{r.status}</Td><Td className="tabular-nums">{r.records_out ?? "—"}</Td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
    </>
  );
}

export { monthLabel };
