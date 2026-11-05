"""Module 1 deep source extraction for shortlisted companies (default: the brief's pilot set Cerebras, AWS, Tesla).

Goes beyond the screening run in m1_news_pipeline.py:
  1. SEC EDGAR filings in the window, read in full (10-K, 10-Q, IPO prospectus 424B4, earnings-release exhibits
     of 8-K item 2.02). Only silicon-relevant passages are sent for extraction, kept verbatim so every excerpt
     can be checked against the filing. The filing date comes from the EDGAR index.
  2. A wider Exa query set per company (roadmap, foundry, packaging, suppliers, customers, investment,
     leadership, capacity, and one query per known programme), on official + trusted trade-press domains.
Both feed the same extraction, checks and publish rule as the screening pipeline (process_documents).

Usage:
    python scripts/m1_deep_dive.py [--companies cmp_cerebras,cmp_aws,cmp_tesla] [--per-query 10] [--no-exa] [--no-sec]
"""
import argparse
import re
import sys
from pathlib import Path

import warnings

from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from m1_news_pipeline import EXA_START, EXTRA_OFFICIAL, PARTNER_NEWSROOMS, TRADE_PRESS, WINDOW_START, process_documents

from chiplet.db import connect
from chiplet.extract.normalize import canonical_url
from chiplet.sources.providers import Exa, SecEdgar, _json_call
from chiplet.sources.store import RawStore

import json
import requests

TICKERS = {"cmp_cerebras": "CBRS", "cmp_aws": "AMZN", "cmp_tesla": "TSLA"}
CORE_TERMS = (r"chips?|silicon|semiconductors?|wafers?|foundry|foundries|TSMC|HBM\d?|high[- ]bandwidth memory|"
              r"accelerators?|ASICs?|GPUs?|advanced packaging|CoWoS|chiplets?|process nodes?|[23] ?nm|tape[- ]?outs?")
COMPANY_TERMS = {
    # Cerebras is a chip company: supplier, manufacturing and customer passages are all in scope.
    "cmp_cerebras": r"WSE-?\d?|wafer[- ]scale|CS-[234]|suppliers?|sole[- ]source|single[- ]source|manufactur\w*|G42|"
                    r"MBZUAI|OpenAI|customer concentration|inference|data cent(er|re)s?",
    "cmp_aws": r"Trainium\d?|Inferentia\d?|Graviton\d?|Nitro|Annapurna|custom chips?|AI infrastructure|"
               r"data cent(er|re)s?",
    "cmp_tesla": r"AI[456]|Dojo\d?|FSD computer|inference (chips?|compute)|training compute|Cortex|Terafab|"
                 r"AI chips?|custom chips?",
}
CHUNK_CHARS = 30_000
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)


def deep_queries(name, programmes):
    qs = [
        f"{name} {' '.join(programmes[:4])} chip launch announcement",
        f"{name} next-generation chip roadmap tape-out production timeline",
        f"{name} chip foundry TSMC Samsung Intel process node manufacturing",
        f"{name} advanced packaging chiplet CoWoS HBM memory supply",
        f"{name} silicon supplier partnership agreement",
        f"{name} chip design team engineering expansion new site",
        f"{name} investment funding acquisition semiconductor",
        f"{name} customer agreement AI compute capacity deal",
        f"{name} data center AI infrastructure build-out capacity",
        f"{name} executive appointment chip hardware leadership",
    ]
    qs += [f"{name} {p} specifications performance availability" for p in programmes[:6]]
    return qs


def collect_exa(conn, store, comps, per_query):
    exa = Exa(store)
    docs = {}
    for co in comps:
        programmes = [r[0] for r in conn.execute(
            "SELECT name FROM programme_master WHERE company_id = ? ORDER BY name", (co["company_id"],))]
        official = [co["primary_domain"], *json.loads(co["alt_domains"] or "[]"),
                    *EXTRA_OFFICIAL.get(co["company_id"], []), *PARTNER_NEWSROOMS]
        before = len(docs)
        for q in deep_queries(co["short_name"], programmes):
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
        print(f"  {co['short_name']}: {len(docs) - before} new web documents")
    return docs


BLOCK_TAGS = ["p", "div", "tr", "li", "br", "h1", "h2", "h3", "h4", "h5", "h6", "table"]


def filing_text(content):
    """Filing HTML -> one line per block element. Inline XBRL tags stay inside their sentence."""
    soup = BeautifulSoup(content, "lxml")
    for tag in soup(["script", "style", "ix:header"]):
        tag.decompose()
    for tag in soup.select('[style*="display:none"]'):
        tag.decompose()
    for tag in soup.find_all(BLOCK_TAGS):
        tag.insert_after("\n")
    for tag in soup.find_all("td"):
        tag.insert_after(" ")
    lines = (re.sub(r"\s+", " ", ln).strip() for ln in soup.get_text("").split("\n"))
    return [ln for ln in lines if ln]


