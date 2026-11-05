"""Module 2 competitive event pipeline (M2-2 discovery + M2-3 extraction/classification).

Free official sources only (Exa credits are exhausted):
  1. Company newsroom / investor-relations sitemaps -> press releases whose URL slug names in-scope topics.
  2. SEC EDGAR filings in the window (10-K, 10-Q, 20-F, earnings 8-K exhibits, 6-K exhibits), read in full,
     silicon-relevant passages only.
Same Gemini extraction and deterministic checks as Module 1. A record becomes an m2_competitive_event only if
its excerpt is verbatim in the source, the subject is a tracked competitor, the category is one of the six
Module 2 event types, and the document states a date fully inside the window. Everything else goes to
data/review/m2_events_review.xlsx.

Usage:
    python scripts/m2_events_pipeline.py [--companies cmp_broadcom,cmp_marvell,cmp_tsmc] [--per-company 60]
"""
import argparse
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from openpyxl import Workbook

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import m1_deep_dive as dd
from m1_news_pipeline import extract_one, host, in_window

from chiplet.db import REVIEW_DIR, connect
from chiplet.extract.normalize import CompanyIndex, canonical_url, parse_date, stable_id
from chiplet.extract.store import upsert_source
from chiplet.sources.providers import BROWSER_UA
from chiplet.sources.store import RawStore, utc_now

PILOT = "cmp_broadcom,cmp_marvell,cmp_tsmc"
# The extractor may name a Module 1 category for a competitor development; these map one-to-one onto the
# Module 2 types (the sixth M2 type covers "strategic investment, capacity expansion or other material
# development"). Financial results, leadership, patents and hiring stay out: they are not M2 event types.
M1_TO_M2 = {"investment_ma_financing": "strategic_investment_capacity",
            "manufacturing_capacity": "strategic_investment_capacity",
            "programme_milestone": "product_architecture"}
SAMSUNG_FOUNDRY = re.compile(r"foundry|\bSF\d|\bGAA\b|gate-all-around|I-Cube|X-Cube|SAINT|\bSAFE\b", re.I)
M2_TYPES = {"design_win_customer", "product_architecture", "foundry_process_manufacturing",
            "chiplet_advanced_packaging", "partnership_ecosystem", "strategic_investment_capacity"}

# Official sitemaps, the path that marks a press release / official article, and whether <lastmod> tracks
# publication (True) or a site-wide refresh (False, so it cannot be used to pre-filter by date).
SITEMAPS = {
    "cmp_nvidia": ("https://nvidianews.nvidia.com/sitemap.xml", r"/news/", True),
    "cmp_amd": ("https://ir.amd.com/sitemap.xml", r"/press-releases/detail/", True),
    "cmp_marvell": ("https://investor.marvell.com/sitemap.xml", r"/press-releases/detail/", True),
    "cmp_arm": ("https://newsroom.arm.com/sitemap.xml", r"/(news|blog)/", True),
    "cmp_samsung_foundry": ("https://semiconductor.samsung.com/sitemap.xml", r"/news-events/.*foundry|foundry.*/news", False),
}
# Official newsroom RSS feeds that page back through the window (WordPress ?paged=N).
FEEDS = {"cmp_samsung_foundry": ("https://news.samsung.com/global/feed?paged={page}", 11,
                                 r"foundry|SF\d|GAA|2nm|3nm|packag|HBM|chip|semiconductor|wafer|fab\b|custom|\bAI\b")}
# Companies whose own newsroom renders client-side: their official press releases as distributed on the wire.
WIRES = {"cmp_broadcom": "https://www.prnewswire.com/news/broadcom-inc./?page={page}&pagesize=100"}
TOPIC = re.compile(
    r"custom|asic|xpu|accelerat|chiplet|packag|cowos|soic|foundry|[0-9]nm|a1[46]\b|wafer|fab\b|hbm|ucie|nvlink|fusion|"
    r"silicon|chip|design-win|partner|collaborat|alliance|tomahawk|jericho|thor|co-packaged|cpo|optic|interconnect|"
    r"instinct|mi[3-5]\d\d|helios|rubin|blackwell|vera|grace|neoverse|compute-subsystem|css|cobalt|axion|graviton|"
    r"trainium|tpu|maia|mtia|capacity|invest|acqui|data-?center|ai-infrastructure|gigawatt|rack|electro-optic|cxl|"
    r"structera|ethernet|gaa|sf[0-9]|i-cube|x-cube", re.I)
