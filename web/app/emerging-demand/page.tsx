import Link from "next/link";
import { Badge, Card, CompanyLink, Empty, PageHeader, Table, Td, humanize } from "@/components/ui";
import { query } from "@/lib/db";
import { companies } from "@/lib/data";

export const instant = false;

type Stat = { company_id: string; signals: number; postings: number; relationships: number; latest: string | null };

export default async function EmergingDemand({ searchParams }: PageProps<"/emerging-demand">) {
  const sp = await searchParams;
  const industry = typeof sp.industry === "string" ? sp.industry : "";
  const relationship = typeof sp.relationship === "string" ? sp.relationship : "";

  const all = await companies("m1");
  const stats = await query<Stat>(`
    SELECT c.company_id,
      (SELECT COUNT(*) FROM m1_signal s WHERE s.company_id = c.company_id AND s.record_status IN ('extracted', 'reviewed')) AS signals,
      (SELECT COUNT(*) FROM hiring_posting h WHERE h.company_id = c.company_id) AS postings,
      (SELECT COUNT(*) FROM company_relationship r WHERE r.company_id = c.company_id) AS relationships,
      (SELECT MAX(publication_date) FROM m1_signal s WHERE s.company_id = c.company_id) AS latest
    FROM company_master c WHERE c.in_module_1 = 1`);
  const byId = new Map(stats.map((s) => [s.company_id, s]));
  const rows = all.filter((c) => (!industry || c.industry === industry) &&
    (!relationship || c.intel_relationship_status === relationship));

  const categories = await query<{ signal_type: string; evidence_class: string; n: number }>(`
    SELECT s.signal_type, s.evidence_class, COUNT(*) AS n FROM m1_signal s JOIN company_master c USING (company_id)
    WHERE c.in_module_1 = 1 AND s.record_status IN ('extracted', 'reviewed') GROUP BY 1, 2 ORDER BY n DESC`);
  const roleMix = await query<{ short_name: string; company_id: string; role_category: string; n: number }>(`
    SELECT c.short_name, h.company_id, h.role_category, COUNT(*) AS n FROM hiring_posting h
    JOIN company_master c USING (company_id) GROUP BY 1, 2, 3 ORDER BY c.short_name, n DESC`);

  const industries = [...new Set(all.map((c) => c.industry).filter(Boolean))] as string[];
  const relationships = [...new Set(all.map((c) => c.intel_relationship_status).filter(Boolean))] as string[];

  return (
    <>
      <PageHeader title="Emerging Demand Radar"
        subtitle="Companies building or expanding custom-silicon capabilities. Counts are verified records only; click a company for its evidence." />

      <form className="mb-4 flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Industry</span>
          <select name="industry" defaultValue={industry} className="rounded border border-border bg-surface px-2 py-1">
            <option value="">All</option>
            {industries.map((i) => <option key={i} value={i}>{humanize(i)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Intel relationship</span>
          <select name="relationship" defaultValue={relationship} className="rounded border border-border bg-surface px-2 py-1">
            <option value="">All</option>
            {relationships.map((r) => <option key={r} value={r}>{humanize(r)}</option>)}
          </select>
        </label>
        <button className="rounded bg-accent px-3 py-1.5 text-white">Apply</button>
        {(industry || relationship) && <Link href="/emerging-demand" className="text-accent">Clear</Link>}
      </form>

      <Card title="Company overview">
        <Table head={["Company", "Industry", "Intel relationship", "Verified signals", "Silicon job postings",
          "Supplier / ecosystem links", "Latest source published"]}>
          {rows.map((c) => {
            const s = byId.get(c.company_id);
            return (
              <tr key={c.company_id}>
                <Td><CompanyLink id={c.company_id} name={c.short_name} /></Td>
                <Td>{c.industry ? humanize(c.industry) : "—"}</Td>
                <Td><Badge value={c.intel_relationship_status} /></Td>
                <Td className="tabular-nums">{s?.signals ?? 0}</Td>
                <Td className="tabular-nums">{s?.postings || <span className="text-muted">not collected</span>}</Td>
                <Td className="tabular-nums">{s?.relationships ?? 0}</Td>
                <Td className="whitespace-nowrap">{s?.latest ?? "—"}</Td>
              </tr>
            );
          })}
        </Table>
        <p className="mt-3 text-xs text-muted">
          Development stage and Intel-relevance scoring will appear once the research team&apos;s assessment
          criteria are applied; no score is shown until then.
        </p>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Signals by category and evidence class">
          {categories.length ? (
            <Table head={["Category", "Evidence class", "Records"]}>
              {categories.map((r) => (
                <tr key={`${r.signal_type}-${r.evidence_class}`}>
                  <Td>{humanize(r.signal_type)}</Td>
                  <Td><Badge value={r.evidence_class} /></Td>
                  <Td className="tabular-nums">{r.n}</Td>
                </tr>
              ))}
            </Table>
          ) : <Empty>No verified signals yet.</Empty>}
        </Card>
        <Card title="Engineering role mix (silicon postings, last 12 months)">
          {roleMix.length ? <RoleMix rows={roleMix} /> : <Empty>No hiring records collected yet.</Empty>}
        </Card>
      </div>
    </>
  );
}

function RoleMix({ rows }: { rows: { short_name: string; company_id: string; role_category: string; n: number }[] }) {
  const byCompany = new Map<string, typeof rows>();
  rows.forEach((r) => byCompany.set(r.short_name, [...(byCompany.get(r.short_name) ?? []), r]));
  return (
    <div className="space-y-4">
      {[...byCompany.entries()].map(([name, rs]) => {
        const total = rs.reduce((a, r) => a + Number(r.n), 0);
        return (
          <div key={name}>
            <div className="mb-1 flex justify-between text-sm">
              <CompanyLink id={rs[0].company_id} name={name} />
              <span className="text-muted tabular-nums">{total} postings</span>
            </div>
            {rs.map((r) => (
              <div key={r.role_category} className="flex items-center gap-2 text-xs">
                <span className="w-56 shrink-0 truncate">{humanize(r.role_category)}</span>
                <div className="h-2 flex-1 rounded bg-accent-soft">
                  <div className="h-2 rounded bg-accent" style={{ width: `${(Number(r.n) / total) * 100}%` }} />
                </div>
                <span className="w-8 text-right tabular-nums">{r.n}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
