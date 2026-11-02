"""Run the S5 extraction layer on stored S4 probe data and export results for review.

Usage:
    python scripts/run_extraction_sample.py [--docs 6] [--jobs 10]

Needs GEMINI_API_KEY in .env. Uses only stored raw records as input (Exa official-domain results and
PredictLeads Cerebras jobs); LLM responses are cached in raw_provider_record. Output:
data/review/extraction_sample.xlsx with every record's status (accepted / needs_review / rejected) and issues.
"""
import argparse
import json
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from chiplet.db import REVIEW_DIR, connect
from chiplet.extract.llm import ExtractionError, Extractor
from chiplet.extract.normalize import CompanyIndex, job_may_be_silicon, parse_date
from chiplet.sources.store import RawStore, env

WINDOW_START = "2025-11-01"


def exa_documents(conn, limit):
    docs = []
    for cid, params, payload in conn.execute(
            "SELECT company_id, request_params, response_json FROM raw_provider_record WHERE provider='exa'"):
        if not json.loads(params).get("includeDomains"):
            continue
        for r in json.loads(payload).get("results") or []:
            if "careers." in r["url"] or not r.get("text"):
                continue
            docs.append((cid, r))
    return docs[:limit]


def cerebras_jobs(conn, limit):
    row = conn.execute("""SELECT response_json FROM raw_provider_record WHERE provider='predictleads'
                          AND endpoint='job_openings:cerebras.ai' AND request_params='{"limit": 1000}'""").fetchone()
    jobs = [j for j in json.loads(row[0])["data"]
            if (j["attributes"].get("first_seen_at") or "") >= WINDOW_START
            and job_may_be_silicon(j["attributes"]["title"], j["attributes"].get("description"))]
    return jobs[:limit]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--docs", type=int, default=6)
    ap.add_argument("--jobs", type=int, default=10)
    args = ap.parse_args()
    if not env("GEMINI_API_KEY"):
        sys.exit("GEMINI_API_KEY is not set in .env — add a project API key to run extraction.")

    conn = connect()
    store = RawStore(conn, "s5_extraction_sample", vars(args))
    ex = Extractor(store)
    idx = CompanyIndex.load(conn)

    doc_rows = []
    for cid, r in exa_documents(conn, args.docs):
        try:
            extraction, checked, payload = ex.extract_document(
                r["text"], url=r["url"], title=r.get("title"), provider_date=r.get("publishedDate"), company_id=cid)
        except ExtractionError as e:
            doc_rows.append([cid, r["url"], "ERROR", str(e)] + [None] * 13)
            continue
        if not checked:
            doc_rows.append([cid, r["url"], "no records", f"relevant={extraction.relevant}"] + [None] * 13)
        for c in checked:
            rec = c.record
            doc_rows.append([
                cid, r["url"], c.status, "; ".join(c.issues), rec.subject_company,
                idx.resolve_name(rec.subject_company), rec.category.value, rec.title, rec.programme_or_product,
                ", ".join(t.value for t in rec.technologies),
                ", ".join(f"{cp.name} ({cp.role.value})" for cp in rec.counterparties),
                rec.attribution.value, rec.statement_status.value, c.evidence_class,
                c.event_date.value if c.event_date else None,
                (parse_date(extraction.publication_date_text).value
                 if extraction.publication_date_text and parse_date(extraction.publication_date_text) else None),
                rec.excerpt])

    job_rows = []
    for j in cerebras_jobs(conn, args.jobs):
        a = j["attributes"]
        loc = (a.get("location_data") or [{}])[0]
        try:
            result, verified, _ = ex.classify_job(title=a["title"], description=a.get("description"),
                                                  location=loc.get("city"), company_name="Cerebras Systems",
                                                  company_id="cmp_cerebras")
        except ExtractionError as e:
            job_rows.append([a["title"], "ERROR", str(e)] + [None] * 9)
            continue
        job_rows.append([a["title"], "accepted" if verified else "rejected", result.is_silicon_relevant,
                         result.role_category.value, result.normalised_title, result.seniority.value,
                         result.department, ", ".join(result.programme_keywords),
                         (a.get("posted_at") or "")[:10] or None, (a.get("first_seen_at") or "")[:10],
                         a.get("url"), result.excerpt])
    store.finish(records_out=len(doc_rows) + len(job_rows))

    wb = Workbook()
    for ws, headers, rows in [
        (wb.active, ["company_id", "url", "status", "issues", "subject_company", "matched_company_id", "category",
                     "title", "programme_or_product", "technologies", "counterparties", "attribution",
                     "statement_status", "evidence_class", "event_date", "publication_date", "excerpt"], doc_rows),
        (wb.create_sheet("Jobs"), ["original_title", "status", "is_silicon_relevant", "role_category",
                                   "normalised_title", "seniority", "department", "programme_keywords",
                                   "posted_at", "first_seen_at", "url", "excerpt"], job_rows),
    ]:
        if ws.title == "Sheet":
            ws.title = "Documents"
        ws.append(headers)
        for cell in ws[1]:
            cell.font, cell.fill = Font(bold=True, color="FFFFFF"), PatternFill("solid", fgColor="0068B5")
        for row in rows:
            ws.append(row)
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    path = REVIEW_DIR / "extraction_sample.xlsx"
    wb.save(path)

    statuses = {}
    for row in doc_rows:
        statuses[row[2]] = statuses.get(row[2], 0) + 1
    print(f"documents: {statuses}")
    print(f"jobs: {sum(1 for r in job_rows if r[2])} silicon-relevant of {len(job_rows)}")
    print(f"LLM calls live={store.live_calls} cached={store.cached_calls}")
    print(f"Saved {path}")


if __name__ == "__main__":
    main()
