"""Check every company domain resolves and lands on the same organisation, then export a review workbook.

Usage:
    python scripts/validate_company_master.py

Writes results to company_master (domain_status, domain_final_url, domain_checked_at, master_status)
and to data/review/company_master_review.xlsx for sign-off.
master_status becomes 'validated' only when the primary domain passes and needs_verification is empty;
'signed_off' is set by a person after review, never by this script.
"""
import json
import socket
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import requests
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.utils import get_column_letter

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from chiplet.db import REVIEW_DIR, connect

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                         "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"}
PASSING = {"ok", "redirect_same_org", "reachable_blocked"}


def registrable(host):
    """Crude eTLD+1: good enough for the hosts in this master list (no multi-part public suffixes)."""
    parts = host.lower().strip(".").split(".")
    return ".".join(parts[-2:])


def check_domain(domain, org_domains):
    result = {"domain": domain, "dns": None, "http_status": None, "final_url": None, "status": "failed", "error": None}
    try:
        socket.getaddrinfo(domain, 443)
        result["dns"] = "ok"
    except socket.gaierror as e:
        result["dns"] = "failed"
        result["error"] = f"DNS: {e}"
        return result

    try:
        resp = requests.get(f"https://{domain}", headers=HEADERS, timeout=20, allow_redirects=True)
    except requests.RequestException as e:
        result["error"] = f"HTTP: {type(e).__name__}: {e}"[:300]
        return result

    final_host = urlparse(resp.url).hostname or ""
    result["http_status"] = resp.status_code
    result["final_url"] = resp.url
    same_org = registrable(final_host) in {registrable(d) for d in org_domains}

    if resp.status_code in (401, 403, 429) or (resp.status_code >= 400 and same_org):
        result["status"] = "reachable_blocked"   # host answers but refuses automated requests
    elif resp.status_code >= 400:
        result["status"] = "failed"
    elif final_host == domain or final_host.endswith("." + domain) or domain.endswith("." + final_host):
        result["status"] = "ok"
    elif same_org:
        result["status"] = "redirect_same_org"
    else:
        result["status"] = "redirect_other"
    return result


def main():
    conn = connect()
    companies = [dict(r) for r in conn.execute("SELECT * FROM company_master ORDER BY in_module_2, company_id")]
    if not companies:
        sys.exit("company_master is empty — run scripts/init_db.py first")

    jobs = []
    for c in companies:
        org = [c["primary_domain"], *json.loads(c["alt_domains"] or "[]")]
        for d in org:
            jobs.append((c["company_id"], d, d == c["primary_domain"], org))

    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(lambda j: (j, check_domain(j[1], j[3])), jobs))

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    by_company = {}
    for (company_id, _, is_primary, _), res in results:
        res["is_primary"] = is_primary
        by_company.setdefault(company_id, []).append(res)

    with conn:
        for c in companies:
            primary = next(r for r in by_company[c["company_id"]] if r["is_primary"])
            open_items = json.loads(c["needs_verification"] or "[]")
            status = c["master_status"]
            if status != "signed_off":
                status = "validated" if primary["status"] in PASSING and not open_items else "draft"
            conn.execute(
                """UPDATE company_master SET domain_status = ?, domain_final_url = ?, domain_checked_at = ?,
                       master_status = ?, updated_at = datetime('now') WHERE company_id = ?""",
                (primary["status"], primary["final_url"], now, status, c["company_id"]),
            )
            c.update(domain_status=primary["status"], domain_final_url=primary["final_url"],
                     domain_checked_at=now, master_status=status)

    path = write_review(conn, companies, by_company)

    print(f"{'company':<26}{'primary domain':<28}{'status':<20}final url")
    for c in companies:
        print(f"{c['company_id']:<26}{c['primary_domain']:<28}{c['domain_status']:<20}{c['domain_final_url'] or ''}")
    alt_issues = [(cid, r) for cid, rs in by_company.items() for r in rs
                  if not r["is_primary"] and r["status"] not in PASSING]
    for cid, r in alt_issues:
        print(f"  alt domain issue: {cid} {r['domain']} -> {r['status']} {r['error'] or r['final_url']}")
    summary = {}
    for c in companies:
        summary[c["master_status"]] = summary.get(c["master_status"], 0) + 1
    print(f"master_status: {summary}")
    print(f"Review workbook: {path}")


def write_review(conn, companies, by_company):
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    wb = Workbook()
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill("solid", fgColor="0068B5")
    bad_fill = PatternFill("solid", fgColor="FDE2E1")

    def sheet(ws, headers, rows, flag_col=None, flag_ok=None):
        ws.append(headers)
        for cell in ws[1]:
            cell.font, cell.fill = header_font, header_fill
        for row in rows:
            ws.append(row)
            if flag_col is not None and row[flag_col] not in flag_ok:
                for cell in ws[ws.max_row]:
                    cell.fill = bad_fill
        for i, h in enumerate(headers, start=1):
            width = max([len(str(h))] + [len(str(r[i - 1] or "")) for r in rows])
            ws.column_dimensions[get_column_letter(i)].width = min(max(width + 2, 10), 60)
        ws.freeze_panes = "B2"

    def plain(value):
        if value and value.startswith("["):
            return ", ".join(json.loads(value))
        return value

    company_cols = ["company_id", "official_name", "short_name", "entity_type", "primary_domain", "alt_domains",
                    "hq_country", "hq_city", "linkedin_url", "linkedin_verified", "parent_company_id",
                    "business_units", "industry", "research_roles", "value_chain_role",
                    "intel_relationship_status", "in_module_1", "in_module_2", "matching_notes",
                    "needs_verification", "domain_status", "domain_final_url", "domain_checked_at", "master_status"]
    ws = wb.active
    ws.title = "Company master"
    sheet(ws, company_cols + ["reviewer_ok (Y/N)", "reviewer_comment"],
          [[plain(c[k]) if isinstance(c[k], str) else c[k] for k in company_cols] + [None, None] for c in companies],
          flag_col=company_cols.index("domain_status"), flag_ok=PASSING)

    domain_rows = [[cid, r["domain"], "primary" if r["is_primary"] else "alt", r["dns"], r["http_status"],
                    r["final_url"], r["status"], r["error"]]
                   for cid, rs in by_company.items() for r in rs]
    sheet(wb.create_sheet("Domain checks"),
          ["company_id", "domain", "kind", "dns", "http_status", "final_url", "status", "error"],
          domain_rows, flag_col=6, flag_ok=PASSING)

    programmes = conn.execute(
        """SELECT p.programme_id, c.short_name, p.name, p.programme_type, p.technology_tags, p.architecture,
                  p.competes_with_intel, p.aliases, p.notes
           FROM programme_master p JOIN company_master c USING (company_id) ORDER BY c.short_name, p.name""")
    sheet(wb.create_sheet("Programme master"),
          ["programme_id", "company", "name", "programme_type", "technology_tags", "architecture",
           "competes_with_intel", "aliases", "notes", "reviewer_ok (Y/N)", "reviewer_comment"],
          [[plain(v) if isinstance(v, str) else v for v in row] + [None, None] for row in programmes])

    aliases = conn.execute("SELECT company_id, alias FROM company_alias ORDER BY company_id, alias")
    sheet(wb.create_sheet("Aliases"), ["company_id", "alias"], [list(r) for r in aliases])

    path = REVIEW_DIR / "company_master_review.xlsx"
    wb.save(path)
    return path


if __name__ == "__main__":
    main()
