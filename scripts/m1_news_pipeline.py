"""Module 1 news & developments pipeline (M1-4 + supplier relationships for M1-5).

Exa search (official + trusted trade-press domains) -> Gemini extraction -> deterministic checks ->
only `accepted` records are written to m1_signal / company_relationship with their source evidence.
Everything else is exported to data/review/m1_news_review.xlsx and never shown in the app.

Usage:
    python scripts/m1_news_pipeline.py [--companies cmp_cerebras,cmp_aws] [--per-query 8] [--workers 6]
"""
import argparse
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from openpyxl import Workbook

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from chiplet.db import REVIEW_DIR, connect
from chiplet.extract.llm import ExtractionError, Extractor
from chiplet.extract.normalize import CompanyIndex, canonical_url, excerpt_in_source, parse_date, stable_id
from chiplet.extract.store import upsert_source
from chiplet.sources.providers import Exa
from chiplet.sources.store import RawStore, utc_now

WINDOW_START = "2025-11-01"
EXA_START = "2025-11-01T00:00:00.000Z"

PARTNER_NEWSROOMS = [
    "intel.com", "newsroom.intel.com", "tsmc.com", "pr.tsmc.com", "samsung.com", "news.samsung.com",
    "broadcom.com", "investors.broadcom.com", "marvell.com", "investor.marvell.com", "arm.com", "newsroom.arm.com",
    "nvidia.com", "nvidianews.nvidia.com", "amd.com", "ir.amd.com", "synopsys.com", "cadence.com", "amkor.com",
    "aseglobal.com", "globalfoundries.com", "micron.com", "skhynix.com", "sec.gov",
]
TRADE_PRESS = [
    "reuters.com", "eetimes.com", "semiengineering.com", "theregister.com", "tomshardware.com", "servethehome.com",
    "nextplatform.com", "datacenterdynamics.com", "trendforce.com", "digitimes.com", "semianalysis.com",
    "anandtech.com", "techpowerup.com", "theverge.com", "techcrunch.com", "cnbc.com", "bloomberg.com",
    "electronicsweekly.com", "eenewseurope.com", "hpcwire.com", "theinformation.com", "wsj.com", "ft.com",
]
EXTRA_OFFICIAL = {"cmp_aws": ["aboutamazon.com", "press.aboutamazon.com", "amazon.science"],
                  "cmp_google": ["blog.google", "cloud.google.com"], "cmp_meta": ["ai.meta.com", "about.fb.com"],
                  "cmp_microsoft": ["news.microsoft.com", "azure.microsoft.com"], "cmp_tesla": ["ir.tesla.com"],
                  "cmp_apple": ["apple.com/newsroom"], "cmp_ibm": ["newsroom.ibm.com", "research.ibm.com"],
                  "cmp_cerebras": ["investor.cerebras.ai"]}
SUPPLIER_ROLES = {"foundry": "foundry", "packaging_partner": "osat_packaging", "supplier": "other",
                  "ip_provider": "ip_provider", "eda_vendor": "eda_vendor", "design_partner": "design_services"}
RELATIONSHIP_FOR_ROLE = {"foundry": "foundry_manufacturing", "packaging_partner": "packaging_assembly",
                         "supplier": "memory_supply", "ip_provider": "ip_licence", "eda_vendor": "eda_tools",
                         "design_partner": "design_partner"}


def queries_for(company, programmes):
    names = " ".join(programmes[:4])
    n = company["short_name"]
    return [
        f"{n} custom silicon chip {names} announcement launch roadmap",
        f"{n} {names} foundry manufacturing process node advanced packaging chiplet HBM",
        f"{n} semiconductor partnership supplier agreement investment acquisition chip design",
    ]


