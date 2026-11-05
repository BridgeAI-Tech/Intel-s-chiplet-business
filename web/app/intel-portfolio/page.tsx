import Link from "next/link";
import { Panel, SectionTitle } from "@/components/dash";
import { SourceLink, Table, Td, humanize } from "@/components/ui";
import { offerings } from "@/lib/scoring";

const CATEGORY: Record<string, string> = {
  foundry_process: "Foundry / Process", design_ip: "Design / IP / Design Enablement", advanced_packaging: "Advanced Packaging / Chiplet Integration",
};

export default async function IntelPortfolio() {
  const rows = await offerings();
  const groups = Object.keys(CATEGORY).map((k) => ({ key: k, rows: rows.filter((r) => r.mapping_category === k) }));
  return (
    <>
      <div className="mb-3 text-xs"><Link href="/?tab=assessment" className="text-accent">← Scoring & shortlist</Link></div>
      <SectionTitle title="Intel Portfolio & Technology Reference" scope={`${rows.length} entries`}>
        What Intel offers, used as the reference inventory for portfolio mapping. Each entry comes from an official Intel
        Foundry page and carries the verbatim passage it was taken from. Ecosystem partners are listed with the programme that
        names them and are never shown as Intel offerings.
      </SectionTitle>
      <div className="space-y-4">
        {groups.map((g) => (
          <Panel key={g.key} title={`${CATEGORY[g.key]} (${g.rows.length})`}>
            <Table head={["Offering", "Dataset", "Status (as the page describes it)", "Description", "Partners named", "Source"]}>
              {g.rows.map((r) => (
                <tr key={String(r.offering_id)}>
                  <Td className="font-medium">{r.name}</Td>
                  <Td>{humanize(String(r.dataset))}</Td>
                  <Td>{humanize(String(r.status))}</Td>
                  <Td className="text-xs">{r.description}<blockquote className="mt-1 border-l-2 border-accent pl-2 text-muted">“{r.excerpt}”</blockquote></Td>
                  <Td className="text-xs">{(JSON.parse(String(r.related_partners || "[]")) as string[]).join(", ") || "—"}</Td>
                  <Td className="whitespace-nowrap text-xs">{r.url && <SourceLink url={String(r.url)} label="intel.com" />}<div className="text-muted">verified {r.verified_date}</div></Td>
                </tr>
              ))}
            </Table>
          </Panel>
        ))}
      </div>
    </>
  );
}
