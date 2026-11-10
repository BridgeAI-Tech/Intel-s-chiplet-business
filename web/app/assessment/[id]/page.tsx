import Link from "next/link";
import { notFound } from "next/navigation";
import { AssessmentDetail } from "@/components/assessment";
import { SectionTitle } from "@/components/dash";
import * as sc from "@/lib/scoring";

export const instant = false;

export default async function AssessmentPage({ params }: PageProps<"/assessment/[id]">) {
  const { id } = await params;
  const [cfg, [a]] = await Promise.all([sc.activeConfig(), sc.assessments(id)]);
  if (!a) notFound();
  const ids = [...new Set([...a.stage_record_ids, ...Object.values(a.ratings).flatMap((r) => r.record_ids),
    ...Object.values(a.qualification).flatMap((q) => q.record_ids), ...a.mappings.flatMap((m) => JSON.parse(m.record_ids || "[]") as string[])])];
  const records = await sc.resolveRecords(a.company_id, ids);
  return (
    <>
      <div className="mb-3 flex flex-wrap gap-3 text-xs">
        <Link href="/?tab=assessment" className="text-accent">← All companies</Link>
        <Link href={`/companies/${a.company_id}`} className="text-accent">Company profile →</Link>
      </div>
      <SectionTitle title={`${a.official_name} — scoring & Intel fit`} scope={`Framework ${cfg.version}`}>
        The research team&apos;s framework applied to {a.short_name}&apos;s verified records. Every rating, stage and mapping
        links to the records behind it; the score, tier and qualification follow the current Settings.
      </SectionTitle>
      <AssessmentDetail a={a} cfg={cfg} records={records} />
    </>
  );
}