NOISE = re.compile(r"dividend|conference-call|to-report|to-present|webcast|financial-results|fiscal-.*results|"
                   r"quarterly-results|award|recogni[sz]ed|scholarship|volunteer|sustainab|contacts", re.I)

dd.TICKERS.update({"cmp_broadcom": "AVGO", "cmp_marvell": "MRVL", "cmp_tsmc": "TSM", "cmp_amd": "AMD",
                   "cmp_nvidia": "NVDA", "cmp_arm": "ARM"})
dd.COMPANY_TERMS.update({
    "cmp_broadcom": r"XPUs?|custom accelerators?|Tomahawk|Jericho|Thor|co-packaged|CPO|AI semiconductor|hyperscale customers?",
    "cmp_marvell": r"XPUs?|custom (silicon|accelerators?|compute)|electro-optic|CXL|Structera|data cent(er|re)s?|design wins?",
    "cmp_tsmc": r"CoWoS|SoIC|InFO|N2|N3|A16|A14|nanometer|advanced packaging|capacity|fabs?|Arizona|Kumamoto|Dresden|capital expenditures?",
    "cmp_amd": r"Instinct|MI[3-5]\d\d|EPYC|Helios|3D V-Cache|chiplets?|data cent(er|re)s?|custom",
    "cmp_nvidia": r"NVLink|Fusion|Blackwell|Rubin|Vera|Grace|multi-die|chiplets?|custom|data cent(er|re)s?",
    "cmp_arm": r"Neoverse|Compute Subsystems?|CSS|Chiplet System Architecture|UCIe|Total Design|data cent(er|re)s?",
})


def sitemap_entries(store, cid, url, depth=0):
    def call():
        try:
            r = requests.get(url, headers={"User-Agent": BROWSER_UA}, timeout=60)
        except requests.RequestException as e:
            return 599, {"error": str(e)}
        return r.status_code, {"text": r.text if r.status_code == 200 else r.text[:500]}
    status, payload, _ = store.fetch("web", "sitemap", {"url": url}, cid, call)
    if status != 200:
        return []
    text = payload["text"]
    if "<sitemapindex" in text and depth < 2:
        out = []
        for loc in re.findall(r"<loc>\s*([^<]+?)\s*</loc>", text):
            out += sitemap_entries(store, cid, loc.strip(), depth + 1)
        return out
    return re.findall(r"<url>\s*<loc>\s*([^<]+?)\s*</loc>(?:\s*<lastmod>\s*([^<]+?)\s*</lastmod>)?", text)


def page_text(store, cid, url):
    def call():
        try:
            r = requests.get(url, headers={"User-Agent": BROWSER_UA}, timeout=60)
        except requests.RequestException as e:
            return 599, {"error": str(e)}
        if r.status_code != 200:
            return r.status_code, {"body": r.text[:300]}
        soup = BeautifulSoup(r.content, "lxml")
        for tag in soup(["script", "style", "nav", "header", "footer", "aside", "form", "noscript"]):
            tag.decompose()
        root = soup.find("article") or soup.find("main") or soup.body or soup
        for tag in root.find_all(dd.BLOCK_TAGS):
            tag.insert_after("\n")
        lines = [re.sub(r"\s+", " ", ln).strip() for ln in root.get_text("").split("\n")]
        title = soup.title.get_text(strip=True) if soup.title else None
        return 200, {"title": title, "text": "\n".join(ln for ln in lines if ln)[:60_000]}
    return store.fetch("web", "page_text", {"url": url}, cid, call)


def wire_entries(store, cid, template, pages=4):
    urls = []
    for page in range(1, pages + 1):
        status, payload, _ = page_html(store, cid, template.format(page=page))
        if status != 200:
            break
        found = re.findall(r'href="(/news-releases/[a-z0-9-]+\.html)"', payload["html"])
        if not found:
            break
        urls += [f"https://www.prnewswire.com{u}" for u in found if u not in urls]
    return [(u, "") for u in dict.fromkeys(urls)]


