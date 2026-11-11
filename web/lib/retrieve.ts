import { query } from "@/lib/db";
import { FOCUS_SQL } from "@/lib/focus";

export type Doc = {
  ref: string;
  kind: string;
  company: string;
  title: string;
  text: string;
  date: string | null;
  evidence_class: string | null;
  url: string | null;
  link: string;
};

const STOP = new Set(["what", "which", "who", "whose", "when", "where", "have", "has", "the", "and", "for", "with", "that",
  "this", "from", "show", "shows", "are", "was", "were", "any", "about", "over", "last", "months", "year", "their",
  "there", "does", "did", "how", "most", "latest", "companies", "company", "evidence", "into", "between", "been"]);

// Domain synonyms so broad questions reach the specific vocabulary used in sources.
const EXPAND: Record<string, string[]> = {
  silicon: ["chip", "asic", "soc", "accelerator", "processor", "xpu"],
  custom: ["asic", "in-house", "xpu"],
  chiplet: ["multi-die", "die-to-die", "ucie"],
  packaging: ["cowos", "emib", "foveros", "hbm", "interposer", "3d"],
  foundry: ["tsmc", "fab", "wafer", "process node", "nm"],
  manufacturing: ["fab", "wafer", "production", "foundry"],
  supplier: ["foundry", "partner", "supply"],
  hiring: ["job", "engineer", "role"],
  roles: ["engineer", "job"],
  design: ["rtl", "verification", "physical design", "architecture"],
};

function terms(question: string) {
  const base = (question.toLowerCase().match(/[a-z0-9][a-z0-9.+]{1,}/g) ?? []).filter((t) => t.length > 2 && !STOP.has(t));
  return [...new Set(base.flatMap((t) => [t, ...(EXPAND[t] ?? [])]))].slice(0, 24);
}

