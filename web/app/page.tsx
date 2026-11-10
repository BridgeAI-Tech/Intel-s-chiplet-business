import Link from "next/link";
import { COMPANY_COLOR } from "@/components/charts";
import { Chip, TABS, href, type Params } from "@/components/dash";
import * as S from "@/components/sections";
import { TourBanner } from "@/components/tour";
import { WINDOW, moduleCompanies } from "@/lib/dashboard";

export const instant = false;

const SECTIONS = {
  summary: S.Summary, developments: S.Developments, hiring: S.Hiring, ecosystem: S.Ecosystem,
  intel: S.IntelRelationship, filings: S.Filings, evidence: S.EvidenceLake, sources: S.DataSources,
};

export default async function Dashboard({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : null);
  const tab = (str("tab") ?? "summary") as keyof typeof SECTIONS;
  const p: Params = { tab, co: str("co"), category: str("category"), channel: str("channel"), platform: str("platform") };
  const companies = await moduleCompanies();
  const current = companies.find((c) => c.company_id === p.co);
  const scope = current ? current.short_name : "All five companies";
  const Section = SECTIONS[tab] ?? S.Summary;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div id="tour-verified">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Emerging Demand Radar</h1>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
              title="Every record is backed by an exact sentence found in a dated source">✓ Verified data only</span>
          </div>
          <p className="text-xs text-muted">Cerebras, AWS, Meta, Microsoft and Tesla · {WINDOW.label}</p>
        </div>
      </div>

      <TourBanner />

      <div id="tour-company-chips" className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-muted">Company:</span>
        <Chip to={href(p, { co: null })} active={!p.co}>All five</Chip>
        {companies.map((c) => (
          <Chip key={c.company_id} to={href(p, { co: c.company_id })} active={p.co === c.company_id} title={c.official_name}>
            <span className="h-2 w-2 rounded-full" style={{ background: COMPANY_COLOR[c.company_id] }} />{c.short_name}
          </Chip>
        ))}
        {current && <Link href={`/companies/${current.company_id}`} className="ml-2 text-xs text-accent">Full company profile →</Link>}
      </div>

      <nav id="tour-tabs" className="-mx-4 mb-6 overflow-x-auto border-b border-border px-4">
        <div className="flex min-w-max gap-1">
          {TABS.map((t) => (
            <Link key={t.key} href={href(p, { tab: t.key, category: null, channel: null, platform: null })} scroll={false} title={t.hint}
              className={`border-b-2 px-3 py-2 text-sm ${tab === t.key ? "border-accent font-semibold text-foreground" : "border-transparent text-muted hover:text-foreground"}`}>
              {t.label}
            </Link>
          ))}
        </div>
      </nav>

      <Section p={p} scope={scope} />
    </>
  );
}
