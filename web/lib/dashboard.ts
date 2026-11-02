import { connection } from "next/server";
import { query, queryOne } from "@/lib/db";
import { FOCUS_SQL } from "@/lib/focus";

// Company-wise reads for the Module 1 dashboard. `co` is a company_id, or null for all deep-dive companies.
// Only published records are counted (record_status extracted/reviewed); nothing here is estimated.

export const WINDOW = { start: "2025-11-01", label: "1 Nov 2025 – today (last 12 months)" };

const LIVE = "record_status IN ('extracted', 'reviewed')";

function scope(col: string, co: string | null) {
  return co
    ? { sql: `${col} = ?`, args: [co] }
    : { sql: `${col} IN ${FOCUS_SQL}`, args: [] as string[] };
}

// Every source linked to a company through any of its published records.
const COMPANY_SOURCES = `
  SELECT s.company_id, rs.source_id, 'signal' AS via, rs.excerpt FROM m1_signal s
    JOIN record_source rs ON rs.record_type = 'm1_signal' AND rs.record_id = s.signal_id WHERE s.${LIVE}
  UNION ALL SELECT r.company_id, rs.source_id, 'relationship', rs.excerpt FROM company_relationship r
    JOIN record_source rs ON rs.record_type = 'relationship' AND rs.record_id = r.relationship_id
  UNION ALL SELECT h.company_id, h.source_id, 'hiring', h.description_excerpt FROM hiring_posting h WHERE h.source_id IS NOT NULL
  UNION ALL SELECT rs.record_id, rs.source_id, 'company', rs.excerpt FROM record_source rs WHERE rs.record_type = 'company'`;

export type Signal = {
  signal_id: string; company_id: string; short_name: string; signal_type: string; title: string;
  summary: string | null; event_date: string | null; publication_date: string | null; evidence_class: string;
  excerpt: string | null; url: string; source_name: string | null; source_type: string; sources: number;
};

export async function moduleCompanies() {
  await connection();
  return query<{ company_id: string; short_name: string; official_name: string; industry: string | null;
    intel_relationship_status: string | null }>(
    `SELECT company_id, short_name, official_name, industry, intel_relationship_status FROM company_master
     WHERE company_id IN ${FOCUS_SQL} ORDER BY short_name`);
}

export async function summary(co: string | null) {
  await connection();
  const s = scope("company_id", co);
  const k = await queryOne<Record<string, number>>(`
    SELECT
      (SELECT COUNT(*) FROM m1_signal WHERE ${LIVE} AND ${s.sql}) AS signals,
      (SELECT COUNT(*) FROM m1_signal WHERE ${LIVE} AND evidence_class = 'confirmed_fact' AND ${s.sql}) AS confirmed,
      (SELECT COUNT(*) FROM m1_signal WHERE ${LIVE} AND evidence_class = 'press_released_intent' AND ${s.sql}) AS intents,
      (SELECT COUNT(*) FROM hiring_posting WHERE ${s.sql}) AS postings,
      (SELECT COUNT(*) FROM company_relationship WHERE ${s.sql}) AS relationships,
      (SELECT COUNT(DISTINCT source_id) FROM (${COMPANY_SOURCES}) WHERE ${s.sql}) AS sources,
      (SELECT COUNT(DISTINCT cs.source_id) FROM (${COMPANY_SOURCES}) cs JOIN source_evidence se USING (source_id)
         WHERE se.source_type = 'regulatory_filing' AND cs.${s.sql}) AS filings`,
    Array(7).fill(s.args).flat());
  return k ?? {};
}

export async function signalsByMonth(co: string | null) {
  await connection();
  const s = scope("company_id", co);
  return query<{ month: string; confirmed: number; intent: number }>(`
    SELECT substr(publication_date, 1, 7) AS month,
      SUM(evidence_class = 'confirmed_fact') AS confirmed, SUM(evidence_class = 'press_released_intent') AS intent
    FROM m1_signal WHERE ${LIVE} AND ${s.sql} AND length(publication_date) >= 7 AND publication_date >= ?
    GROUP BY 1 ORDER BY 1`, [...s.args, "2025-11"]);
}

export async function channelCoverage(co: string | null) {
  await connection();
  const s = scope("cs.company_id", co);
  return query<{ source_type: string; n: number }>(`
    SELECT se.source_type, COUNT(DISTINCT se.source_id) AS n FROM (${COMPANY_SOURCES}) cs
    JOIN source_evidence se USING (source_id) WHERE ${s.sql} GROUP BY 1 ORDER BY n DESC`, s.args);
}