// Keyword retrieval over the full backend (not dashboard summaries): signals with their verified excerpts,
// relationships, hiring postings and company-master facts with verification excerpts.
export async function retrieve(question: string, limit = 40): Promise<Doc[]> {
  const t = terms(question);
  if (!t.length) return [];
  const like = (cols: string[]) => t.map(() => `(${cols.map((c) => `LOWER(${c}) LIKE ?`).join(" OR ")})`);
  const score = (cols: string[]) => like(cols).map((c) => `(CASE WHEN ${c} THEN 1 ELSE 0 END)`).join(" + ");
  const args = (cols: string[]) => t.flatMap((x) => cols.map(() => `%${x}%`));

  const sigCols = ["s.title", "s.summary", "rs.excerpt", "c.short_name", "s.signal_type", "s.technology_tags"];
  // Best matches overall, capped per company so one company cannot crowd out the rest.
  const signals = await query<Record<string, string | number | null>>(
    `SELECT * FROM (
       SELECT s.signal_id, c.short_name, s.title, s.summary, s.signal_type, rs.excerpt, s.evidence_class,
              COALESCE(s.event_date, s.publication_date) AS d, se.url, (${score(sigCols)}) AS sc,
              ROW_NUMBER() OVER (PARTITION BY s.company_id ORDER BY (${score(sigCols)}) DESC,
                                 COALESCE(s.event_date, s.publication_date) DESC) AS rn
       FROM m1_signal s JOIN company_master c USING (company_id)
       JOIN record_source rs ON rs.record_type = 'm1_signal' AND rs.record_id = s.signal_id AND rs.source_role = 'primary'
       JOIN source_evidence se ON se.source_id = rs.source_id
       WHERE s.record_status IN ('extracted', 'reviewed') AND s.company_id IN ${FOCUS_SQL} AND (${like(sigCols).join(" OR ")}))
     WHERE rn <= 6 ORDER BY sc DESC, d DESC LIMIT ${limit}`,
    [...args(sigCols), ...args(sigCols), ...args(sigCols)]);

  const relCols = ["c.short_name", "sp.name", "r.relationship_type", "r.summary"];
  const rels = await query<Record<string, string | number | null>>(
    `SELECT r.relationship_id, r.company_id, c.short_name, sp.name, r.relationship_type, r.summary, r.evidence_class,
            COALESCE(r.event_date, r.publication_date) AS d, (${score(relCols)}) AS sc, rs.excerpt, se.url
     FROM company_relationship r JOIN company_master c USING (company_id) JOIN supplier_partner_master sp USING (supplier_id)
     LEFT JOIN record_source rs ON rs.record_type = 'relationship' AND rs.record_id = r.relationship_id AND rs.source_role = 'primary'
     LEFT JOIN source_evidence se ON se.source_id = rs.source_id
     WHERE r.company_id IN ${FOCUS_SQL} AND (${like(relCols).join(" OR ")}) ORDER BY sc DESC LIMIT 15`,
    [...args(relCols), ...args(relCols)]);

  const jobCols = ["c.short_name", "h.role_category", "h.normalised_title", "h.original_title", "h.description_excerpt"];
  const jobs = await query<Record<string, string | number | null>>(
    `SELECT c.short_name, c.company_id, h.role_category, COUNT(*) AS n,
            MIN(COALESCE(h.posting_date, h.first_observed_date)) AS first_d,
            MAX(COALESCE(h.posting_date, h.first_observed_date)) AS last_d,
            (SELECT se.url FROM hiring_posting h2 JOIN source_evidence se ON se.source_id = h2.source_id
             WHERE h2.company_id = h.company_id AND h2.role_category = h.role_category
             ORDER BY COALESCE(h2.posting_date, h2.first_observed_date) DESC LIMIT 1) AS url
     FROM hiring_posting h JOIN company_master c USING (company_id)
     WHERE h.company_id IN ${FOCUS_SQL} AND (${like(jobCols).join(" OR ")}) GROUP BY 1, 2, 3 ORDER BY n DESC LIMIT 20`, args(jobCols));

  const coCols = ["c.short_name", "c.official_name", "c.intel_relationship_status", "rs.excerpt"];
  const companyFacts = await query<Record<string, string | number | null>>(
    `SELECT c.company_id, c.short_name, c.intel_relationship_status, rs.excerpt, se.url, se.publication_date AS d
     FROM company_master c JOIN record_source rs ON rs.record_type = 'company' AND rs.record_id = c.company_id
     JOIN source_evidence se ON se.source_id = rs.source_id
     WHERE c.company_id IN ${FOCUS_SQL} AND rs.excerpt LIKE '%intel_relationship_status%' AND (${like(coCols).join(" OR ")}) LIMIT 10`, args(coCols));

  // Module 2: competitor events (Broadcom, Marvell, TSMC, AMD, NVIDIA, Arm, Samsung Foundry), capped per competitor.
  const evCols = ["e.event_title", "e.summary", "rs.excerpt", "c.short_name", "e.event_type", "e.counterparty_name",
    "e.product_or_programme", "e.architecture_or_node", "e.packaging_or_interconnect"];
  const m2 = await query<Record<string, string | number | null>>(
    `SELECT * FROM (
       SELECT e.event_id, c.short_name, e.event_title, e.summary, e.event_type, rs.excerpt, e.evidence_class,
              COALESCE(e.event_date, e.publication_date) AS d, se.url, (${score(evCols)}) AS sc,
              ROW_NUMBER() OVER (PARTITION BY e.company_id ORDER BY (${score(evCols)}) DESC,
                                 COALESCE(e.event_date, e.publication_date) DESC) AS rn
       FROM m2_competitive_event e JOIN company_master c USING (company_id)
       JOIN record_source rs ON rs.record_type = 'm2_event' AND rs.record_id = e.event_id AND rs.source_role = 'primary'
       JOIN source_evidence se ON se.source_id = rs.source_id
       WHERE e.record_status IN ('extracted', 'reviewed') AND (${like(evCols).join(" OR ")}))
     WHERE rn <= 6 ORDER BY sc DESC, d DESC LIMIT 30`,
    [...args(evCols), ...args(evCols), ...args(evCols)]);

  const docs: Doc[] = [];
  m2.forEach((e) => docs.push({
    ref: "", kind: `competitor event · ${e.event_type}`, company: String(e.short_name), title: String(e.event_title),
    text: `${e.summary ?? ""} Source excerpt: "${e.excerpt}"`, date: e.d as string | null,
    evidence_class: e.evidence_class as string, url: e.url as string, link: `/events/m2_event/${e.event_id}`,
  }));
  signals.forEach((s) => docs.push({
    ref: "", kind: `signal · ${s.signal_type}`, company: String(s.short_name), title: String(s.title),
    text: `${s.summary ?? ""} Source excerpt: "${s.excerpt}"`, date: s.d as string | null,
    evidence_class: s.evidence_class as string, url: s.url as string, link: `/events/m1_signal/${s.signal_id}`,
  }));
  rels.forEach((r) => docs.push({
    ref: "", kind: `relationship · ${r.relationship_type}`, company: String(r.short_name), title: `${r.short_name} ↔ ${r.name}`,
    text: `${r.summary ?? ""}${r.excerpt ? ` Source excerpt: "${r.excerpt}"` : ""}`, date: r.d as string | null,
    evidence_class: r.evidence_class as string, url: (r.url as string | null) ?? null,
    link: `/companies/${r.company_id}`,
  }));
  jobs.forEach((j) => docs.push({
    ref: "", kind: "hiring aggregate", company: String(j.short_name), title: `${j.short_name}: ${j.n} silicon postings in ${j.role_category}`,
    text: `${j.n} open or recent silicon-relevant job postings classified as ${j.role_category}, posted or first observed between ${j.first_d} and ${j.last_d}. Vacancies are not confirmed hires.`,
    date: j.last_d as string | null, evidence_class: null, url: (j.url as string | null) ?? null, link: `/?co=${j.company_id}&tab=hiring`,
  }));
  companyFacts.forEach((f) => {
    let ex = String(f.excerpt);
    let cls: string | null = null;
    try { const p = JSON.parse(ex); ex = p.excerpt; cls = p.evidence_class; } catch {}
    docs.push({
      ref: "", kind: "Intel relationship evidence", company: String(f.short_name), title: `${f.short_name} — ${f.intel_relationship_status}`,
      text: `Source excerpt: "${ex}"`, date: f.d as string | null, evidence_class: cls, url: f.url as string,
      link: `/companies/${f.company_id}`,
    });
  });
  docs.forEach((d, i) => { d.ref = `S${i + 1}`; });
  return docs;
}