def collect(conn, store, comps, per_query):
    exa = Exa(store)
    docs = {}
    for co in comps:
        programmes = [r[0] for r in conn.execute(
            "SELECT name FROM programme_master WHERE company_id = ? ORDER BY name", (co["company_id"],))]
        official = [co["primary_domain"], *json.loads(co["alt_domains"] or "[]"),
                    *EXTRA_OFFICIAL.get(co["company_id"], []), *PARTNER_NEWSROOMS]
        for q in queries_for(co, programmes):
            for domains in (official, TRADE_PRESS):
                status, payload, _ = exa.search(co["company_id"], q, EXA_START, num_results=per_query,
                                                include_domains=domains, max_characters=20000)
                if status != 200:
                    print(f"  exa {status} for {co['short_name']}: {str(payload)[:150]}")
                    continue
                for r in payload.get("results") or []:
                    url = r.get("url") or ""
                    if not r.get("text") or "career" in url or "/jobs" in url:
                        continue
                    docs.setdefault(canonical_url(url), (co["company_id"], r))
        print(f"  {co['short_name']}: {len(docs)} unique documents so far")
    return docs


def extract_one(run_id, cid, r):
    conn = connect()
    ex = Extractor(RawStore(conn, "m1_news", run_id=run_id))
    try:
        extraction, checked, _ = ex.extract_document(r["text"], url=r["url"], title=r.get("title"),
                                                     provider_date=r.get("publishedDate"), company_id=cid)
        return cid, r, extraction, checked, None
    except ExtractionError as e:
        return cid, r, None, [], str(e)
    except Exception as e:   # network / database errors: record the document as failed, keep the run going
        return cid, r, None, [], f"{type(e).__name__}: {e}"
    finally:
        conn.close()


def in_window(event_date, publication_date):
    """The whole period of the date must fall inside the window: '2026' or '2025-11' pass, '2025' does not."""
    d = event_date or publication_date
    if not d:
        return False
    period_start = d + "-01-01"[len(d) - 4:] if len(d) < 10 else d
    return period_start >= WINDOW_START


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--companies", default="")
    ap.add_argument("--per-query", type=int, default=8)
    ap.add_argument("--workers", type=int, default=6)
    args = ap.parse_args()

    conn = connect()
    comps = [dict(r) for r in conn.execute("SELECT * FROM company_master WHERE in_module_1 = 1 ORDER BY short_name")]
    if args.companies:
        wanted = set(args.companies.split(","))
        comps = [c for c in comps if c["company_id"] in wanted]
    store = RawStore(conn, "m1_news", vars(args))

    print("Collecting documents (Exa)…")
    docs = collect(conn, store, comps, args.per_query)
    process_documents(conn, store, docs, comps, args.workers, "m1_news_review.xlsx")


def child_for_parent(subject, rec, comps, programme_alias):
    """A parent-company statement (e.g. Amazon's 10-Q) belongs to the Module 1 subsidiary only when the record
    itself names that subsidiary or one of its programmes (AWS, Trainium, ...). Deterministic, never guessed."""
    blob = " ".join(filter(None, [rec.title, rec.excerpt, rec.programme_or_product])).lower()
    for co in comps:
        if co.get("parent_company_id") != subject:
            continue
        names = [co["short_name"].lower(), co["official_name"].lower(), *(a for a, _ in programme_alias.get(co["company_id"], []))]
        if any(re.search(rf"\b{re.escape(n)}\b", blob) for n in names if len(n) > 2):
            return co["company_id"]
    return subject


def process_documents(conn, store, docs, comps, workers, review_file):
    """Extract, check and store documents. A document dict may carry:
    filing_date - a date stated by the regulator's filing index (SEC EDGAR), trusted like a printed date;
    source_url / full_text - the source to store when the extracted text is one part of a longer filing."""
    m1_ids = {c["company_id"] for c in comps}
    idx = CompanyIndex.load(conn)
    programme_alias = {}
    for pid, cid, name, aliases in conn.execute("SELECT programme_id, company_id, name, aliases FROM programme_master"):
        for a in [name, *json.loads(aliases or "[]")]:
            programme_alias.setdefault(cid, []).append((a.lower(), pid))
    print(f"Extracting {len(docs)} documents with {workers} workers…")

    accepted, review = 0, []
    today = utc_now()[:10]
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(extract_one, store.run_id, cid, r) for cid, r in docs.values()]
        for n, fut in enumerate(as_completed(futures), 1):
            cid, r, extraction, checked, error = fut.result()
            try:
                accepted += store_document(conn, store, cid, r, extraction, checked, error, comps, m1_ids, idx,
                                           programme_alias, review, today)
            except Exception:
                import traceback
                traceback.print_exc()
                review.append([cid, r["url"], "error", traceback.format_exc(limit=3), None, None, None, None, None])
            if n % 20 == 0:
                print(f"  {n}/{len(futures)} documents processed, {accepted} accepted records")

    finish_run(conn, store, accepted, review, review_file)


