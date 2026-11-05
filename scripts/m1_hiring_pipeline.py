"""Module 1 hiring pipeline (M1-3).

PredictLeads job openings (12-month window, server-side date filter) and the official amazon.jobs search for
AWS silicon roles -> deterministic pre-filter -> Gemini role classification -> only postings that are
silicon-relevant AND whose excerpt is found verbatim in the posting are stored in hiring_posting.

Posting date (provider/employer) and first/last observed dates are kept separate; nothing is inferred.

Usage:
    python scripts/m1_hiring_pipeline.py [--workers 8]
"""
import argparse
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path

from openpyxl import Workbook

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from chiplet.db import REVIEW_DIR, connect
from chiplet.extract.llm import ExtractionError, Extractor
from chiplet.extract.normalize import job_dedup_key, job_may_be_silicon, parse_date, stable_id
from chiplet.extract.store import upsert_source
from chiplet.sources.providers import BROWSER_UA, PredictLeads, TheirStack, _json_call
from chiplet.sources.store import RawStore, utc_now

WINDOW_START = "2025-11-01"
PREDICTLEADS_TARGETS = [("cmp_cerebras", "cerebras.ai", "Cerebras Systems"), ("cmp_tesla", "tesla.com", "Tesla"),
                        ("cmp_tenstorrent", "tenstorrent.com", "Tenstorrent")]
MAX_PAGES = 20
# TheirStack (1 credit per job): a recent sample per company where PredictLeads was not used. (pages, page size)
# Meta's postings are listed under facebook.com. Page 0 of size 10 for Meta was the paid test call (cached).
THEIRSTACK_TARGETS = [("cmp_meta", "facebook.com", "Meta", 2, 10), ("cmp_microsoft", "microsoft.com", "Microsoft", 1, 20),
                      ("cmp_google", "google.com", "Google", 1, 20), ("cmp_apple", "apple.com", "Apple", 1, 20),
                      ("cmp_ibm", "ibm.com", "IBM", 1, 20), ("cmp_cisco", "cisco.com", "Cisco", 1, 20),
                      ("cmp_nokia", "nokia.com", "Nokia", 1, 20), ("cmp_samsung_electronics", "samsung.com", "Samsung Electronics", 1, 20)]
JOB_BOARDS = ("linkedin.com", "naukri.com", "indeed.", "glassdoor.", "recruitics.com", "ziprecruiter.", "monster.")


def predictleads_jobs(store, cid, domain):
    pl = PredictLeads(store)
    jobs = []
    for page in range(1, MAX_PAGES + 1):
        params = {"limit": 1000, "page": page, "first_seen_at_from": WINDOW_START}
        status, payload, _ = pl.dataset(cid, domain, "job_openings", params)
        if status != 200:
            print(f"  predictleads {domain} page {page}: HTTP {status}")
            break
        data = payload.get("data") or []
        raw_id = store._key("predictleads", f"job_openings:{domain}", params)
        for j in data:
            a = j["attributes"]
            loc = (a.get("location_data") or [{}])[0]
            jobs.append({
                "provider": "predictleads", "provider_job_id": j.get("id"), "raw_record_id": raw_id,
                "title": a.get("translated_title") or a.get("title") or "", "original_title": a.get("title") or "",
                "description": a.get("description") or "", "url": a.get("url"),
                "location": ", ".join(x for x in [loc.get("city"), loc.get("state"), loc.get("country")] if x) or a.get("location"),
                "posting_date": a.get("posted_at"), "first_seen": a.get("first_seen_at"),
                "last_seen": a.get("last_seen_at"), "status": a.get("status"),
                "contract": ", ".join(a.get("contract_types") or []) or None,
            })
        count = (payload.get("meta") or {}).get("count") or 0
        print(f"  {domain} page {page}: {len(data)} jobs (window total {count})")
        if len(data) < 1000 or page * 1000 >= count:
            break
    return jobs


