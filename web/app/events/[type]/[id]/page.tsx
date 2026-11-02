import { notFound } from "next/navigation";
import { Badge, Card, CompanyLink, PageHeader, SourceLink, humanize } from "@/components/ui";
import { queryOne, parseJsonList } from "@/lib/db";
import { eventSources } from "@/lib/data";

export default async function EventPage({ params }: PageProps<"/events/[type]/[id]">) {
  const { type, id } = await params;
  if (type !== "m1_signal" && type !== "m2_event") notFound();
  const row = type === "m1_signal"
    ? await queryOne<Record<string, string | null>>(
        `SELECT s.*, s.signal_type AS category, c.short_name, cp.short_name AS counterparty
         FROM m1_signal s JOIN company_master c USING (company_id)
         LEFT JOIN company_master cp ON cp.company_id = s.counterparty_company_id WHERE s.signal_id = ?`, [id])
    : await queryOne<Record<string, string | null>>(
        `SELECT e.*, e.event_type AS category, e.event_title AS title, c.short_name, e.counterparty_name AS counterparty
         FROM m2_competitive_event e JOIN company_master c USING (company_id) WHERE e.event_id = ?`, [id]);
  if (!row) notFound();
  const sources = await eventSources(type, id);

  return (
    <>
      <PageHeader title={String(row.title)} subtitle={`${humanize(String(row.category))} · ${row.short_name}`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Record">
          <dl className="space-y-2 text-sm">
            <Item label="Company"><CompanyLink id={String(row.company_id)} name={String(row.short_name)} /></Item>
            <Item label="Evidence class"><Badge value={row.evidence_class} /></Item>
            <Item label="Event date">{row.event_date ?? "not stated in source"}</Item>
            <Item label="Published">{row.publication_date ?? "—"}</Item>
            <Item label="First observed">{row.first_observed_date}</Item>
            <Item label="Counterparty">{row.counterparty ?? "—"}</Item>
            <Item label="Technologies">{parseJsonList(row.technology_tags).map(humanize).join(", ") || "—"}</Item>
            <Item label="Extraction">{row.extraction_method} {row.extraction_model ? `(${row.extraction_model})` : ""}</Item>
          </dl>
        </Card>
        <div className="lg:col-span-2">
          <Card title="Summary">
            <p className="text-sm">{row.summary ?? "—"}</p>
            <p className="mt-3 text-xs text-muted">
              The summary restates the source. The excerpts below were checked word-for-word against the stored source text.
            </p>
          </Card>
        </div>
      </div>
      <div className="mt-4">
        <Card title={`Supporting sources (${sources.length})`}>
          <div className="space-y-4">
            {sources.map((s) => (
              <div key={s.source_id}>
                <div className="text-sm font-medium"><SourceLink url={s.url} label={s.title ?? s.source_name} /></div>
                <div className="text-xs text-muted">
                  {s.source_name} · {humanize(s.source_type)} · published {s.publication_date ?? "—"} · first observed {s.first_observed_date} · {s.source_role}
                </div>
                <blockquote className="mt-1 border-l-2 border-accent pl-2 text-sm">“{s.link_excerpt ?? s.excerpt}”</blockquote>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
