import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, Empty, PageHeader, SourceLink, Table, Td, humanize } from "@/components/ui";
import { parseJsonList } from "@/lib/db";
import { company, companyEvidence, events, hiring, programmesFor, relationships } from "@/lib/data";

export const instant = false;

export default async function CompanyPage({ params }: PageProps<"/companies/[id]">) {
  const { id } = await params;
  const c = await company(id);
  if (!c) notFound();
  const [evidence, programmes, signals, jobs, rels] = await Promise.all([
    companyEvidence(id), programmesFor([id]), events({ companyId: id }), hiring(id), relationships(id),
  ]);
  const verifiedFields = new Set(evidence.flatMap((e) => {
    try { return JSON.parse(e.link).fields as string[]; } catch { return []; }
  }));
  const relationshipEvidence = evidence.filter((e) => e.link.includes("intel_relationship_status"));
  const totalJobs = jobs.byCategory.reduce((a, r) => a + Number(r.n), 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader title={c.short_name}
        subtitle={`${humanize(c.entity_type)} · ${c.in_module_1 ? "Module 1" : ""}${c.in_module_1 && c.in_module_2 ? " & " : ""}${c.in_module_2 ? "Module 2" : ""}`} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Profile">
          <dl className="space-y-2 text-sm">
            <Field label="Domain" value={c.primary_domain} ok={verifiedFields.has("primary_domain")} />
            <Field label="Headquarters" value={[c.hq_city, c.hq_country].filter(Boolean).join(", ") || null} ok={verifiedFields.has("hq")} />
            <Field label="LinkedIn" ok={Boolean(c.linkedin_verified)}
              value={c.linkedin_url ? <SourceLink url={c.linkedin_url} label="Company page" /> : null} />
            <Field label="Industry" value={c.industry ? humanize(c.industry) : null} />
            <Field label="Business units" value={parseJsonList(c.business_units).join("; ") || null} ok={verifiedFields.has("business_units")} />
            <Field label="Parent" value={c.parent_company_id ? <Link className="text-accent" href={`/companies/${c.parent_company_id}`}>{c.parent_company_id.replace("cmp_", "")}</Link> : null} />
          </dl>
          <p className="mt-3 text-xs text-muted">✓ = confirmed by a stored source (see Verification sources below).</p>
        </Card>

        <Card title="Intel relationship">
          <div className="mb-2"><Badge value={c.intel_relationship_status} /></div>
          {relationshipEvidence.length ? relationshipEvidence.map((e) => {
            const link = JSON.parse(e.link);
            return (
              <blockquote key={e.source_id + link.excerpt} className="mb-2 border-l-2 border-accent pl-2 text-sm">
                “{link.excerpt}”
                <div className="mt-1 text-xs text-muted">
                  <SourceLink url={e.url} label={e.source_name} /> · {e.publication_date ?? "undated"} · <Badge value={link.evidence_class} />
                </div>
              </blockquote>
            );
          }) : <p className="text-sm text-muted">No Intel relationship evidence on file; status is a research classification.</p>}
          {c.matching_notes && <p className="mt-2 text-xs text-muted">{c.matching_notes}</p>}
        </Card>

        <Card title="Silicon programmes and their stage">
          {programmes.length ? (
            <ul className="space-y-3 text-sm">
              {programmes.map((p) => (
                <li key={String(p.programme_id)}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{String(p.name)}</span>
                    <span className="text-xs text-muted">{humanize(String(p.programme_type))}</span>
                    {p.stage ? <span className="rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent"
                        title={String(p.stage_rationale ?? "")}>Stage {String(p.stage)} · {String(p.stage_label)}</span>
                      : <span className="text-[11px] text-muted">Stage not assessed (no linked records)</span>}
                  </div>
                  {p.stage_rationale && <p className="mt-0.5 text-xs text-muted">{String(p.stage_rationale)}</p>}
                </li>
              ))}
            </ul>
          ) : <Empty>No programmes listed.</Empty>}
          <p className="mt-2 text-xs text-muted">Stage per programme from fixed rules on its linked records (stage 4–5 need at least
            two records, one confirmed). The programme names are also the search terms for the pipelines.</p>
        </Card>
      </div>

      <div className="mt-4">
        <Card title={`Development signals (${signals.length})`}>
          {signals.length ? (
            <Table head={["Date", "Category", "Signal", "Evidence"]}>
              {signals.map((s) => (
                <tr key={s.id}>
                  <Td className="whitespace-nowrap">
                    {s.event_date
                      ? s.event_date > today ? <span title="Planned / target date stated by the source">target {s.event_date}</span> : s.event_date
                      : <span title="Source gives no event date; publication date shown">{s.publication_date} (pub.)</span>}
                  </Td>
                  <Td>{humanize(s.category)}</Td>
                  <Td>
                    <Link href={`/events/${s.module === 1 ? "m1_signal" : "m2_event"}/${s.id}`} className="font-medium hover:underline">{s.title}</Link>
                    {s.summary && <div className="text-xs text-muted">{s.summary}</div>}
                  </Td>
                  <Td><Badge value={s.evidence_class} /></Td>
                </tr>
              ))}
            </Table>
          ) : <Empty>No verified signals for this company in the last 12 months.</Empty>}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title={`Hiring intelligence (${totalJobs} silicon postings)`}>
          {totalJobs ? (
            <>
              <div className="mb-3 space-y-1">
                {jobs.byCategory.map((r) => (
                  <div key={String(r.role_category)} className="flex items-center gap-2 text-xs">
                    <span className="w-56 shrink-0 truncate">{humanize(String(r.role_category))}</span>
                    <div className="h-2 flex-1 rounded bg-accent-soft">
                      <div className="h-2 rounded bg-accent" style={{ width: `${(Number(r.n) / totalJobs) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right tabular-nums">{r.n}</span>
                  </div>
                ))}
              </div>
              <Table head={["First observed", "Role", "Location", "Status"]}>
                {jobs.recent.map((j) => (
                  <tr key={String(j.posting_id)}>
                    <Td className="whitespace-nowrap">{j.first_observed_date}</Td>
                    <Td>
                      <span title={`Original title: ${j.original_title}`}>
                        {j.url ? <SourceLink url={String(j.url)} label={String(j.normalised_title ?? j.original_title)} />
                          : j.normalised_title ?? j.original_title}
                      </span>
                      <div className="text-xs text-muted">{humanize(String(j.role_category))} · {humanize(String(j.seniority))}</div>
                    </Td>
                    <Td>{j.location ?? "—"}</Td>
                    <Td>{j.posting_status}</Td>
                  </tr>
                ))}
              </Table>
              <p className="mt-2 text-xs text-muted">Open vacancies are not confirmed hires.</p>
            </>
          ) : <Empty>Hiring data not collected for this company in the sample.</Empty>}
        </Card>

        <Card title="Supplier and ecosystem relationships">
          {rels.length ? (
            <Table head={["Partner", "Relationship", "Stage", "Evidence"]}>
              {rels.map((r) => (
                <tr key={String(r.relationship_id)}>
                  <Td>{r.supplier_name}<div className="text-xs text-muted">{humanize(String(r.supplier_category))}</div></Td>
                  <Td>{humanize(String(r.relationship_type))}<div className="text-xs text-muted">{r.summary}</div></Td>
                  <Td>{r.commercial_stage ? humanize(String(r.commercial_stage)) : "—"}</Td>
                  <Td><Badge value={r.evidence_class} /><div className="text-xs text-muted">{r.event_date ?? r.publication_date}</div></Td>
                </tr>
              ))}
            </Table>
          ) : <Empty>No supplier or ecosystem relationship found in verified sources.</Empty>}
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Verification sources (company master)">
          <Table head={["Fields confirmed", "Source", "Excerpt / record"]}>
            {evidence.map((e) => {
              const link = JSON.parse(e.link);
              return (
                <tr key={e.source_id + link.excerpt}>
                  <Td>{(link.fields as string[]).map(humanize).join(", ")}</Td>
                  <Td><SourceLink url={e.url} label={e.source_name} /><div className="text-xs text-muted">checked {link.checked_at}</div></Td>
                  <Td className="text-xs">{link.excerpt}</Td>
                </tr>
              );
            })}
          </Table>
        </Card>
      </div>
    </>
  );
}

function Field({ label, value, ok }: { label: string; value: React.ReactNode; ok?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-muted">{label}</dt>
      <dd>{value ?? <span className="text-muted">not available</span>}{ok && <span className="ml-1 text-emerald-700" title="Source-verified">✓</span>}</dd>
    </div>
  );
}