def store_document(conn, store, cid, r, extraction, checked, error, comps, m1_ids, idx, programme_alias, review, today):
    """Apply the publish rule to one extracted document and write accepted records. Returns the accepted count."""
    accepted = 0
    if error:
        review.append([cid, r["url"], "error", error, None, None, None, None, None])
        return 0
    doc_pub = parse_date(extraction.publication_date_text) if extraction.publication_date_text else None
    doc_pub = doc_pub or parse_date(r.get("filing_date"))
    pub = doc_pub or parse_date(r.get("publishedDate"))   # crawler date kept for display only
    src_url = r.get("source_url") or r["url"]
    for c in checked:
        rec = c.record
        subject = idx.resolve_name(rec.subject_company)
        if subject not in m1_ids:
            subject = child_for_parent(subject, rec, comps, programme_alias)
        issues = list(c.issues)
        if subject not in m1_ids:
            issues.append(f"subject '{rec.subject_company}' is not a Module 1 company")
        evt = c.event_date.value if c.event_date else None
        # The window must be provable from the document: an event date, or a publication date it prints.
        if not in_window(evt, doc_pub.value if doc_pub else None):
            issues.append("outside the 12-month window, or no date stated in the document")
        if c.status != "accepted" or issues != c.issues:
            review.append([cid, r["url"], c.status if c.status != "accepted" else "needs_review",
                           "; ".join(issues), rec.subject_company, rec.title, c.evidence_class, evt,
                           rec.excerpt])
            continue
        source_id = upsert_source(conn, url=src_url, source_type=source_type(src_url, subject, comps),
                                  source_name=host(src_url), title=r.get("title"),
                                  publication_date=pub.value if pub else None, event_date=evt,
                                  full_text=r.get("full_text") or r["text"])
        prog = next((pid for alias, pid in programme_alias.get(subject, [])
                     if rec.programme_or_product and alias in rec.programme_or_product.lower()), None)
        signal_id = stable_id("sig", source_id, rec.title.lower())
        with conn:
            conn.execute(
                """INSERT OR REPLACE INTO m1_signal (signal_id, company_id, programme_id, signal_type, title,
                       summary, technology_tags, counterparty_company_id, event_date, publication_date,
                       first_observed_date, evidence_class, extraction_method, extraction_model, run_id,
                       record_status)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT first_observed_date FROM m1_signal
                           WHERE signal_id = ?), ?), ?, 'llm', ?, ?, 'extracted')""",
                (signal_id, subject, prog, rec.category.value, rec.title, rec.summary,
                 json.dumps([t.value for t in rec.technologies]),
                 next((idx.resolve_name(cp.name) for cp in rec.counterparties if idx.resolve_name(cp.name)), None),
                 evt, pub.value if pub else None, signal_id, today, c.evidence_class,
                 "gemini", store.run_id))
            conn.execute("""INSERT OR REPLACE INTO record_source (record_type, record_id, source_id, source_role,
                            excerpt) VALUES ('m1_signal', ?, ?, 'primary', ?)""", (signal_id, source_id, rec.excerpt))
            for cp in rec.counterparties:
                if cp.role.value not in SUPPLIER_ROLES or not excerpt_in_source(cp.name, r["text"]):
                    continue
                sup_cid = idx.resolve_name(cp.name)
                sup_id = stable_id("sup", (sup_cid or cp.name).lower())
                conn.execute("""INSERT OR IGNORE INTO supplier_partner_master (supplier_id, company_id, name,
                                supplier_category) VALUES (?, ?, ?, ?)""",
                             (sup_id, sup_cid, cp.name, SUPPLIER_ROLES[cp.role.value]))
                rel_id = stable_id("rel", subject, sup_id, signal_id)
                conn.execute(
                    """INSERT OR REPLACE INTO company_relationship (relationship_id, company_id, supplier_id,
                           programme_id, relationship_type, technology_tags, commercial_stage, evidence_class,
                           event_date, publication_date, first_observed_date, summary, run_id)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (rel_id, subject, sup_id, prog, RELATIONSHIP_FOR_ROLE[cp.role.value],
                     json.dumps([t.value for t in rec.technologies]), rec.commercial_stage.value,
                     c.evidence_class, evt, pub.value if pub else None, today, rec.summary, store.run_id))
                conn.execute("""INSERT OR REPLACE INTO record_source (record_type, record_id, source_id,
                                source_role, excerpt) VALUES ('relationship', ?, ?, 'primary', ?)""",
                             (rel_id, source_id, rec.excerpt))
        accepted += 1
    return accepted


def finish_run(conn, store, accepted, review, review_file):
    merged = consolidate_signals(conn)
    print(f"Consolidated {merged} duplicate reports into existing signals (kept as corroborating sources)")
    store.finish(records_out=accepted)
    wb = Workbook()
    ws = wb.active
    ws.title = "Not shown in app"
    ws.append(["query_company", "url", "status", "issues", "subject_company", "title", "evidence_class",
               "event_date", "excerpt"])
    for row in review:
        ws.append(row)
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    wb.save(REVIEW_DIR / review_file)
    print(f"Done: {accepted} accepted records written; {len(review)} held back "
          f"(see data/review/{review_file}). Exa/Gemini calls live={store.live_calls}")


def consolidate_signals(conn):
    """Merge the same development reported by several documents into one signal (deterministic).

    Same company + category + event date (or both undated) and title similarity >= 0.6 -> keep the
    earliest-published record as primary, attach the other documents as corroborating sources.
    """
    from difflib import SequenceMatcher

    rows = [dict(r) for r in conn.execute(
        """SELECT signal_id, company_id, signal_type, event_date, publication_date, title FROM m1_signal
           ORDER BY COALESCE(publication_date, '9999'), signal_id""")]
    merged = 0
    kept = []
    for r in rows:
        twin = next((k for k in kept if k["company_id"] == r["company_id"] and k["signal_type"] == r["signal_type"]
                     and k["event_date"] == r["event_date"]
                     and SequenceMatcher(None, k["title"].lower(), r["title"].lower()).ratio() >= 0.6), None)
        if not twin:
            kept.append(r)
            continue
        with conn:
            conn.execute("""INSERT OR IGNORE INTO record_source (record_type, record_id, source_id, source_role, excerpt)
                            SELECT 'm1_signal', ?, source_id, 'corroborating', excerpt FROM record_source
                            WHERE record_type = 'm1_signal' AND record_id = ?""", (twin["signal_id"], r["signal_id"]))
            conn.execute("DELETE FROM record_source WHERE record_type = 'm1_signal' AND record_id = ?", (r["signal_id"],))
            conn.execute("DELETE FROM m1_signal WHERE signal_id = ?", (r["signal_id"],))
        merged += 1
    return merged


def host(url):
    from urllib.parse import urlsplit
    h = (urlsplit(url).hostname or "").lower()
    return h[4:] if h.startswith("www.") else h


def source_type(url, subject, comps):
    h = host(url)
    if h == "sec.gov" or h.endswith(".sec.gov"):
        return "regulatory_filing"
    if any(h.endswith(d) for d in TRADE_PRESS):
        return "industry_publication"
    own = next((c for c in comps if c["company_id"] == subject), None)
    if own and any(h == d or h.endswith("." + d) for d in [own["primary_domain"], *json.loads(own["alt_domains"] or "[]")]):
        return "investor_relations" if h.startswith(("investor", "ir.")) else "company_newsroom"
    return "partner_announcement"


if __name__ == "__main__":
    main()
