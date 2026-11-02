import { connection } from "next/server";
import { query, queryOne } from "@/lib/db";

export type Company = {
  company_id: string;
  official_name: string;
  short_name: string;
  entity_type: string;
  primary_domain: string;
  hq_country: string | null;
  hq_city: string | null;
  linkedin_url: string | null;
  linkedin_verified: number;
  parent_company_id: string | null;
  business_units: string | null;
  industry: string | null;
  research_roles: string;
  value_chain_role: string | null;
  intel_relationship_status: string | null;
  in_module_1: number;
  in_module_2: number;
  matching_notes: string | null;
  needs_verification: string | null;
  master_status: string;
};

export type Evidence = {
  source_id: string;
  url: string;
  source_type: string;
  source_name: string | null;
  title: string | null;
  publication_date: string | null;
  event_date: string | null;
  first_observed_date: string;
  collected_date: string;
  excerpt: string | null;
};

export type EventRow = {
  id: string;
  module: number;
  company_id: string;
  short_name: string;
  category: string;
  title: string;
  summary: string | null;
  event_date: string | null;
  publication_date: string | null;
  evidence_class: string;
};

// All reads are per-request: the database changes whenever a pipeline runs.
async function fresh() {
  await connection();
}

export async function counts() {
  await fresh();
  const row = await queryOne<Record<string, number>>(`
    SELECT
      (SELECT COUNT(*) FROM company_master WHERE in_module_1 = 1) AS m1_companies,
      (SELECT COUNT(*) FROM company_master WHERE in_module_2 = 1) AS m2_entities,
      (SELECT COUNT(DISTINCT entity_id) FROM assessment WHERE module = 1 AND status = 'reviewed') AS shortlisted,
      (SELECT COUNT(*) FROM m1_signal WHERE record_status IN ('extracted', 'reviewed')) AS m1_signals,
      (SELECT COUNT(*) FROM m2_competitive_event WHERE record_status IN ('extracted', 'reviewed')) AS m2_events,
      (SELECT COUNT(*) FROM hiring_posting) AS postings,
      (SELECT COUNT(*) FROM source_evidence) AS sources,
      (SELECT COUNT(*) FROM programme_master) AS programmes,
      (SELECT COUNT(*) FROM company_master WHERE master_status IN ('validated', 'signed_off')) AS validated,
      (SELECT COUNT(*) FROM company_master) AS total_companies`);
  return row ?? {};
}

export async function companies(where: "m1" | "m2" | "all" = "all") {
  await fresh();
  const filter = where === "m1" ? "WHERE in_module_1 = 1" : where === "m2" ? "WHERE in_module_2 = 1" : "";
  return query<Company>(`SELECT * FROM company_master ${filter} ORDER BY short_name`);
}

export async function company(id: string) {
  await fresh();
  return queryOne<Company>("SELECT * FROM company_master WHERE company_id = ?", [id]);
}

export async function programmesFor(companyIds: string[]) {
  await fresh();
  if (!companyIds.length) return [];
  return query<Record<string, string | number | null>>(
    `SELECT p.*, c.short_name FROM programme_master p JOIN company_master c USING (company_id)
     WHERE p.company_id IN (${companyIds.map(() => "?").join(",")}) ORDER BY c.short_name, p.name`,
    companyIds,
  );
}

export async function companyEvidence(id: string) {
  await fresh();
  return query<Evidence & { link: string }>(
    `SELECT se.*, rs.excerpt AS link FROM record_source rs JOIN source_evidence se USING (source_id)
     WHERE rs.record_type = 'company' AND rs.record_id = ? ORDER BY se.publication_date DESC`,
    [id],
  );
}

