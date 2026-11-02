import Link from "next/link";
import { Badge, Card, CompanyLink, Empty, Kpi, PageHeader, Table, Td, humanize } from "@/components/ui";
import { companies, counts, events, pipelineRuns } from "@/lib/data";

export default async function Overview() {
  const [k, m1, m2, recent, runs] = await Promise.all([
    counts(), companies("m1"), companies("m2"), events({ limit: 15 }), pipelineRuns(),
  ]);

  return (
    <>
      <PageHeader title="Executive summary"
        subtitle="Selected companies, market signals and competitor moves. Figures are counts of stored, non-rejected records." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Companies screened (Module 1)" value={k.m1_companies} />
        <Kpi label="Companies shortlisted" value={k.shortlisted}
          note={k.shortlisted ? undefined : "Awaiting assessment rules (research side)"} />
        <Kpi label="Signals identified" value={k.m1_signals} note={`${k.postings} job postings stored`} />
        <Kpi label="Competitive events" value={k.m2_events} note={`${k.m2_entities} entities tracked`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Emerging demand · companies" action={<Link href="/emerging-demand" className="text-xs text-accent">Open radar →</Link>}>
          <Table head={["Company", "Industry", "Intel relationship"]}>
            {m1.map((c) => (
              <tr key={c.company_id}>
                <Td><CompanyLink id={c.company_id} name={c.short_name} /></Td>
                <Td>{c.industry ? humanize(c.industry) : "—"}</Td>
                <Td><Badge value={c.intel_relationship_status} /></Td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="Competitive movement · entities" action={<Link href="/competitive-radar" className="text-xs text-accent">Open radar →</Link>}>
          <Table head={["Entity", "Value-chain role", "Intel relationship"]}>
            {m2.map((c) => (
              <tr key={c.company_id}>
                <Td><CompanyLink id={c.company_id} name={c.short_name} /></Td>
                <Td>{c.value_chain_role ? humanize(c.value_chain_role) : "—"}</Td>
                <Td><Badge value={c.intel_relationship_status} /></Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Recent signals and events">
          {recent.length ? (
            <Table head={["Date", "Company", "Module", "Type", "Summary", "Evidence"]}>
              {recent.map((e) => (
                <tr key={e.id}>
                  <Td className="whitespace-nowrap">{e.event_date ?? e.publication_date ?? "—"}</Td>
                  <Td><CompanyLink id={e.company_id} name={e.short_name} /></Td>
                  <Td>M{e.module}</Td>
                  <Td>{humanize(e.category)}</Td>
                  <Td><Link href={`/events/${e.module === 1 ? "m1_signal" : "m2_event"}/${e.id}`} className="hover:underline">{e.title}</Link></Td>
                  <Td><Badge value={e.evidence_class} /></Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>
              No extracted signals or events yet. They appear here once the news, filings and hiring pipelines
              (M1-3, M1-4, M2-2) have run and their records pass excerpt verification.
            </Empty>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Data status">
          <ul className="space-y-1 text-sm">
            <li>{k.validated} of {k.total_companies} company records validated against sources</li>
            <li>{k.programmes} silicon programmes in the reference list</li>
            <li>{k.sources} source documents in the evidence library</li>
          </ul>
        </Card>
        <Card title="Latest pipeline runs">
          <Table head={["Pipeline", "Started (UTC)", "Status", "Calls"]}>
            {runs.map((r, i) => (
              <tr key={i}>
                <Td>{String(r.pipeline)}</Td>
                <Td className="whitespace-nowrap">{String(r.started_at).replace("T", " ").replace("Z", "")}</Td>
                <Td>{String(r.status)}</Td>
                <Td>{r.records_in ?? "—"}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