def relevant_chunks(lines, pattern):
    """Keep matching paragraphs plus the line before (often the heading), verbatim and in filing order."""
    keep = sorted({j for i, ln in enumerate(lines) if pattern.search(ln) for j in (i - 1, i) if j >= 0})
    chunks, cur = [], []
    for i in keep:
        if cur and sum(len(x) + 1 for x in cur) + len(lines[i]) > CHUNK_CHARS:
            chunks.append("\n".join(cur))
            cur = []
        cur.append(lines[i])
    if cur:
        chunks.append("\n".join(cur))
    return chunks


def fetch_text(store, cid, url):
    def call():
        try:
            resp = requests.get(url, headers=SecEdgar.HEADERS, timeout=120)
        except requests.RequestException as e:
            return 599, {"error": str(e)}
        if resp.status_code != 200:
            return resp.status_code, {"body": resp.text[:500]}
        return 200, {"lines": filing_text(resp.content)}
    return store.fetch("sec_edgar", "document_text_v2", {"url": url}, cid, call)


def collect_sec(store, comps):
    sec = SecEdgar(store)
    _, tickers, _ = sec.company_tickers()
    cik_for = {v["ticker"]: v["cik_str"] for v in tickers.values()}
    docs = {}
    for co in comps:
        ticker = TICKERS.get(co["company_id"])
        if not ticker:
            continue
        cik = cik_for[ticker]
        _, sub, _ = sec.submissions(co["company_id"], cik)
        recent = sub["filings"]["recent"]
        pattern = re.compile(rf"\b({CORE_TERMS}|{COMPANY_TERMS[co['company_id']]})\b", re.I)
        n_docs = 0
        for i, form in enumerate(recent["form"]):
            date, acc, primary = recent["filingDate"][i], recent["accessionNumber"][i], recent["primaryDocument"][i]
            items = recent.get("items", [""] * len(recent["form"]))[i] or ""
            if date < WINDOW_START:
                continue
            base = f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc.replace('-', '')}"
            if form in ("10-K", "10-Q", "424B4", "20-F"):
                targets = [(f"{base}/{primary}", f"Form {form}")]
            elif (form == "8-K" and "2.02" in items) or form == "6-K":   # earnings / foreign-issuer reports
                status, index, _ = store.fetch("sec_edgar", "filing_index", {"url": f"{base}/index.json"},
                                               co["company_id"], _json_call("GET", f"{base}/index.json",
                                                                            headers=SecEdgar.HEADERS))
                names = [it["name"] for it in (index.get("directory") or {}).get("item", [])] if status == 200 else []
                label = "Form 8-K Exhibit 99 (earnings release)" if form == "8-K" else "Form 6-K Exhibit 99"
                # 8-K: the Exhibit 99 press release. 6-K: every document in the filing (foreign issuers such as
                # TSMC name their reports freely, e.g. the quarterly management report).
                targets = [(f"{base}/{nm}", label) for nm in names if nm.lower().endswith((".htm", ".html"))
                           and "-index" not in nm and (form == "6-K" or re.search(r"ex(hibit)?-?99", nm, re.I))]
            else:
                continue
            for url, label in targets:
                status, payload, _ = fetch_text(store, co["company_id"], url)
                if status != 200:
                    print(f"  sec {status} for {url}")
                    continue
                chunks = relevant_chunks(payload["lines"], pattern)
                full = "\n".join(chunks)
                title = f"{co['official_name']} {label} filed {date}"
                for k, chunk in enumerate(chunks):
                    docs[f"{url}#part-{k}"] = (co["company_id"], {
                        "url": f"{url}#part-{k}", "source_url": url, "title": title, "text": chunk,
                        "full_text": full, "filing_date": date, "publishedDate": date})
                n_docs += 1
        print(f"  {co['short_name']}: {n_docs} filing documents -> "
              f"{sum(1 for v in docs.values() if v[0] == co['company_id'])} passages")
    return docs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--companies", default="cmp_cerebras,cmp_aws,cmp_tesla")
    ap.add_argument("--per-query", type=int, default=10)
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--no-exa", action="store_true")
    ap.add_argument("--no-sec", action="store_true")
    args = ap.parse_args()

    conn = connect()
    wanted = set(args.companies.split(","))
    comps = [dict(r) for r in conn.execute("SELECT * FROM company_master WHERE in_module_1 = 1")
             if r["company_id"] in wanted]
    store = RawStore(conn, "m1_deep_dive", vars(args))
    docs = {}
    if not args.no_sec:
        print("Collecting SEC filings…")
        docs.update(collect_sec(store, comps))
    if not args.no_exa:
        print("Collecting web documents (Exa, deep query set)…")
        docs.update(collect_exa(conn, store, comps, args.per_query))
    process_documents(conn, store, docs, comps, args.workers, "m1_deep_dive_review.xlsx")


if __name__ == "__main__":
    main()
