import Link from "next/link";
import { MonthBars, RankBars, SplitBar } from "@/components/charts";
import { Chip, Panel, SectionTitle, Tile } from "@/components/dash";
import { Badge, Empty, SourceLink, Table, Td, humanize } from "@/components/ui";
import { WINDOW } from "@/lib/dashboard";
import * as m from "@/lib/m2";
import SHORTLIST from "@/lib/m2-shortlist.json";

const TABS = [
  { key: "overview", label: "Overview", hint: "Charts and key numbers" },
  { key: "events", label: "Events", hint: "Every competitive development, with its source sentence" },
  { key: "tracker", label: "Foundry & packaging tracker", hint: "Process nodes, chiplets and advanced packaging" },
  { key: "shortlist", label: "Shortlist for review", hint: "10 representative events selected for the research team" },
] as const;
const TRACKER_TYPES = ["foundry_process_manufacturing", "chiplet_advanced_packaging"];

type P = { tab: string; co: string | null; type: string | null };
function href(p: P, change: Partial<P>) {
  const next = { ...p, ...change };
  const qs = new URLSearchParams();
  if (next.tab && next.tab !== "overview") qs.set("tab", next.tab);
  if (next.co) qs.set("co", next.co);
  if (next.type) qs.set("type", next.type);
  const s = qs.toString();
  return s ? `/competitive-radar?${s}` : "/competitive-radar";
}

export const instant = false;

export default async function CompetitiveRadar({ searchParams }: PageProps<"/competitive-radar">) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : null);
  const p: P = { tab: str("tab") ?? "overview", co: str("co"), type: str("type") };
  const list = await m.competitors();
  const current = list.find((c) => c.company_id === p.co);
  const scope = current ? current.short_name : `All ${list.length} competitors`;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div id="tour-verified">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Competitive Movement Radar</h1>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
              title="Every event is backed by an exact sentence found in a dated official source">✓ Verified data only</span>
          </div>
          <p className="text-xs text-muted">Where custom-silicon business is landing and who is involved · {WINDOW.label}</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-muted">Competitor:</span>
        <Chip to={href(p, { co: null })} active={!p.co}>All</Chip>
        {list.map((c) => <Chip key={c.company_id} to={href(p, { co: c.company_id })} active={p.co === c.company_id} title={c.official_name}>{c.short_name}</Chip>)}
      </div>

      <nav className="-mx-4 mb-6 overflow-x-auto border-b border-border px-4">
        <div className="flex min-w-max gap-1">
          {TABS.map((t) => (
            <Link key={t.key} href={href(p, { tab: t.key, type: null })} scroll={false} title={t.hint}
              className={`border-b-2 px-3 py-2 text-sm ${p.tab === t.key ? "border-accent font-semibold text-foreground" : "border-transparent text-muted hover:text-foreground"}`}>
              {t.label}
            </Link>
          ))}
        </div>
      </nav>

      {p.tab === "events" ? <Events p={p} scope={scope} /> : p.tab === "tracker" ? <Tracker p={p} scope={scope} />
        : p.tab === "shortlist" ? <Shortlist p={p} />
        : <Overview p={p} scope={scope} list={list} />}
    </>
  );
}

