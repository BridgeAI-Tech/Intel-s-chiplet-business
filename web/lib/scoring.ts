import { connection } from "next/server";
import { query, queryOne } from "@/lib/db";

// Part 2 scoring. Ratings, stages, qualification answers and mappings are stored per company with the record IDs
// behind them; the score, tier, qualification outcome and shortlist are computed here from the ACTIVE config, so
// editing weights or thresholds in Settings re-scores every company immediately. Mirrors compute_outcome() in
// scripts/m1_assessment.py.

export type Config = {
  version: string;
  rating_scale: { rating: number; label: string; meaning: string }[];
  dimensions: { key: string; label: string; weight: number; evaluate: string }[];
  tiers: { tier: number; min_score: number; label: string }[];
  development_stages: { stage: number; label: string; criteria: string }[];
  stage_rules: { min_supporting_records_above_stage_3: number; require_confirmed_fact_above_stage_3: boolean };
  evidence_confidence: { high: string; medium: string; low: string; high_min_primary_share: number; medium_min_primary_share: number };
  qualification: { questions: { key: string; label: string; question: string }[]; outcomes: Record<string, string> };
  shortlist: { shortlist_min: number; shortlist_max: number; deep_dive: number; note: string };
  mapping: { categories: { key: string; label: string }[] };
};
export type Rated = { rating: number; rationale: string; record_ids: string[]; insufficient: boolean };
export type Q = { answer: "yes" | "needs_validation" | "no"; requirement_status: string; rationale: string; record_ids: string[] };
export type MappingRow = {
  category: string; activity: string | null; requirement: string | null; offering_id: string | null; relevance: string;
  requirement_status: string; rationale: string | null; record_ids: string; offering_name: string | null;
  offering_excerpt: string | null; offering_url: string | null; offering_status: string | null;
};
export type Assessed = {
  company_id: string; short_name: string; official_name: string; intel_relationship_status: string | null;
  custom_silicon_activity: string; development_stage: number; stage_rationale: string; stage_record_ids: string[];
  ratings: Record<string, Rated>; evidence_confidence: string; primary_share: number; qualification: Record<string, Q>;
  opportunity_interpretation: string; checks: string[]; framework_version: string; assessed_at: string; model: string | null;
  score: number; tier: number; outcome: string; mappings: MappingRow[];
};

export async function activeConfig(): Promise<Config> {
  await connection();
  const row = await queryOne<{ version: string; config_json: string }>(
    "SELECT version, config_json FROM scoring_config WHERE active = 1 ORDER BY updated_at DESC LIMIT 1");
  return { ...JSON.parse(row!.config_json), version: row!.version };
}

export async function configHistory() {
  await connection();
  return query<{ version: string; active: number; updated_at: string; updated_by: string | null }>(
    "SELECT version, active, updated_at, updated_by FROM scoring_config ORDER BY updated_at DESC");
}

export function compute(ratings: Record<string, Rated>, qual: Record<string, Q>, cfg: Config) {
  const score = cfg.dimensions.reduce((a, d) => a + ((ratings[d.key]?.rating ?? 1) / 5) * d.weight, 0);
  const tier = [...cfg.tiers].sort((a, b) => b.min_score - a.min_score).find((t) => score >= t.min_score)?.tier ?? cfg.tiers.length;
  const q = (k: string) => qual[k]?.answer;
  const outcome = q("q1") === "no" ? "not_qualified_q1"
    : q("q2") === "no" || q("q3") === "no" ? "not_qualified_fit"
    : q("q1") === "yes" && q("q2") === "yes" && q("q3") === "yes" ? "qualified" : "conditional";
  return { score: Math.round(score * 10) / 10, tier, outcome };
}

const CONF_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };
const FIT_RANK: Record<string, number> = { direct_fit: 2, adjacent_fit: 1, no_identified_fit: 0 };

// Shortlist order from the brief: qualified first, then score/tier, development stage, evidence confidence, Intel fit.
export function rank(rows: Assessed[]) {
  const fit = (r: Assessed) => r.mappings.reduce((a, m) => a + (FIT_RANK[m.relevance] ?? 0), 0);
  return [...rows].sort((a, b) =>
    (a.outcome === "qualified" ? 0 : a.outcome === "conditional" ? 1 : 2) - (b.outcome === "qualified" ? 0 : b.outcome === "conditional" ? 1 : 2)
    || b.score - a.score || b.development_stage - a.development_stage
    || (CONF_RANK[b.evidence_confidence] ?? 0) - (CONF_RANK[a.evidence_confidence] ?? 0) || fit(b) - fit(a));
}