def page_html(store, cid, url):
    def call():
        try:
            r = requests.get(url, headers={"User-Agent": BROWSER_UA}, timeout=60)
        except requests.RequestException as e:
            return 599, {"error": str(e)}
        return r.status_code, {"html": r.text if r.status_code == 200 else r.text[:300]}
    return store.fetch("web", "listing_html", {"url": url}, cid, call)


def feed_items(store, cid, template, pages, title_pattern):
    """Items of an official newsroom RSS feed: the publisher's own title, publish date and full article text."""
    out = {}
    for page in range(1, pages + 1):
        status, payload, _ = page_html(store, cid, template.format(page=page))
        if status != 200:
            break
        for item in re.findall(r"<item>(.*?)</item>", payload["html"], re.S):
            link = re.search(r"<link>\s*([^<]+?)\s*</link>", item)
            title = re.search(r"<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>", item, re.S)
            pub = re.search(r"<pubDate>([^<]+)</pubDate>", item)
            body = re.search(r"<content:encoded><!\[CDATA\[(.*?)\]\]></content:encoded>", item, re.S)
            if not (link and title and pub and body) or not re.search(title_pattern, title.group(1), re.I):
                continue
            d = parse_date(pub.group(1))
            if not d or d.value < dd.WINDOW_START:
                continue
            soup = BeautifulSoup(body.group(1), "lxml")
            for tag in soup.find_all(dd.BLOCK_TAGS):
                tag.insert_after("\n")
            text = "\n".join(ln for ln in (re.sub(r"\s+", " ", x).strip() for x in soup.get_text("").split("\n")) if ln)
            out[link.group(1)] = {"url": link.group(1), "title": title.group(1).strip(), "text": f"{title.group(1).strip()}\n{text}",
                                  "filing_date": d.value, "publishedDate": d.value}
    return list(out.values())


def collect_feeds(store, comps):
    """filing_date carries the feed's publish date: the publisher's own record, like an EDGAR filing date."""
    docs = {}
    for co in comps:
        cfg = FEEDS.get(co["company_id"])
        if not cfg:
            continue
        items = [i for i in feed_items(store, co["company_id"], *cfg) if len(i["text"]) >= 400]
        for i in items:
            docs[canonical_url(i["url"])] = (co["company_id"], i)
        print(f"  {co['short_name']}: {len(items)} in-scope newsroom feed articles")
    return docs


def collect_newsroom(store, comps, per_company):
    docs = {}
    for co in comps:
        cfg = SITEMAPS.get(co["company_id"])
        if co["company_id"] in WIRES:
            cfg = (None, r"/news-releases/", False)
            entries = wire_entries(store, co["company_id"], WIRES[co["company_id"]])
        elif cfg:
            entries = sitemap_entries(store, co["company_id"], cfg[0])
        else:
            continue
        sitemap, path, lastmod_is_pub = cfg
        picked = []
        for url, lastmod in entries:
            slug = url.lower()
            if not re.search(path, slug) or NOISE.search(slug) or not TOPIC.search(slug):
                continue
            if lastmod_is_pub and lastmod and lastmod[:10] < dd.WINDOW_START:
                continue
            picked.append((lastmod or "", url))
        picked = [u for _, u in sorted(picked, reverse=True)[:per_company]]
        kept = 0
        for url in picked:
            status, payload, _ = page_text(store, co["company_id"], url)
            if status != 200 or len(payload.get("text", "")) < 400:
                continue
            docs[canonical_url(url)] = (co["company_id"], {"url": url, "title": payload.get("title"),
                                                           "text": payload["text"], "publishedDate": None})
            kept += 1
        print(f"  {co['short_name']}: {len(entries)} sitemap URLs -> {len(picked)} in-scope press releases -> {kept} fetched")
    return docs


def source_type(url, subject_domain):
    h = host(url)
    if h == "sec.gov" or h.endswith(".sec.gov"):
        return "regulatory_filing"
    if h.startswith(("investor", "ir.")):
        return "investor_relations"
    return "company_newsroom"