async function Overview({ p, scope, list }: { p: P; scope: string; list: Awaited<ReturnType<typeof m.competitors>> }) {
  const [k, comp, types, months, cps, channels, latest] = await Promise.all([
    m.m2Summary(p.co), m.byCompetitor(), m.byType(p.co), m.byMonth(p.co), m.counterparties(p.co), m.m2Channels(p.co),
    m.m2Events(p.co, { cls: "confirmed_fact", limit: 3 }),
  ]);
  const n = (v: unknown) => Number(v ?? 0);
  const one = p.co ? list.find((c) => c.company_id === p.co) : null;
  return (
    <>
      <SectionTitle title={one ? `${scope} at a glance` : "Overview"} scope={scope}>
        {one
          ? `What ${scope} announced or disclosed in the last 12 months about custom silicon, process technology, chiplets, advanced packaging and partnerships.`
          : "Competitors and ecosystem players in custom silicon, foundry and advanced packaging. Each event is an official announcement or filing, checked word-for-word against its source."}
      </SectionTitle>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Tile label="Competitive events" value={k.events ?? 0} note="Announcements and filings found" />
        <Tile label="Confirmed" value={k.confirmed ?? 0} note="Already happened, officially stated" />
        <Tile label="Announced plans" value={k.intents ?? 0} note="Officially announced, not yet done" />
        <Tile label="Customers & partners named" value={k.counterparties ?? 0} note="Named in the sources" />
        <Tile label="Competitors with events" value={k.companies ?? 0} />
        <Tile label="Sources checked" value={k.sources ?? 0} note={`Incl. ${k.filings ?? 0} SEC filings`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {one ? (
          <Panel title={`${scope} snapshot`} note="Role in the value chain and relationship with Intel">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-muted">Value-chain role</dt><dd className="mt-0.5 font-medium">{humanize(one.value_chain_role ?? "other")}</dd></div>
              <div><dt className="text-xs text-muted">Relationship with Intel</dt><dd className="mt-0.5"><Badge value={one.intel_relationship_status} /></dd></div>
              <div><dt className="text-xs text-muted">Most frequent event type</dt><dd className="mt-0.5 font-medium">{types[0] ? `${humanize(types[0].event_type)} (${types[0].n})` : "—"}</dd></div>
              <div><dt className="text-xs text-muted">Partner named most</dt><dd className="mt-0.5 font-medium">{cps[0] ? `${cps[0].name} (${cps[0].n})` : "—"}</dd></div>
            </dl>
            {one.company_id === "cmp_arm" && (
              <p className="mt-3 text-xs text-muted">Arm is tracked as an IP / architecture competitor and an Intel Foundry Chiplet Alliance partner — not as a direct foundry competitor.</p>
            )}
          </Panel>
        ) : (
          <Panel title="Events by competitor" note="Click a competitor to filter every chart">
            <RankBars rows={comp.map((c) => ({ label: c.short_name, n: n(c.n), href: href(p, { co: c.company_id }) }))} unit="events" />
            <p className="mt-3 text-xs text-muted">Arm is an IP competitor and Intel Chiplet Alliance partner, not a foundry competitor. Hyperscaler in-house chips appear in the Emerging Demand Radar.</p>
          </Panel>
        )}
        <div className="grid gap-4">
          <Panel title="How certain is it?" note="Every event is either confirmed or an announced plan">
            <SplitBar a={n(k.confirmed)} b={n(k.intents)} aLabel="confirmed" bLabel="announced plans"
              aHint="Happened — stated by the company or in a filing" bHint="Planned — officially announced, not proof it happened" />
          </Panel>
          <Panel title="Where the evidence comes from">
            <RankBars rows={channels.map((c) => ({ label: humanize(c.source_type), n: n(c.n) }))} unit="sources" />
          </Panel>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Activity month by month" note="Events by the month the source was published">
          {months.length ? <MonthBars rows={months.map((x) => ({ month: x.month, a: n(x.confirmed), b: n(x.intent) }))} /> : <Empty>No dated events.</Empty>}
        </Panel>
        <Panel title="What kind of event" note="Click a type to see those events">
          <RankBars rows={types.map((t) => ({ label: humanize(t.event_type), n: n(t.n), href: href(p, { tab: "events", type: t.event_type }) }))} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Customers & partners named most" note="Only parties named explicitly in the source — undisclosed customers are never guessed">
          {cps.length ? <RankBars rows={cps.map((x) => ({ label: x.name, n: n(x.n) }))} unit="events" /> : <Empty>No customers or partners named.</Empty>}
        </Panel>
        <Panel title="Latest confirmed events" action={<Link href={href(p, { tab: "events" })} className="text-xs text-accent">See all →</Link>}>
          <div className="space-y-3">{latest.map((e) => <EventCard key={e.event_id} e={e} compact />)}</div>
        </Panel>
      </div>
    </>
  );
}

async function Events({ p, scope }: { p: P; scope: string }) {
  const [types, rows] = await Promise.all([m.byType(p.co), m.m2Events(p.co, { type: p.type ?? undefined })]);
  const total = types.reduce((a, t) => a + Number(t.n), 0);
  return (
    <>
      <SectionTitle title="Events" scope={scope}>
        Every competitive development found in official announcements and filings. Each card shows the exact sentence from its source.
      </SectionTitle>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Type of event</span>
        <Chip to={href(p, { type: null })} active={!p.type}>All · {total}</Chip>
        {types.map((t) => <Chip key={t.event_type} to={href(p, { type: t.event_type })} active={p.type === t.event_type}>{humanize(t.event_type)} · {t.n}</Chip>)}
      </div>
      {rows.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map((e) => <EventCard key={e.event_id} e={e} />)}</div>
        : <Empty>No events for this selection.</Empty>}
    </>
  );
}