export async function topDomains(co: string | null, limit = 10) {
  await connection();
  const s = scope("cs.company_id", co);
  return query<{ source_name: string; source_type: string; n: number }>(`
    SELECT se.source_name, MIN(se.source_type) AS source_type, COUNT(DISTINCT se.source_id) AS n
    FROM (${COMPANY_SOURCES}) cs JOIN source_evidence se USING (source_id)
    WHERE ${s.sql} AND cs.via != 'hiring' AND se.source_name IS NOT NULL
    GROUP BY 1 ORDER BY n DESC LIMIT ${limit}`, s.args);
}

export async function comparison() {
  await connection();
  return query<Record<string, string | number | null>>(`
    SELECT c.company_id, c.short_name, c.intel_relationship_status,
      (SELECT COUNT(*) FROM m1_signal s WHERE s.company_id = c.company_id AND s.${LIVE}) AS signals,
      (SELECT COUNT(*) FROM m1_signal s WHERE s.company_id = c.company_id AND s.${LIVE} AND s.evidence_class = 'confirmed_fact') AS confirmed,
      (SELECT COUNT(*) FROM m1_signal s WHERE s.company_id = c.company_id AND s.${LIVE} AND s.evidence_class = 'press_released_intent') AS intents,
      (SELECT COUNT(*) FROM hiring_posting h WHERE h.company_id = c.company_id) AS postings,
      (SELECT COUNT(*) FROM company_relationship r WHERE r.company_id = c.company_id) AS relationships,
      (SELECT COUNT(DISTINCT source_id) FROM (${COMPANY_SOURCES}) cs WHERE cs.company_id = c.company_id) AS sources,
      (SELECT MAX(publication_date) FROM m1_signal s WHERE s.company_id = c.company_id AND s.${LIVE}) AS latest
    FROM company_master c WHERE c.company_id IN ${FOCUS_SQL} ORDER BY signals DESC, c.short_name`);
}

export async function signals(co: string | null, opts: { category?: string; sourceType?: string; cls?: string; limit?: number } = {}) {
  await connection();
  const s = scope("s.company_id", co);
  const where = [`s.${LIVE}`, s.sql];
  const args: string[] = [...s.args];
  if (opts.category) { where.push("s.signal_type = ?"); args.push(opts.category); }
  if (opts.cls) { where.push("s.evidence_class = ?"); args.push(opts.cls); }
  if (opts.sourceType) { where.push("se.source_type = ?"); args.push(opts.sourceType); }
  return query<Signal>(`
    SELECT s.signal_id, s.company_id, c.short_name, s.signal_type, s.title, s.summary, s.event_date, s.publication_date,
      s.evidence_class, rs.excerpt, se.url, se.source_name, se.source_type,
      (SELECT COUNT(*) FROM record_source x WHERE x.record_type = 'm1_signal' AND x.record_id = s.signal_id) AS sources
    FROM m1_signal s JOIN company_master c USING (company_id)
    JOIN record_source rs ON rs.record_type = 'm1_signal' AND rs.record_id = s.signal_id AND rs.source_role = 'primary'
    JOIN source_evidence se ON se.source_id = rs.source_id
    WHERE ${where.join(" AND ")}
    ORDER BY COALESCE(s.publication_date, s.event_date) DESC LIMIT ${opts.limit ?? 300}`, args);
}

export async function signalCategories(co: string | null) {
  await connection();
  const s = scope("company_id", co);
  return query<{ signal_type: string; confirmed: number; intent: number; n: number }>(`
    SELECT signal_type, SUM(evidence_class = 'confirmed_fact') AS confirmed,
      SUM(evidence_class = 'press_released_intent') AS intent, COUNT(*) AS n
    FROM m1_signal WHERE ${LIVE} AND ${s.sql} GROUP BY 1 ORDER BY n DESC`, s.args);
}

export async function hiringMix(co: string | null) {
  await connection();
  const s = scope("h.company_id", co);
  const [mix, trend, recent] = await Promise.all([
    query<{ company_id: string; short_name: string; role_category: string; n: number }>(`
      SELECT h.company_id, c.short_name, h.role_category, COUNT(*) AS n FROM hiring_posting h
      JOIN company_master c USING (company_id) WHERE ${s.sql} GROUP BY 1, 2, 3 ORDER BY c.short_name, n DESC`, s.args),
    query<{ month: string; n: number }>(`
      SELECT substr(COALESCE(h.posting_date, h.first_observed_date), 1, 7) AS month, COUNT(*) AS n
      FROM hiring_posting h WHERE ${s.sql} GROUP BY 1 ORDER BY 1`, s.args),
    query<Record<string, string | null>>(`
      SELECT h.posting_id, c.short_name, h.original_title, h.normalised_title, h.role_category, h.seniority, h.location,
        h.posting_date, h.first_observed_date, h.provider, se.url
      FROM hiring_posting h JOIN company_master c USING (company_id) LEFT JOIN source_evidence se USING (source_id)
      WHERE ${s.sql} ORDER BY COALESCE(h.posting_date, h.first_observed_date) DESC LIMIT 40`, s.args),
  ]);
  return { mix, trend, recent };
}