export async function assessments(companyId?: string) {
  await connection();
  const cfg = await activeConfig();
  const rows = await query<Record<string, string | number | null>>(
    `SELECT a.*, c.short_name, c.official_name, c.intel_relationship_status FROM company_assessment a
     JOIN company_master c USING (company_id) ${companyId ? "WHERE a.company_id = ?" : ""}
     ORDER BY c.short_name`, companyId ? [companyId] : []);
  const maps = await query<MappingRow & { company_id: string }>(
    `SELECT m.*, o.name AS offering_name, o.excerpt AS offering_excerpt, o.status AS offering_status, se.url AS offering_url
     FROM portfolio_mapping m LEFT JOIN intel_offering o USING (offering_id) LEFT JOIN source_evidence se ON se.source_id = o.source_id
     ${companyId ? "WHERE m.company_id = ?" : ""}`, companyId ? [companyId] : []);
  const order = cfg.mapping.categories.map((c) => c.key);
  return rows.map((r) => {
    const ratings = JSON.parse(String(r.ratings)) as Record<string, Rated>;
    const qualification = JSON.parse(String(r.qualification)) as Record<string, Q>;
    return {
      company_id: String(r.company_id), short_name: String(r.short_name), official_name: String(r.official_name),
      intel_relationship_status: r.intel_relationship_status as string | null,
      custom_silicon_activity: String(r.custom_silicon_activity ?? ""), development_stage: Number(r.development_stage),
      stage_rationale: String(r.stage_rationale ?? ""), stage_record_ids: JSON.parse(String(r.stage_record_ids ?? "[]")),
      ratings, evidence_confidence: String(r.evidence_confidence), primary_share: Number(r.primary_share ?? 0), qualification,
      opportunity_interpretation: String(r.opportunity_interpretation ?? ""), checks: JSON.parse(String(r.checks ?? "[]")),
      framework_version: String(r.framework_version), assessed_at: String(r.assessed_at), model: r.model as string | null,
      ...compute(ratings, qualification, cfg),
      mappings: maps.filter((m) => m.company_id === r.company_id).sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category)),
    } satisfies Assessed;
  });
}

// Record IDs used in assessments ("sig:…", "rel:…", "hiring:engineering_roles", "intel:intel_relationship") -> label + link.
export async function resolveRecords(companyId: string, ids: string[]) {
  await connection();
  const sig = ids.filter((i) => i.startsWith("sig:")).map((i) => i.slice(4));
  const rel = ids.filter((i) => i.startsWith("rel:")).map((i) => i.slice(4));
  const out = new Map<string, { label: string; href: string; date: string | null; cls: string | null; url: string | null }>();
  if (sig.length) {
    (await query<Record<string, string | null>>(
      `SELECT s.signal_id, s.title, COALESCE(s.event_date, s.publication_date) AS d, s.evidence_class, se.url
       FROM m1_signal s LEFT JOIN record_source rs ON rs.record_type = 'm1_signal' AND rs.record_id = s.signal_id AND rs.source_role = 'primary'
       LEFT JOIN source_evidence se ON se.source_id = rs.source_id WHERE s.signal_id IN (${sig.map(() => "?").join(",")})`, sig))
      .forEach((r) => out.set(`sig:${r.signal_id}`, { label: String(r.title), href: `/events/m1_signal/${r.signal_id}`, date: r.d, cls: r.evidence_class, url: r.url }));
  }
  if (rel.length) {
    (await query<Record<string, string | null>>(
      `SELECT r.relationship_id, sp.name, r.relationship_type, COALESCE(r.event_date, r.publication_date) AS d, r.evidence_class
       FROM company_relationship r JOIN supplier_partner_master sp USING (supplier_id) WHERE r.relationship_id IN (${rel.map(() => "?").join(",")})`, rel))
      .forEach((r) => out.set(`rel:${r.relationship_id}`, { label: `Relationship with ${r.name} (${String(r.relationship_type).replace(/_/g, " ")})`,
        href: `/companies/${companyId}`, date: r.d, cls: r.evidence_class, url: null }));
  }
  if (ids.includes("hiring:engineering_roles"))
    out.set("hiring:engineering_roles", { label: "Silicon job postings (role mix)", href: `/?co=${companyId}&tab=hiring`, date: null, cls: null, url: null });
  if (ids.includes("intel:intel_relationship"))
    out.set("intel:intel_relationship", { label: "Intel relationship evidence", href: `/companies/${companyId}`, date: null, cls: null, url: null });
  return out;
}

export async function offerings() {
  await connection();
  return query<Record<string, string | null>>(
    `SELECT o.*, se.url FROM intel_offering o LEFT JOIN source_evidence se ON se.source_id = o.source_id
     ORDER BY o.mapping_category, o.dataset, o.name`);
}
