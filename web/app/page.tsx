import Link from "next/link";
import { Chip, TABS, href, type Params } from "@/components/dash";
import * as S from "@/components/sections";
import { WINDOW, moduleCompanies } from "@/lib/dashboard";

const SECTIONS = {
  summary: S.Summary, developments: S.Developments, hiring: S.Hiring, ecosystem: S.Ecosystem,
  intel: S.IntelRelationship, filings: S.Filings, assessment: S.Assessment, evidence: S.EvidenceLake, sources: S.DataSources,
};

export default async function Dashboard({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : null);
  const tab = (str("tab") ?? "summary") as keyof typeof SECTIONS;
  const p: Params = { tab, co: str("co"), category: str("category"), channel: str("channel"), platform: str("platform") };
  const companies = await moduleCompanies();
  const current = companies.find((c) => c.company_id === p.co);
  const scope = current ? current.short_name : `All ${companies.length} deep-dive companies`;
  const Section = SECTIONS[tab] ?? S.Summary;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-base font-semibold uppercase tracking-wide">Module 1 · Emerging Demand Radar</h1>
            <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] text-emerald-800">VERIFIED DATA ONLY</span>
          </div>
          <p className="text-xs text-muted">Deep dive: Cerebras, AWS, Tesla · Period: {WINDOW.label}</p>
        </div>
        <Link href={href(p, { tab: "sources" })} scroll={false}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${tab === "sources" ? "border-foreground bg-foreground text-white" : "border-border bg-surface hover:border-accent"}`}>
          ⛁ Data sources
        </Link>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <Chip to={href(p, { co: null })} active={!p.co}>ALL</Chip>
        {companies.map((c) => (
          <Chip key={c.company_id} to={href(p, { co: c.company_id })} active={p.co === c.company_id} title={c.official_name}>
            <span className={`h-1.5 w-1.5 rounded-full ${p.co === c.company_id ? "bg-white" : "bg-muted"}`} />{c.short_name}
          </Chip>
        ))}
        {current && <Link href={`/companies/${current.company_id}`} className="ml-2 text-xs text-accent">Full company profile →</Link>}
      </div>

      <nav className="-mx-4 mb-6 overflow-x-auto border-b border-border px-4">
        <div className="flex min-w-max gap-1">
          {TABS.map((t, i) => (
            <Link key={t.key} href={href(p, { tab: t.key, category: null, channel: null, platform: null })} scroll={false}
              className={`border-b-2 px-3 py-2 text-sm ${tab === t.key ? "border-accent font-semibold text-foreground" : "border-transparent text-muted hover:text-foreground"}`}>
              {i + 1}. {t.label}
            </Link>
          ))}
        </div>
      </nav>

      <Section p={p} scope={scope} />
    </>
  );
}