export async function events(opts: { module?: 1 | 2; companyId?: string; limit?: number } = {}) {
  await fresh();
  const parts: string[] = [];
  const args: string[] = [];
  if (opts.module !== 2)
    parts.push(`SELECT s.signal_id AS id, 1 AS module, s.company_id, c.short_name, s.signal_type AS category, s.title,
                       s.summary, s.event_date, s.publication_date, s.evidence_class
                FROM m1_signal s JOIN company_master c USING (company_id) WHERE s.record_status IN ('extracted', 'reviewed')
                ${opts.companyId ? "AND s.company_id = ?" : ""}`);
  if (opts.companyId && opts.module !== 2) args.push(opts.companyId);
  if (opts.module !== 1)
    parts.push(`SELECT e.event_id AS id, 2 AS module, e.company_id, c.short_name, e.event_type AS category,
                       e.event_title AS title, e.summary, e.event_date, e.publication_date, e.evidence_class
                FROM m2_competitive_event e JOIN company_master c USING (company_id) WHERE e.record_status IN ('extracted', 'reviewed')
                ${opts.companyId ? "AND e.company_id = ?" : ""}`);
  if (opts.companyId && opts.module !== 1) args.push(opts.companyId);
  return query<EventRow>(
    `SELECT * FROM (${parts.join(" UNION ALL ")}) ORDER BY COALESCE(event_date, publication_date) DESC LIMIT ${opts.limit ?? 200}`,
    args,
  );
}

export async function eventSources(recordType: "m1_signal" | "m2_event", id: string) {
  await fresh();
  return query<Evidence & { link_excerpt: string | null; source_role: string }>(
    `SELECT se.*, rs.excerpt AS link_excerpt, rs.source_role FROM record_source rs JOIN source_evidence se USING (source_id)
     WHERE rs.record_type = ? AND rs.record_id = ?`,
    [recordType, id],
  );
}

export async function hiring(companyId: string) {
  await fresh();
  const [byCategory, recent] = await Promise.all([
    query<{ role_category: string | null; n: number }>(
      `SELECT role_category, COUNT(*) AS n FROM hiring_posting WHERE company_id = ? GROUP BY role_category ORDER BY n DESC`,
      [companyId],
    ),
    query<Record<string, string | null>>(
      `SELECT h.*, se.url FROM hiring_posting h LEFT JOIN source_evidence se USING (source_id)
       WHERE h.company_id = ? ORDER BY h.first_observed_date DESC LIMIT 25`,
      [companyId],
    ),
  ]);
  return { byCategory, recent };
}

export async function relationships(companyId: string) {
  await fresh();
  return query<Record<string, string | null>>(
    `SELECT r.*, s.name AS supplier_name, s.supplier_category FROM company_relationship r
     JOIN supplier_partner_master s USING (supplier_id) WHERE r.company_id = ? ORDER BY r.event_date DESC`,
    [companyId],
  );
}

export async function evidenceList(q: string, sourceType: string, limit = 200) {
  await fresh();
  const where: string[] = [];
  const args: string[] = [];
  if (q) {
    where.push("(se.title LIKE ? OR se.excerpt LIKE ? OR se.url LIKE ? OR se.source_name LIKE ?)");
    args.push(...Array(4).fill(`%${q}%`));
  }
  if (sourceType) {
    where.push("se.source_type = ?");
    args.push(sourceType);
  }
  return query<Evidence & { companies: string | null }>(
    `SELECT se.*, (SELECT GROUP_CONCAT(DISTINCT c.short_name) FROM record_source rs
                   JOIN company_master c ON c.company_id = rs.record_id WHERE rs.source_id = se.source_id) AS companies
     FROM source_evidence se ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY COALESCE(se.publication_date, se.collected_date) DESC LIMIT ${limit}`,
    args,
  );
}

export async function evidenceDetail(id: string) {
  await fresh();
  const source = await queryOne<Evidence & { full_text: string | null }>(
    "SELECT * FROM source_evidence WHERE source_id = ?", [id]);
  const links = await query<{ record_type: string; record_id: string; excerpt: string | null }>(
    "SELECT record_type, record_id, excerpt FROM record_source WHERE source_id = ?", [id]);
  return { source, links };
}

export async function sourceTypes() {
  await fresh();
  return query<{ source_type: string; n: number }>(
    "SELECT source_type, COUNT(*) AS n FROM source_evidence GROUP BY source_type ORDER BY n DESC");
}

export async function pipelineRuns(limit = 8) {
  await fresh();
  return query<Record<string, string | number | null>>(
    `SELECT pipeline, started_at, status, records_in, records_out FROM pipeline_run ORDER BY started_at DESC LIMIT ${limit}`);
}