def amazon_jobs(store, query="Annapurna Labs"):
    jobs, offset = [], 0
    while True:
        params = {"base_query": query, "result_limit": 100, "offset": offset, "sort": "recent"}
        call = _json_call("GET", "https://www.amazon.jobs/en/search.json", params=params,
                          headers={"User-Agent": BROWSER_UA})
        status, payload, _ = store.fetch("amazon_jobs", "search", params, "cmp_aws", call)
        if status != 200:
            print(f"  amazon.jobs HTTP {status}")
            break
        raw_id = store._key("amazon_jobs", "search", params)
        batch = payload.get("jobs") or []
        for j in batch:
            desc = "\n\n".join(x for x in [j.get("description"), j.get("basic_qualifications"),
                                            j.get("preferred_qualifications")] if x)
            jobs.append({
                "provider": "amazon_jobs", "provider_job_id": j.get("id_icims") or j.get("id"), "raw_record_id": raw_id,
                "title": j.get("title") or "", "original_title": j.get("title") or "", "description": desc,
                "url": "https://www.amazon.jobs" + (j.get("job_path") or ""), "location": j.get("normalized_location") or j.get("location"),
                "posting_date": j.get("posted_date"), "first_seen": None, "last_seen": None, "status": "open",
                "contract": j.get("job_schedule_type"), "department": j.get("team", {}).get("label") if isinstance(j.get("team"), dict) else None,
            })
        print(f"  amazon.jobs offset {offset}: {len(batch)} (hits {payload.get('hits')})")
        offset += 100
        if not batch or offset >= (payload.get("hits") or 0):
            break
    return jobs


def theirstack_jobs(store, cid, domain, pages, size):
    """Most recent silicon-titled postings since the window start. The same role copied to several job boards is
    kept once, preferring the employer's own career-site link."""
    ts = TheirStack(store)
    raw = []
    for page in range(pages):
        count = page == 0   # page 0 also reports the total (and reuses the cached test call for Meta)
        status, payload, _ = ts.jobs(cid, domain, WINDOW_START, limit=size, page=page, count=count)
        if status != 200:
            print(f"  theirstack {domain} page {page}: HTTP {status} {str(payload)[:150]}")
            break
        raw_id = store._key("theirstack", f"jobs:{domain}", TheirStack.body(domain, WINDOW_START, size, page, count))
        if count:
            print(f"  theirstack {domain}: {(payload.get('metadata') or {}).get('total_results')} matching postings in the window")
        raw += [(j, raw_id) for j in payload.get("data") or []]
        if len(payload.get("data") or []) < size:
            break
    best = {}
    for j, raw_id in raw:
        url = j.get("final_url") or j.get("url") or j.get("source_url") or ""
        key = (j.get("job_title") or "").strip().lower()
        on_board = any(b in url for b in JOB_BOARDS)
        if key in best and (on_board or not best[key][2]):
            continue
        best[key] = (j, raw_id, not on_board, url)
    jobs = []
    for j, raw_id, _, url in best.values():
        jobs.append({
            "provider": "theirstack", "provider_job_id": str(j.get("id")), "raw_record_id": raw_id,
            "title": j.get("job_title") or "", "original_title": j.get("job_title") or "", "description": j.get("description") or "",
            "url": url, "location": j.get("long_location") or j.get("location"), "posting_date": j.get("date_posted"),
            "first_seen": j.get("discovered_at"), "last_seen": None, "status": "closed" if j.get("closed_at") else "unknown",
            "contract": ", ".join(j.get("employment_statuses") or []) or None,
        })
    print(f"  theirstack {domain}: {len(raw)} returned, {len(jobs)} after removing job-board copies")
    return jobs


