import { Badge, Card, CompanyLink, Empty, PageHeader, Table, Td, humanize } from "@/components/ui";
import { companies, events, programmesFor } from "@/lib/data";

export default async function CompetitiveRadar() {
  const entities = await companies("m2");
  const [programmes, register] = await Promise.all([
    programmesFor(entities.map((e) => e.company_id)), events({ module: 2 }),
  ]);
  const groups = new Map<string, typeof entities>();
  entities.forEach((e) => groups.set(e.value_chain_role ?? "other", [...(groups.get(e.value_chain_role ?? "other") ?? []), e]));

  return (
    <>
      <PageHeader title="Competitive Movement Radar" subtitle="Competitor and ecosystem entities tracked for Module 2." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Competitor overview">
          <Table head={["Entity", "Value-chain role", "Intel relationship"]}>
            {[...groups.entries()].flatMap(([, list]) => list).map((e) => (
              <tr key={e.company_id}>
                <Td><CompanyLink id={e.company_id} name={e.short_name} /></Td>
                <Td>{humanize(e.value_chain_role ?? "other")}</Td>
                <Td><Badge value={e.intel_relationship_status} /></Td>
              </tr>
            ))}
          </Table>
          <p className="mt-3 text-xs text-muted">
            Arm is tracked as an IP / architecture competitor and Intel Foundry Chiplet Alliance partner, not as a
            direct foundry competitor. Hyperscalers appear only through their in-house silicon programmes.
          </p>
        </Card>
        <Card title="Programmes and technologies tracked (reference list)">
          <Table head={["Entity", "Programme", "Type"]}>
            {programmes.map((p) => (
              <tr key={String(p.programme_id)}>
                <Td>{String(p.short_name)}</Td>
                <Td>{String(p.name)}</Td>
                <Td>{humanize(String(p.programme_type))}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
      <div className="mt-4">
        <Card title="Competitive event register">
          {register.length ? (
            <Table head={["Date", "Company", "Event", "Evidence"]}>
              {register.map((e) => (
                <tr key={e.id}>
                  <Td>{e.event_date ?? e.publication_date}</Td>
                  <Td><CompanyLink id={e.company_id} name={e.short_name} /></Td>
                  <Td>{e.title}</Td>
                  <Td><Badge value={e.evidence_class} /></Td>
                </tr>
              ))}
            </Table>
          ) : <Empty>Module 2 event collection is the next phase; no competitive events are published yet.</Empty>}
        </Card>
      </div>
    </>
  );
}