export async function ecosystem(co: string | null) {
  await connection();
  const s = scope("r.company_id", co);
  return query<Record<string, string | null>>(`
    SELECT r.relationship_id, r.company_id, c.short_name, sp.name AS partner, sp.supplier_category, r.relationship_type,
      r.commercial_stage, r.evidence_class, r.event_date, r.publication_date, r.summary, rs.excerpt, se.url, se.source_name
    FROM company_relationship r JOIN company_master c USING (company_id) JOIN supplier_partner_master sp USING (supplier_id)
    LEFT JOIN record_source rs ON rs.record_type = 'relationship' AND rs.record_id = r.relationship_id AND rs.source_role = 'primary'
    LEFT JOIN source_evidence se ON se.source_id = rs.source_id
    WHERE ${s.sql} ORDER BY sp.name, COALESCE(r.event_date, r.publication_date) DESC`, s.args);
}

export async function intelEvidence(co: string | null) {
  await connection();
  const s = scope("c.company_id", co);
  return query<Record<string, string | null>>(`
    SELECT c.company_id, c.short_name, c.intel_relationship_status, rs.excerpt AS link, se.url, se.source_name,
      se.publication_date
    FROM company_master c LEFT JOIN record_source rs ON rs.record_type = 'company' AND rs.record_id = c.company_id
      AND rs.excerpt LIKE '%intel_relationship_status%'
    LEFT JOIN source_evidence se ON se.source_id = rs.source_id
    WHERE ${s.sql} ORDER BY c.short_name, se.publication_date DESC`, s.args);
}

export async function evidenceLake(co: string | null, opts: { channel?: string; platform?: string; limit?: number }) {
  await connection();
  const s = scope("cs.company_id", co);
  const where = [s.sql];
  const args: string[] = [...s.args];
  if (opts.channel) { where.push("se.source_type = ?"); args.push(opts.channel); }
  if (opts.platform) { where.push("se.source_name = ?"); args.push(opts.platform); }
  const [rows, channels, platforms] = await Promise.all([
    query<Record<string, string | number | null>>(`
      SELECT se.source_id, se.url, se.source_type, se.source_name, se.title, se.publication_date, se.collected_date,
        se.first_observed_date, GROUP_CONCAT(DISTINCT c.short_name) AS companies, GROUP_CONCAT(DISTINCT cs.via) AS via,
        MIN(cs.excerpt) AS excerpt, COUNT(*) AS records
      FROM (${COMPANY_SOURCES}) cs JOIN source_evidence se USING (source_id) JOIN company_master c ON c.company_id = cs.company_id
      WHERE ${where.join(" AND ")}
      GROUP BY se.source_id ORDER BY se.source_type = 'job_posting', COALESCE(se.publication_date, se.collected_date) DESC LIMIT ${opts.limit ?? 120}`, args),
    query<{ source_type: string; n: number }>(`
      SELECT se.source_type, COUNT(DISTINCT se.source_id) AS n FROM (${COMPANY_SOURCES}) cs JOIN source_evidence se USING (source_id)
      WHERE ${s.sql} GROUP BY 1 ORDER BY n DESC`, s.args),
    query<{ source_name: string; n: number }>(`
      SELECT se.source_name, COUNT(DISTINCT se.source_id) AS n FROM (${COMPANY_SOURCES}) cs JOIN source_evidence se USING (source_id)
      WHERE ${s.sql} AND se.source_name IS NOT NULL ${opts.channel ? "AND se.source_type = ?" : ""}
      GROUP BY 1 ORDER BY n DESC LIMIT 25`, opts.channel ? [...s.args, opts.channel] : s.args),
  ]);
  const total = rows.length;
  return { rows, channels, platforms, total };
}

export async function providers(co: string | null) {
  await connection();
  const s = co ? { sql: "WHERE company_id = ?", args: [co] } : { sql: "", args: [] as string[] };
  const [byProvider, runs] = await Promise.all([
    query<{ provider: string; calls: number; ok: number; last: string }>(`
      SELECT provider, COUNT(*) AS calls, SUM(http_status = 200) AS ok, MAX(fetched_at) AS last
      FROM raw_provider_record ${s.sql} GROUP BY 1 ORDER BY calls DESC`, s.args),
    query<Record<string, string | number | null>>(`
      SELECT pipeline, started_at, finished_at, status, records_out FROM pipeline_run
      WHERE pipeline NOT LIKE '%probe%' ORDER BY started_at DESC LIMIT 12`),
  ]);
  return { byProvider, runs };
}
