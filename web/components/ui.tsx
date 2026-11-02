import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

export function Card({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {note && <div className="mt-1 text-xs text-muted">{note}</div>}
    </div>
  );
}

const BADGE_TONES: Record<string, string> = {
  confirmed_fact: "bg-emerald-50 text-emerald-800 border-emerald-200",
  corroborated_inference: "bg-amber-50 text-amber-800 border-amber-200",
  press_released_intent: "bg-sky-50 text-sky-800 border-sky-200",
  existing_relationship: "bg-emerald-50 text-emerald-800 border-emerald-200",
  potential_target: "bg-sky-50 text-sky-800 border-sky-200",
  partner_and_competitor: "bg-violet-50 text-violet-800 border-violet-200",
  competitor_only: "bg-rose-50 text-rose-800 border-rose-200",
  research_only: "bg-slate-50 text-slate-700 border-slate-200",
};

export function Badge({ value, label }: { value: string | null | undefined; label?: string }) {
  if (!value) return <span className="text-xs text-muted">—</span>;
  const tone = BADGE_TONES[value] ?? "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <span className={`inline-block whitespace-nowrap rounded border px-1.5 py-0.5 text-xs ${tone}`}>
      {label ?? humanize(value)}
    </span>
  );
}

const ACRONYMS = new Set(["ai", "hpc", "ip", "asic", "rtl", "dft", "osat", "eda", "soc", "cpu", "gpu", "hbm", "ucie",
  "xpu", "emib", "cowos", "soic", "vp", "ma", "sec", "it", "llm", "npu", "dpu", "ipu"]);

// Plain-language names for taxonomy codes, so a first-time reader does not need the research vocabulary.
const PLAIN: Record<string, string> = {
  confirmed_fact: "Confirmed", press_released_intent: "Announced plan", corroborated_inference: "Inferred",
  design_win_customer: "Customer win", product_architecture: "Product / chip", programme_milestone: "Milestone",
  partnership_ecosystem: "Partnership", investment_ma_financing: "Funding & deals", manufacturing_capacity: "Manufacturing",
  patent_standards: "Patents & standards", financial_regulatory: "Financials", leadership: "Leadership",
  technographic: "Tools & technology", hiring_trend: "Hiring trend", foundry_process_manufacturing: "Foundry & process node",
  chiplet_advanced_packaging: "Chiplets & packaging", strategic_investment_capacity: "Capacity & investment",
  company_newsroom: "Company news", investor_relations: "Investor relations", regulatory_filing: "SEC filing",
  partner_announcement: "Partner news", industry_publication: "Trade press", job_posting: "Job posting",
  career_page: "Careers page", data_provider: "Data provider", news_media: "News", company_blog: "Company blog",
  verification_validation: "Verification", architecture_system_design: "Architecture", rtl_logic_design: "RTL / logic design",
  physical_design: "Physical design", dft_test: "Design-for-test", packaging_integration: "Packaging",
  manufacturing_bringup_product: "Bring-up & product", sourcing_supplier_mgmt: "Sourcing",
  existing_relationship: "Existing Intel relationship", potential_target: "Potential target", research_only: "Research only",
  foundry_manufacturing: "Chip manufacturing (foundry)", packaging_assembly: "Packaging / assembly", ip_licence: "IP licence",
  eda_tools: "Chip-design software (EDA)", memory_supply: "Memory supply", design_partner: "Design partner",
  osat_packaging: "Packaging", eda_vendor: "EDA software", ip_provider: "IP provider", design_services: "Design services",
  announced_intent: "Announced", development: "In development", sampling_qualification: "Sampling", production_ramp: "In production",
  general_availability: "Available now", unknown: "Not stated",
};

export function humanize(code: string) {
  if (PLAIN[code]) return PLAIN[code];
  return code
    .split("_")
    .map((w, i) => (ACRONYMS.has(w) ? w.toUpperCase() : i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ")
    .replace(/\bMA\b/, "M&A");
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted">{children}</div>;
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            {head.map((h) => (
              <th key={h} className="px-2 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-2 py-2 align-top ${className}`}>{children}</td>;
}

export function CompanyLink({ id, name }: { id: string; name: string }) {
  return (
    <Link href={`/companies/${id}`} className="font-medium text-accent hover:underline">
      {name}
    </Link>
  );
}

export function SourceLink({ url, label }: { url: string; label?: string | null }) {
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {}
  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
      {label || host}
    </a>
  );
}