def process(conn, store, docs, comps, workers):
    in_scope = {c["company_id"]: c for c in comps}
    idx = CompanyIndex.load(conn)
    programme_alias = {}
    for pid, cid, name, aliases in conn.execute("SELECT programme_id, company_id, name, aliases FROM programme_master"):
        for a in [name, *json.loads(aliases or "[]")]:
            programme_alias.setdefault(cid, []).append((a.lower(), pid))
    accepted, review, today = 0, [], utc_now()[:10]
    print(f"Extracting {len(docs)} documents with {workers} workers…")
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(extract_one, store.run_id, cid, r) for cid, r in docs.values()]
        for n, fut in enumerate(as_completed(futures), 1):
            cid, r, extraction, checked, error = fut.result()
            try:
                if error:
                    review.append([cid, r["url"], "error", error, None, None, None, None, None])
                    continue
                doc_pub = parse_date(extraction.publication_date_text) if extraction.publication_date_text else None
                doc_pub = doc_pub or parse_date(r.get("filing_date"))
                src_url = r.get("source_url") or r["url"]
                for c in checked:
                    rec = c.record
                    # Period / relative event dates ("Q4", "fiscal quarter ended May 3, 2026", "through 2028") cannot
                    # be pinned to a date. The record is kept without an event date when the document's own date
                    # proves the window; nothing is invented.
                    c.issues = [i for i in c.issues if not i.startswith("event date not parseable")]
                    subject = idx.resolve_name(rec.subject_company)
                    # Samsung Foundry is a business unit of Samsung Electronics: a Samsung record counts for it only
                    # when the record itself is about foundry work.
                    blob = " ".join(filter(None, [rec.title, rec.excerpt]))
                    if (subject not in in_scope and "cmp_samsung_foundry" in in_scope
                            and re.search(r"samsung", rec.subject_company or "", re.I) and SAMSUNG_FOUNDRY.search(blob)):
                        subject = "cmp_samsung_foundry"
                    category = M1_TO_M2.get(rec.category.value, rec.category.value)
                    issues = list(c.issues)
                    if subject not in in_scope:
                        issues.append(f"subject '{rec.subject_company}' is not a tracked competitor")
                    if category not in M2_TYPES:
                        issues.append(f"'{rec.category.value}' is not a Module 2 event type")
                    evt = c.event_date.value if c.event_date else None
                    if not in_window(evt, doc_pub.value if doc_pub else None):
                        issues.append("outside the 12-month window, or no date stated in the document")
                    if c.status != "accepted" or issues != c.issues:
                        review.append([cid, r["url"], c.status if c.status != "accepted" else "needs_review",
                                       "; ".join(issues), rec.subject_company, rec.title, c.evidence_class, evt, rec.excerpt])
                        continue
                    source_id = upsert_source(conn, url=src_url, source_type=source_type(src_url, None),
                                              source_name=host(src_url), title=r.get("title"),
                                              publication_date=doc_pub.value if doc_pub else None, event_date=evt,
                                              full_text=r.get("full_text") or r["text"])
                    prog = next((pid for alias, pid in programme_alias.get(subject, [])
                                 if rec.programme_or_product and alias in rec.programme_or_product.lower()), None)
                    cp = next((x for x in rec.counterparties if x.role.value in ("customer", "design_partner", "ecosystem_partner",
                                                                                "foundry", "packaging_partner", "ip_provider")), None)
                    event_id = stable_id("evt", source_id, rec.title.lower())
                    with conn:
                        conn.execute(
                            """INSERT OR REPLACE INTO m2_competitive_event (event_id, company_id, programme_id, event_title,
                                   event_type, event_date, publication_date, first_observed_date, counterparty_company_id,
                                   counterparty_name, product_or_programme, architecture_or_node, packaging_or_interconnect,
                                   value_chain_role, commercial_stage, evidence_class, summary, extraction_method,
                                   extraction_model, run_id, record_status)
                               VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT first_observed_date FROM m2_competitive_event
                                       WHERE event_id = ?), ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, 'llm', 'gemini', ?, 'extracted')""",
                            (event_id, subject, prog, rec.title, category, evt,
                             doc_pub.value if doc_pub else None, event_id, today,
                             idx.resolve_name(cp.name) if cp else None, cp.name if cp else None, rec.programme_or_product,
                             rec.architecture_or_node, rec.packaging_or_interconnect, in_scope[subject]["value_chain_role"],
                             rec.commercial_stage.value, c.evidence_class, rec.summary, store.run_id))
                        conn.execute("""INSERT OR REPLACE INTO record_source (record_type, record_id, source_id, source_role,
                                        excerpt) VALUES ('m2_event', ?, ?, 'primary', ?)""", (event_id, source_id, rec.excerpt))
                    accepted += 1
            except Exception:
                import traceback
                review.append([cid, r["url"], "error", traceback.format_exc(limit=3), None, None, None, None, None])
            if n % 20 == 0:
                print(f"  {n}/{len(futures)} documents processed, {accepted} accepted events")
    merged = consolidate(conn)
    print(f"Consolidated {merged} duplicate reports into existing events (kept as corroborating sources)")
    store.finish(records_out=accepted)
    wb = Workbook()
    ws = wb.active
    ws.title = "Not shown in app"
    ws.append(["query_company", "url", "status", "issues", "subject_company", "title", "evidence_class", "event_date", "excerpt"])
    for row in review:
        ws.append(row)
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    wb.save(REVIEW_DIR / "m2_events_review.xlsx")
    print(f"Done: {accepted} accepted events written; {len(review)} held back (see data/review/m2_events_review.xlsx). "
          f"Live calls={store.live_calls}")


