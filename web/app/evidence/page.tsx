import Link from "next/link";
import { Card, Empty, PageHeader, SourceLink, Table, Td, humanize } from "@/components/ui";
import { evidenceDetail, evidenceList, sourceTypes } from "@/lib/data";

export default async function EvidenceLibrary({ searchParams }: PageProps<"/evidence">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const type = typeof sp.type === "string" ? sp.type : "";
  const selected = typeof sp.id === "string" ? sp.id : "";
  const [rows, types, detail] = await Promise.all([
    evidenceList(q, type), sourceTypes(), selected ? evidenceDetail(selected) : Promise.resolve(null),
  ]);
  const qs = (id: string) => `/evidence?${new URLSearchParams({ ...(q && { q }), ...(type && { type }), id })}`;

  return (
    <>
      <PageHeader title="Evidence Library" subtitle="Every stored source document, with its dates and the records it supports." />
      <form className="mb-4 flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Search title, excerpt, URL</span>
          <input name="q" defaultValue={q} className="w-72 rounded border border-border bg-surface px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Source type</span>
          <select name="type" defaultValue={type} className="rounded border border-border bg-surface px-2 py-1">
            <option value="">All</option>
            {types.map((t) => <option key={t.source_type} value={t.source_type}>{humanize(t.source_type)} ({t.n})</option>)}
          </select>
        </label>
        <button className="rounded bg-accent px-3 py-1.5 text-white">Search</button>
      </form>

      {detail?.source && (
        <div className="mb-4">
          <Card title="Selected record" action={<Link href={qs("").replace(/&?id=$/, "")} className="text-xs text-accent">Close</Link>}>
            <div className="text-sm font-medium"><SourceLink url={detail.source.url} label={detail.source.title ?? detail.source.url} /></div>
            <div className="mt-1 text-xs text-muted">
              {humanize(detail.source.source_type)} · published {detail.source.publication_date ?? "—"} · event {detail.source.event_date ?? "—"} ·
              first observed {detail.source.first_observed_date} · collected {detail.source.collected_date}
            </div>
            {detail.source.excerpt && <blockquote className="mt-2 border-l-2 border-accent pl-2 text-sm">“{detail.source.excerpt}”</blockquote>}
            <div className="mt-3 text-sm">
              <div className="text-xs uppercase text-muted">Linked records</div>
              <ul className="mt-1 space-y-1">
                {detail.links.map((l) => (
                  <li key={l.record_type + l.record_id}>
                    {l.record_type === "company"
                      ? <Link className="text-accent" href={`/companies/${l.record_id}`}>Company · {l.record_id.replace("cmp_", "")}</Link>
                      : l.record_type === "m1_signal" || l.record_type === "m2_event"
                        ? <Link className="text-accent" href={`/events/${l.record_type}/${l.record_id}`}>{humanize(l.record_type)} · {l.record_id}</Link>
                        : <span>{humanize(l.record_type)} · {l.record_id}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      )}

      <Card title={`Sources (${rows.length}${rows.length === 200 ? "+" : ""})`}>
        {rows.length ? (
          <Table head={["Date", "Linked companies", "Type", "Title / excerpt", ""]}>
            {rows.map((r) => (
              <tr key={r.source_id}>
                <Td className="whitespace-nowrap">{r.publication_date ?? r.collected_date}</Td>
                <Td>{r.companies ?? "—"}</Td>
                <Td>{humanize(r.source_type)}</Td>
                <Td>
                  <div className="font-medium">{r.title ?? r.source_name}</div>
                  {r.excerpt && <div className="line-clamp-2 text-xs text-muted">{r.excerpt}</div>}
                </Td>
                <Td><Link href={qs(r.source_id)} className="text-accent">View</Link></Td>
              </tr>
            ))}
          </Table>
        ) : <Empty>No sources match.</Empty>}
      </Card>
    </>
  );
}
