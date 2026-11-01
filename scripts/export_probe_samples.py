"""Export sample records from stored S4 probe responses to data/review/source_probe_samples.xlsx.

Reads only raw_provider_record (no network calls), so it can be re-run freely.
"""
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.utils import get_column_letter

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from chiplet.db import REVIEW_DIR, connect

WINDOW_START = "2025-11-01"
SILICON_TITLE = re.compile(
    r"\b(asic|rtl|silicon|physical design|design verification|dv engineer|dft|design for test|packaging|"
    r"tape-?out|post-silicon|bring-?up|soc (design|verification|architect)|chip|fpga|analog|mixed-signal|"
    r"hardware architect|annapurna)\b", re.I)


def raw(conn, provider, endpoint_like="%", company_id=None):
    sql = "SELECT company_id, endpoint, request_params, response_json FROM raw_provider_record WHERE provider = ? AND endpoint LIKE ?"
    args = [provider, endpoint_like]
    if company_id:
        sql += " AND company_id = ?"
        args.append(company_id)
    return [(r[0], r[1], json.loads(r[2]), json.loads(r[3])) for r in conn.execute(sql, args)]


def first(data):
    data = (data or {}).get("data")
    return data[0] if isinstance(data, list) and data else data


def add_sheet(wb, title, headers, rows):
    ws = wb.create_sheet(title)
    ws.append(headers)
    for cell in ws[1]:
        cell.font, cell.fill = Font(bold=True, color="FFFFFF"), PatternFill("solid", fgColor="0068B5")
    for r in rows:
        ws.append([json.dumps(v) if isinstance(v, (list, dict)) else v for v in r])
    for i, h in enumerate(headers, start=1):
        width = max([len(str(h))] + [len(str(r[i - 1] or "")) for r in rows])
        ws.column_dimensions[get_column_letter(i)].width = max(10, min(width + 2, 70))
    ws.freeze_panes = "A2"


def main():
    conn = connect()
    wb = Workbook()
    wb.remove(wb.active)

    rows = []
    for cid, _, _, payload in raw(conn, "explorium", "firmographics/enrich"):
        f = first(payload) or {}
        techno = first(next((p for c, _, _, p in raw(conn, "explorium", "technographics/enrich", cid)), {})) or {}
        hier = first(next((p for c, _, _, p in raw(conn, "explorium", "company_hierarchies/enrich", cid)), {})) or {}
        rows.append([cid, f.get("name"), f.get("website"), f.get("city_name"), f.get("country_name"),
                     f.get("number_of_employees_range"), f.get("yearly_revenue_range"), f.get("linkedin_profile"),
                     f.get("linkedin_industry_category"), f.get("naics_description"), f.get("ticker"),
                     len(techno.get("full_tech_stack") or []), hier.get("parent_company_name"),
                     hier.get("ultimate_parent_name"), [s.get("name") for s in hier.get("subsidiaries") or []],
                     (f.get("business_description") or "")[:300]])
    add_sheet(wb, "Explorium", ["company_id", "name", "website", "city", "country", "employees", "revenue",
                                "linkedin", "linkedin_industry", "naics", "ticker", "tech_stack_size",
                                "parent", "ultimate_parent", "subsidiaries", "description"], rows)

    rows = []
    for cid, endpoint, params, payload in raw(conn, "predictleads", "job_openings:%"):
        if params.get("limit", 0) < 1000:
            continue
        for j in payload.get("data") or []:
            a = j["attributes"]
            title = a.get("translated_title") or a.get("title") or ""
            if not SILICON_TITLE.search(title) or (a.get("first_seen_at") or "") < WINDOW_START:
                continue
            loc = (a.get("location_data") or [{}])[0]
            rows.append([cid, endpoint.split(":", 1)[1], j.get("id"), title, a.get("normalized_title"),
                         a.get("seniority"), a.get("categories"), loc.get("city"), loc.get("country"),
                         (a.get("posted_at") or "")[:10], (a.get("first_seen_at") or "")[:10],
                         (a.get("last_seen_at") or "")[:10], a.get("status"), a.get("url")])
    add_sheet(wb, "PredictLeads silicon jobs", ["company_id", "domain", "job_id", "title", "normalized_title",
                                               "seniority", "categories", "city", "country", "posted_at",
                                               "first_seen_at", "last_seen_at", "status", "url"], rows)

    rows = []
    for cid, _, params, payload in raw(conn, "exa", "search"):
        scope = "official domains" if params.get("includeDomains") else "open web"
        for r in payload.get("results") or []:
            rows.append([cid, scope, (r.get("publishedDate") or "")[:10], r.get("title"),
                         urlparse(r["url"]).netloc, r["url"], (r.get("text") or "")[:400].replace("\n", " ")])
    add_sheet(wb, "Exa", ["company_id", "scope", "published", "title", "domain", "url", "text_excerpt"], rows)

    rows = []
    for cid, _, params, payload in raw(conn, "google_news", "rss_search"):
        for i in payload.get("items") or []:
            rows.append([cid, params.get("q"), i.get("pubDate"), i.get("title"), i.get("source"), i.get("link")])
    add_sheet(wb, "Google News", ["company_id", "query", "pubDate", "title", "publisher", "google_link"], rows)

    rows = []
    keep = {"10-K", "10-Q", "8-K", "20-F", "6-K", "S-1", "424B4"}
    for cid, _, params, payload in raw(conn, "sec_edgar", "submissions"):
        r = payload["filings"]["recent"]
        cik = str(int(params["cik"]))
        for form, date, acc, doc, desc in zip(r["form"], r["filingDate"], r["accessionNumber"],
                                              r["primaryDocument"], r["primaryDocDescription"]):
            if date >= WINDOW_START and form in keep:
                rows.append([cid, payload.get("name"), form, date, desc,
                             f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc.replace('-', '')}/{doc}"])
    add_sheet(wb, "SEC filings", ["company_id", "filer", "form", "filing_date", "description", "url"], rows)

    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    path = REVIEW_DIR / "source_probe_samples.xlsx"
    wb.save(path)
    for ws in wb.worksheets:
        print(f"  {ws.title:<28} {ws.max_row - 1} rows")
    print(f"Saved {path}")


if __name__ == "__main__":
    main()