def consolidate(conn):
    """Same development from several documents -> one event; other documents kept as corroborating sources."""
    from difflib import SequenceMatcher
    rows = [dict(r) for r in conn.execute(
        """SELECT event_id, company_id, event_type, event_date, event_title FROM m2_competitive_event
           ORDER BY COALESCE(publication_date, '9999'), event_id""")]
    kept, merged = [], 0
    for r in rows:
        twin = next((k for k in kept if k["company_id"] == r["company_id"] and k["event_type"] == r["event_type"]
                     and k["event_date"] == r["event_date"]
                     and SequenceMatcher(None, k["event_title"].lower(), r["event_title"].lower()).ratio() >= 0.6), None)
        if not twin:
            kept.append(r)
            continue
        with conn:
            conn.execute("""INSERT OR IGNORE INTO record_source (record_type, record_id, source_id, source_role, excerpt)
                            SELECT 'm2_event', ?, source_id, 'corroborating', excerpt FROM record_source
                            WHERE record_type = 'm2_event' AND record_id = ?""", (twin["event_id"], r["event_id"]))
            conn.execute("DELETE FROM record_source WHERE record_type = 'm2_event' AND record_id = ?", (r["event_id"],))
            conn.execute("DELETE FROM m2_competitive_event WHERE event_id = ?", (r["event_id"],))
        merged += 1
    return merged


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--companies", default=PILOT)
    ap.add_argument("--per-company", type=int, default=60)
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--no-sec", action="store_true")
    ap.add_argument("--no-newsroom", action="store_true")
    ap.add_argument("--dry-run", action="store_true", help="collect and count documents, no extraction")
    args = ap.parse_args()

    conn = connect()
    wanted = set(args.companies.split(","))
    comps = [dict(r) for r in conn.execute("SELECT * FROM company_master WHERE in_module_2 = 1") if r["company_id"] in wanted]
    store = RawStore(conn, "m2_events", vars(args))
    docs = {}
    if not args.no_newsroom:
        print("Collecting official press releases (sitemaps)…")
        docs.update(collect_newsroom(store, comps, args.per_company))
        docs.update(collect_feeds(store, comps))
    if not args.no_sec:
        print("Collecting SEC filings…")
        docs.update(dd.collect_sec(store, [c for c in comps if c["company_id"] in dd.TICKERS], ))
    print(f"{len(docs)} documents / passages collected")
    if args.dry_run:
        store.finish(notes="dry run")
        return
    process(conn, store, docs, comps, args.workers)


if __name__ == "__main__":
    main()
