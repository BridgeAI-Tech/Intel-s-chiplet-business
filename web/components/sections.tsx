import Link from "next/link";
import { CompareBars, MonthBars, RankBars, SplitBar } from "@/components/charts";
import { Bar, Chip, MonthColumns, Panel, SectionTitle, SignalCard, Tile, href, monthLabel, type Params } from "@/components/dash";
import { Badge, Empty, SourceLink, Table, Td, humanize } from "@/components/ui";
import * as d from "@/lib/dashboard";
import * as m2 from "@/lib/m2";

type Props = { p: Params; scope: string };

export async function Summary({ p, scope }: Props) {
  const [k, months, channels, cats, partners, roles, latest, matrix, companies] = await Promise.all([
    d.summary(p.co), d.signalsByMonth(p.co), d.channelCoverage(p.co), d.signalCategories(p.co), d.topPartners(p.co),
    d.hiringRoles(p.co), d.signals(p.co, { cls: "confirmed_fact", limit: 3 }), d.comparison(), d.moduleCompanies(),
  ]);
  const n = (v: unknown) => Number(v ?? 0);
  const one = p.co ? matrix.find((m) => m.company_id === p.co) : null;
  return (
    <>
      <SectionTitle title={p.co ? `${scope} at a glance` : "Overview"} scope={scope}>
        {p.co
          ? `Everything we found about ${scope}'s own chips in the last 12 months: what it built or announced, who it works with, and who it is hiring.`
          : "Three companies building their own chips — Cerebras, AWS and Tesla. See what each has built or announced in the last 12 months, who supplies them, and who they are hiring."}
      </SectionTitle>

      <ol className="mb-5 grid gap-2 rounded-xl border border-border bg-surface p-3 text-sm sm:grid-cols-3">
        {[
          ["Pick a company", "Use the company buttons above, or keep \"All three\" to compare."],
          ["Read the charts", "Every number is a count of real records — nothing is estimated."],
          ["Open the proof", "Click any card to see the exact sentence and the original source."],
        ].map(([t, s], i) => (
          <li key={t} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">{i + 1}</span>
            <span><b>{t}</b><span className="block text-xs text-muted">{s}</span></span>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Tile label="Chip developments" value={k.signals} note="News, filings and announcements found" />
        <Tile label="Confirmed" value={k.confirmed} note="Already happened, officially stated" />
        <Tile label="Announced plans" value={k.intents} note="Officially announced, not yet done" />
        <Tile label="Chip-engineering jobs" value={k.postings} note="Open roles (vacancies, not hires)" />
        <Tile label="Partners & suppliers" value={k.relationships} note="Links named in the sources" />
        <Tile label="Sources checked" value={k.sources} note={`Incl. ${k.filings} SEC filings`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {p.co && one ? (
          <Panel title={`${scope} snapshot`} note="The key facts in one place">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Fact label="Relationship with Intel"><Badge value={one.intel_relationship_status as string} /></Fact>
              <Fact label="Latest development">{one.latest ?? "—"}</Fact>
              <Fact label="Partner named most">{partners[0] ? `${partners[0].partner} (${partners[0].n})` : "—"}</Fact>
              <Fact label="Most-hired area">{roles[0] ? `${humanize(roles[0].role_category)} (${roles[0].n})` : "Not collected"}</Fact>
            </dl>
            <Link href={`/companies/${p.co}`} className="mt-3 inline-block text-xs text-accent">Full company profile →</Link>
          </Panel>
        ) : (
          <Panel title="How the three companies compare" note="Click a bar to open that company">
            <CompareBars
              companies={companies.map((c) => ({ id: c.company_id, name: c.short_name, href: href(p, { co: c.company_id }) }))}
              measures={[
                { label: "Chip developments", hint: "news, filings, announcements", values: Object.fromEntries(matrix.map((m) => [String(m.company_id), n(m.signals)])) },
                { label: "Chip-engineering jobs", hint: "open roles", values: Object.fromEntries(matrix.map((m) => [String(m.company_id), n(m.postings)])) },
                { label: "Partners & suppliers", hint: "named in sources", values: Object.fromEntries(matrix.map((m) => [String(m.company_id), n(m.relationships)])) },
              ]} />
          </Panel>
        )}
        <div className="grid gap-4">
          <Panel title="How certain is it?" note="Every development is either confirmed or an announced plan">
            <SplitBar a={n(k.confirmed)} b={n(k.intents)} aLabel="confirmed" bLabel="announced plans"
              aHint="Happened — stated by the company, a partner or a filing" bHint="Planned — officially announced, not proof it happened" />
          </Panel>
          <Panel title="Where the evidence comes from" note="Click to see those sources">
            <RankBars rows={channels.map((c) => ({ label: humanize(c.source_type), n: n(c.n), href: href(p, { tab: "evidence", channel: c.source_type }) }))} unit="sources" />
          </Panel>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Activity month by month" note="Developments by the month the source was published">
          {months.length ? <MonthBars rows={months.map((m) => ({ month: m.month, a: n(m.confirmed), b: n(m.intent) }))} /> : <Empty>No dated developments.</Empty>}
        </Panel>
        <Panel title="What kind of activity" note="Click a type to see those developments">
          <RankBars rows={cats.map((c) => ({ label: humanize(c.signal_type), n: n(c.n), href: href(p, { tab: "developments", category: c.signal_type }) }))} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Partners & suppliers named most" note="Foundries, packaging, memory, chip-design software and design partners">
          {partners.length ? <RankBars rows={partners.map((x) => ({ label: x.partner, n: n(x.n), href: href(p, { tab: "ecosystem" }) }))} unit="mentions" />
            : <Empty>No partners named in the sources.</Empty>}
        </Panel>
        <Panel title="Which chip-engineering skills they hire for" note="Open job postings by type of role">
          {roles.length ? <RankBars rows={roles.map((r) => ({ label: humanize(r.role_category), n: n(r.n), href: href(p, { tab: "hiring" }) }))} unit="jobs" />
            : <Empty>Job postings were not collected for this company.</Empty>}
        </Panel>
      </div>

      {!p.co && <CompetitorStrip />}

      <div className="mt-4">
        <Panel title="Latest confirmed developments" action={<Link href={href(p, { tab: "developments" })} className="text-xs text-accent">See all →</Link>}>
          {latest.length ? <div className="grid gap-3 md:grid-cols-3">{latest.map((s) => <SignalCard key={s.signal_id} s={s} />)}</div>
            : <Empty>No confirmed developments for this selection.</Empty>}
        </Panel>
      </div>
    </>
  );
}

// Module 2 at a glance on the main overview: where competitors are landing custom-silicon business.
async function CompetitorStrip() {
  const [k, comp, recent] = await Promise.all([m2.m2Summary(null), m2.byCompetitor(), m2.m2Events(null, { cls: "confirmed_fact", limit: 40 })]);
  const seen = new Set<string>();
  const latest = recent.filter((e) => !seen.has(e.company_id) && seen.add(e.company_id)).slice(0, 3);
  const n = (v: unknown) => Number(v ?? 0);
  return (
    <div className="mt-4">
      <Panel title="Meanwhile, competitors (Competitive Radar)" note="Broadcom, Marvell, TSMC, AMD, NVIDIA, Arm and Samsung Foundry — official announcements and filings"
        action={<Link href="/competitive-radar" className="text-xs text-accent">Open Competitive Radar →</Link>}>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr]">
          <div className="grid grid-cols-2 gap-2 self-start">
            <Tile label="Competitive events" value={k.events ?? 0} />
            <Tile label="Confirmed" value={k.confirmed ?? 0} />
            <Tile label="Announced plans" value={k.intents ?? 0} />
            <Tile label="Partners named" value={k.counterparties ?? 0} />
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-muted">Events by competitor</div>
            <RankBars rows={comp.map((c) => ({ label: c.short_name, n: n(c.n), href: `/competitive-radar?co=${c.company_id}` }))} unit="events" />
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-muted">Latest confirmed move per competitor</div>
            <ul className="space-y-2 text-sm">
              {latest.map((e) => (
                <li key={e.event_id} className="rounded-lg border border-border p-2">
                  <div className="flex items-center gap-2 text-xs text-muted"><b className="text-foreground">{e.short_name}</b>{humanize(e.event_type)} · {e.event_date ?? e.publication_date}</div>
                  <Link href={`/events/m2_event/${e.event_id}`} className="font-medium hover:underline">{e.event_title}</Link>
                </li>
              ))}
            </ul>
            <Link href="/competitive-radar?tab=shortlist" className="mt-2 inline-block text-xs text-accent">10 events shortlisted for research review →</Link>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-xs text-muted">{label}</dt><dd className="mt-0.5 font-medium">{children}</dd></div>;
}

export async function Developments({ p, scope }: Props) {
  const category = p.category ?? undefined;
  const [cats, rows] = await Promise.all([d.signalCategories(p.co), d.signals(p.co, { category })]);
  const max = Math.max(1, ...cats.map((c) => Number(c.n)));
  return (
    <>
      <SectionTitle n={2} title="Developments" scope={scope}>
        What each company built, launched or announced — new chips, milestones, partnerships, funding and manufacturing.
        Each card shows the exact sentence from its source.
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
          <div className="mb-2 text-xs text-muted">{rows.length} developments{category ? ` · ${humanize(category)}` : ""}</div>
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
      <SectionTitle n={3} title="Hiring" scope={scope}>
        Open chip-engineering jobs, grouped by the skill they ask for. A company hiring chip designers is a sign it is
        building its own chips. These are open vacancies, not confirmed hires.
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
      <SectionTitle n={4} title="Partners & suppliers" scope={scope}>
        Who makes, packages and helps design each company's chips, as named in the sources. We never guess a supplier that is not named.
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
        Existing ties between each company and Intel, with the quote that proves it. Where there is no quote, the label
        is our research classification only.
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
      <SectionTitle n={6} title="SEC filings" scope={scope}>
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
      <SectionTitle n={7} title="Scoring" scope={scope} />
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
      <SectionTitle n={8} title="All sources" scope={scope}>
        Every source document behind the numbers. Filter by type of source or by website.
      </SectionTitle>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Type of source</span>
        <Chip to={href(p, { channel: null, platform: null })} active={!p.channel}>All · {total}</Chip>
        {channels.map((c) => <Chip key={c.source_type} to={href(p, { channel: c.source_type, platform: null })} active={p.channel === c.source_type}>{humanize(c.source_type)} · {c.n}</Chip>)}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Website</span>
        <Chip to={href(p, { platform: null })} active={!p.platform}>All</Chip>
        {platforms.map((x) => <Chip key={x.source_name} to={href(p, { platform: x.source_name })} active={p.platform === x.source_name}>{x.source_name} · {x.n}</Chip>)}
      </div>
      <div className="mb-4 grid gap-3 rounded-xl border border-border bg-surface p-4 text-xs md:grid-cols-3">
        <div><b>1. Collected</b><p className="mt-1 text-muted">News sites, company newsrooms, SEC filings and job sites are collected and stored unchanged.</p></div>
        <div><b>2. Checked</b><p className="mt-1 text-muted">AI reads each document; a finding is kept only if its exact sentence is in the source and the source gives a date in the last 12 months.</p></div>
        <div><b>3. Shown</b><p className="mt-1 text-muted">Charts count only the kept findings; Ask Intelligence answers only from them, with sources.</p></div>
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
              <span className="text-emerald-700">✓ Checked against source</span>
              <Link href={`/evidence?id=${r.source_id}`} className="text-accent">Details →</Link>
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
      <SectionTitle title="Where the data comes from" scope={scope}>
        The services we collect from and when they last ran.
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
