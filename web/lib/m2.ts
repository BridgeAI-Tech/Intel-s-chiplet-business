import { connection } from "next/server";
import { query, queryOne } from "@/lib/db";

// Module 2 reads. `co` is a competitor company_id, or null for all tracked competitors.
// Only published events (record_status extracted/reviewed) are counted.

export const COMPETITORS_SQL = `(SELECT company_id FROM company_master WHERE in_module_2 = 1 AND in_module_1 = 0)`;
const LIVE = "e.record_status IN ('extracted', 'reviewed')";

function scope(co: string | null) {
  return co ? { sql: "e.company_id = ?", args: [co] } : { sql: `e.company_id IN ${COMPETITORS_SQL}`, args: [] as string[] };
}

export type M2Event = {
  event_id: string; company_id: string; short_name: string; event_type: string; event_title: string; summary: string | null;
  event_date: string | null; publication_date: string | null; evidence_class: string; counterparty_name: string | null;
  product_or_programme: string | null; architecture_or_node: string | null; packaging_or_interconnect: string | null;
  commercial_stage: string | null; excerpt: string | null; url: string; source_name: string | null; source_type: string; sources: number;
};

export async function competitors() {
  await connection();
  return query<{ company_id: string; short_name: string; official_name: string; value_chain_role: string | null;
    intel_relationship_status: string | null }>(
    `SELECT company_id, short_name, official_name, value_chain_role, intel_relationship_status FROM company_master
     WHERE company_id IN ${COMPETITORS_SQL} ORDER BY short_name`);
}

export async function m2Summary(co: string | null) {
  await connection();
  const s = scope(co);
  return (await queryOne<Record<string, number>>(`
    SELECT COUNT(*) AS events, SUM(e.evidence_class = 'confirmed_fact') AS confirmed,
      SUM(e.evidence_class = 'press_released_intent') AS intents, COUNT(DISTINCT e.company_id) AS companies,
      COUNT(DISTINCT e.counterparty_name) AS counterparties,
      (SELECT COUNT(DISTINCT rs.source_id) FROM record_source rs JOIN m2_competitive_event e ON rs.record_type = 'm2_event'
         AND rs.record_id = e.event_id WHERE ${LIVE} AND ${s.sql}) AS sources,
      (SELECT COUNT(DISTINCT rs.source_id) FROM record_source rs JOIN m2_competitive_event e ON rs.record_type = 'm2_event'
         AND rs.record_id = e.event_id JOIN source_evidence se ON se.source_id = rs.source_id
       WHERE ${LIVE} AND ${s.sql} AND se.source_type = 'regulatory_filing') AS filings
    FROM m2_competitive_event e WHERE ${LIVE} AND ${s.sql}`, [...s.args, ...s.args, ...s.args])) ?? {};
}

export async function byCompetitor() {
  await connection();
  return query<{ company_id: string; short_name: string; n: number; confirmed: number }>(`
    SELECT c.company_id, c.short_name, COUNT(e.event_id) AS n, SUM(e.evidence_class = 'confirmed_fact') AS confirmed
    FROM company_master c LEFT JOIN m2_competitive_event e ON e.company_id = c.company_id AND ${LIVE}
    WHERE c.company_id IN ${COMPETITORS_SQL} GROUP BY 1, 2 ORDER BY n DESC`);
}

export async function byType(co: string | null) {
  await connection();
  const s = scope(co);
  return query<{ event_type: string; n: number }>(`
    SELECT e.event_type, COUNT(*) AS n FROM m2_competitive_event e WHERE ${LIVE} AND ${s.sql} GROUP BY 1 ORDER BY n DESC`, s.args);
}

export async function byMonth(co: string | null) {
  await connection();
  const s = scope(co);
  return query<{ month: string; confirmed: number; intent: number }>(`
    SELECT substr(e.publication_date, 1, 7) AS month, SUM(e.evidence_class = 'confirmed_fact') AS confirmed,
      SUM(e.evidence_class = 'press_released_intent') AS intent
    FROM m2_competitive_event e WHERE ${LIVE} AND ${s.sql} AND e.publication_date >= '2025-11' GROUP BY 1 ORDER BY 1`, s.args);
}

export async function counterparties(co: string | null, limit = 10) {
  await connection();
  const s = scope(co);
  return query<{ name: string; n: number }>(`
    SELECT e.counterparty_name AS name, COUNT(*) AS n FROM m2_competitive_event e
    WHERE ${LIVE} AND ${s.sql} AND e.counterparty_name IS NOT NULL GROUP BY 1 ORDER BY n DESC, 1 LIMIT ${limit}`, s.args);
}

export async function m2Events(co: string | null, opts: { type?: string; types?: string[]; cls?: string; limit?: number } = {}) {
  await connection();
  const s = scope(co);
  const where = [LIVE, s.sql];
  const args: string[] = [...s.args];
  if (opts.type) { where.push("e.event_type = ?"); args.push(opts.type); }
  if (opts.types?.length) { where.push(`e.event_type IN (${opts.types.map(() => "?").join(",")})`); args.push(...opts.types); }
  if (opts.cls) { where.push("e.evidence_class = ?"); args.push(opts.cls); }
  return query<M2Event>(`
    SELECT e.event_id, e.company_id, c.short_name, e.event_type, e.event_title, e.summary, e.event_date, e.publication_date,
      e.evidence_class, e.counterparty_name, e.product_or_programme, e.architecture_or_node, e.packaging_or_interconnect,
      e.commercial_stage, rs.excerpt, se.url, se.source_name, se.source_type,
      (SELECT COUNT(*) FROM record_source x WHERE x.record_type = 'm2_event' AND x.record_id = e.event_id) AS sources
    FROM m2_competitive_event e JOIN company_master c USING (company_id)
    JOIN record_source rs ON rs.record_type = 'm2_event' AND rs.record_id = e.event_id AND rs.source_role = 'primary'
    JOIN source_evidence se ON se.source_id = rs.source_id
    WHERE ${where.join(" AND ")} ORDER BY COALESCE(e.event_date, e.publication_date) DESC LIMIT ${opts.limit ?? 400}`, args);
}

export async function m2Channels(co: string | null) {
  await connection();
  const s = scope(co);
  return query<{ source_type: string; n: number }>(`
    SELECT se.source_type, COUNT(DISTINCT se.source_id) AS n FROM m2_competitive_event e
    JOIN record_source rs ON rs.record_type = 'm2_event' AND rs.record_id = e.event_id
    JOIN source_evidence se ON se.source_id = rs.source_id WHERE ${LIVE} AND ${s.sql} GROUP BY 1 ORDER BY n DESC`, s.args);
}