async function Tracker({ p, scope }: { p: P; scope: string }) {
  const rows = await m.m2Events(p.co, { types: TRACKER_TYPES });
  return (
    <>
      <SectionTitle title="Foundry & packaging tracker" scope={scope}>
        Process-node, manufacturing, chiplet and advanced-packaging developments — the areas that compete with Intel Foundry and Intel packaging (EMIB, Foveros).
      </SectionTitle>
      {rows.length ? (
        <Panel title={`${rows.length} developments`}>
          <Table head={["Date", "Company", "Development", "Node / packaging", "Partner", "Stage", "Evidence"]}>
            {rows.map((e) => (
              <tr key={e.event_id}>
                <Td className="whitespace-nowrap">{e.event_date ?? e.publication_date}</Td>
                <Td className="font-medium">{e.short_name}</Td>
                <Td><Link href={`/events/m2_event/${e.event_id}`} className="hover:underline">{e.event_title}</Link>
                  <div className="text-xs text-muted">{humanize(e.event_type)}</div></Td>
                <Td className="text-xs">{[e.architecture_or_node, e.packaging_or_interconnect].filter(Boolean).join(" · ") || "—"}</Td>
                <Td className="text-xs">{e.counterparty_name ?? "—"}</Td>
                <Td className="text-xs">{e.commercial_stage ? humanize(e.commercial_stage) : "—"}</Td>
                <Td><Badge value={e.evidence_class} /><div className="mt-1 text-xs"><SourceLink url={e.url} label={e.source_name} /></div></Td>
              </tr>
            ))}
          </Table>
        </Panel>
      ) : <Empty>No foundry or packaging developments for this selection.</Empty>}
    </>
  );
}

async function Shortlist({ p }: { p: P }) {
  const picks = SHORTLIST;
  const byId = new Map((await m.m2EventsByIds(picks.map((x) => x.event_id))).map((e) => [e.event_id, e]));
  const rows = picks.map((x) => ({ ...x, e: byId.get(x.event_id) })).filter((x) => x.e && (!p.co || x.e.company_id === p.co));
  const types = new Set(rows.map((x) => x.e!.event_type));
  const companies = new Set(rows.map((x) => x.e!.company_id));
  return (
    <>
      <SectionTitle title="Shortlist for review" scope={p.co ? rows[0]?.e?.short_name ?? "—" : `${rows.length} events`}>
        Representative events chosen from all verified events to cover every event type and competitor, for the research
        team to assess. Selection only — Intel implication, response and priority are added by the research team.
      </SectionTitle>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Events selected" value={rows.length} note="Target 5–10" />
        <Tile label="Competitors covered" value={companies.size} note="Target at least 6" />
        <Tile label="Event types covered" value={`${types.size} of 6`} />
        <Tile label="Confirmed" value={rows.filter((x) => x.e!.evidence_class === "confirmed_fact").length} note="The rest are announced plans" />
      </div>
      <div className="space-y-3">
        {rows.map((x, i) => (
          <div key={x.event_id} className="grid gap-3 lg:grid-cols-[1fr_320px]">
            <div className="flex gap-3">
              <span className="mt-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">{i + 1}</span>
              <div className="flex-1"><EventCard e={x.e!} /></div>
            </div>
            <Panel title="Why it was selected">
              <p className="text-sm">{x.why}</p>
              {x.note && <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"><b>Note for reviewer:</b> {x.note}</p>}
              <p className="mt-2 text-xs text-muted">Intel implication: <i>pending research review</i></p>
            </Panel>
          </div>
        ))}
      </div>
    </>
  );
}

function EventCard({ e, compact }: { e: m.M2Event; compact?: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  const facts = [e.product_or_programme, e.architecture_or_node, e.packaging_or_interconnect].filter(Boolean);
  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent">{humanize(e.event_type)}</span>
        <Badge value={e.evidence_class} />
        <span className="ml-auto text-xs font-medium">{e.short_name}</span>
      </div>
      <Link href={`/events/m2_event/${e.event_id}`} className="text-sm font-semibold leading-snug hover:underline">{e.event_title}</Link>
      {!compact && e.summary && <p className="mt-1 text-xs text-muted">{e.summary}</p>}
      {!compact && (facts.length > 0 || e.counterparty_name) && (
        <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
          {e.counterparty_name && <span className="rounded border border-border px-1.5 py-0.5">Partner: {e.counterparty_name}</span>}
          {facts.map((f) => <span key={f} className="rounded border border-border px-1.5 py-0.5">{f}</span>)}
        </div>
      )}
      {e.excerpt && (
        <blockquote className="mt-2 rounded-md border border-emerald-200 bg-emerald-50/60 p-2 text-xs">
          <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">Exact words from the source</div>
          “{compact ? e.excerpt.slice(0, 220) + (e.excerpt.length > 220 ? "…" : "") : e.excerpt}”
        </blockquote>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-muted">
        <span>{e.event_date ? (e.event_date > today ? `Target ${e.event_date}` : `Event ${e.event_date}`) : `Published ${e.publication_date}`}</span>
        <span>{humanize(e.source_type)}</span>
        <SourceLink url={e.url} label={e.source_name} />
        {e.sources > 1 && <span>+{e.sources - 1} corroborating</span>}
        <Link href={`/events/m2_event/${e.event_id}`} className="ml-auto text-accent">Open details →</Link>
      </div>
    </article>
  );
}