def classify(run_id, cid, company_name, job):
    conn = connect()
    ex = Extractor(RawStore(conn, "m1_hiring", run_id=run_id))
    try:
        result, verified, _ = ex.classify_job(title=job["title"], description=job["description"],
                                              location=job["location"], company_name=company_name, company_id=cid)
        return job, result, verified, None
    except ExtractionError as e:
        return job, None, False, str(e)
    finally:
        conn.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--theirstack-only", action="store_true",
                    help="collect only the TheirStack sample (earlier PredictLeads / amazon.jobs postings stay as they are)")
    args = ap.parse_args()
    conn = connect()
    store = RawStore(conn, "m1_hiring", vars(args))
    today = utc_now()[:10]
    recent = (datetime.now(timezone.utc) - timedelta(days=10)).strftime("%Y-%m-%d")

    targets = []
    if not args.theirstack_only:
        for cid, domain, name in PREDICTLEADS_TARGETS:
            targets += [(cid, name, j) for j in predictleads_jobs(store, cid, domain)]
        targets += [("cmp_aws", "Amazon Web Services (Annapurna Labs)", j) for j in amazon_jobs(store)]
    for cid, domain, name, pages, size in THEIRSTACK_TARGETS:
        targets += [(cid, name, j) for j in theirstack_jobs(store, cid, domain, pages, size)]

    candidates = [(cid, name, j) for cid, name, j in targets if job_may_be_silicon(j["title"], j["description"])]
    print(f"{len(targets)} postings collected, {len(candidates)} pass the silicon pre-filter; classifying…")

    stored, review = 0, []
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        results = pool.map(lambda t: (t[0],) + classify(store.run_id, t[0], t[1], t[2]), candidates)
        for cid, job, result, verified, error in results:
            if error or result is None:
                review.append([cid, job["title"], job["url"], "error", error])
                continue
            if not result.is_silicon_relevant:
                continue
            if not verified:
                review.append([cid, job["title"], job["url"], "excerpt not found in posting", result.excerpt])
                continue
            posted = parse_date(job["posting_date"])
            first = parse_date(job["first_seen"])
            last = parse_date(job["last_seen"])
            status = "closed" if job["status"] == "closed" else (
                "open" if job["provider"] == "amazon_jobs" or (last and last.value >= recent) else "unknown")
            source_id = upsert_source(conn, url=job["url"] or f"https://predictleads.com/job/{job['provider_job_id']}",
                                      source_type="career_page" if job["provider"] == "amazon_jobs" else "job_posting",
                                      source_name=job["provider"], title=job["original_title"],
                                      publication_date=posted.value if posted else None, excerpt=result.excerpt,
                                      full_text=job["description"], raw_record_id=job["raw_record_id"])
            with conn:
                conn.execute(
                    """INSERT OR REPLACE INTO hiring_posting (posting_id, company_id, provider, provider_job_id, dedup_key,
                           original_title, normalised_title, job_function, role_category, seniority, location,
                           department, description_excerpt, keywords, contract_type, posting_date, first_observed_date,
                           last_observed_date, posting_status, source_id, raw_record_id, run_id)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (stable_id("job", job["provider"], job["provider_job_id"]), cid, job["provider"],
                     job["provider_job_id"], job_dedup_key(cid, job["title"], job["location"], job["description"]),
                     job["original_title"], result.normalised_title, result.job_function, result.role_category.value,
                     result.seniority.value, job["location"], result.department or job.get("department"),
                     result.excerpt, json.dumps(result.programme_keywords), job["contract"],
                     posted.value if posted else None, first.value if first else today,
                     last.value if last else None, status, source_id, job["raw_record_id"], store.run_id))
            stored += 1

    store.finish(records_out=stored)
    wb = Workbook()
    ws = wb.active
    ws.append(["company_id", "title", "url", "reason", "detail"])
    for row in review:
        ws.append(row)
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    # A TheirStack-only run gets its own sheet so the earlier review is kept.
    wb.save(REVIEW_DIR / ("m1_hiring_review_theirstack.xlsx" if args.theirstack_only else "m1_hiring_review.xlsx"))
    print(f"Done: {stored} silicon postings stored; {len(review)} held back. calls live={store.live_calls}")


if __name__ == "__main__":
    main()
