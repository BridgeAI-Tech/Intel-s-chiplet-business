"""Signal-first wide sweep (task 5): start from signals, not names, and surface companies that look like they are
building or commissioning their own silicon. Output: a sample name list for review (data/review/signal_sweep_names.xlsx).

Signals
  H  Hiring    - chip-design roles (ASIC, RTL, SoC, physical design, design verification, DFT, chiplet, advanced packaging)
                 posted since 2025-11-01, from CoreSignal (job records) and TheirStack (company search).
                 Bucket A: companies outside the semiconductor industry hiring chip designers (system companies building
                 custom silicon). Bucket B: small/mid semiconductor companies (chip start-ups). Staffing agencies excluded.
  N  News      - announcements of tape-outs, custom chips, foundry / packaging engagements, chip funding (Exa search),
                 company names extracted by Gemini and kept only with a verbatim excerpt.

Every provider response is cached in raw_provider_record, so re-runs cost no credits.

Usage: python scripts/signal_sweep.py [--cs-rounds 5] [--cs-per-round 100] [--ts-limit 40] [--no-news]
"""
import argparse
import json
import os
import re
import sys
import threading
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from enum import Enum
from pathlib import Path
from typing import List

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from chiplet.db import REVIEW_DIR, connect
from chiplet.extract.llm import ExtractionError, Extractor
from chiplet.extract.normalize import content_hash, excerpt_in_source
from chiplet.sources.providers import Exa, TheirStack, _json_call, env
from chiplet.sources.store import RawStore

WINDOW = "2025-11-01"
CS_SEARCH = "https://api.coresignal.com/cdapi/v2/job_multi_source/search/es_dsl"
CS_COLLECT = "https://api.coresignal.com/cdapi/v2/job_multi_source/collect/{}"
ROLE_PHRASES = ["ASIC", "RTL design", "RTL engineer", "SoC design", "SoC architect", "SoC verification",
                "physical design engineer", "design verification", "DFT engineer", "chiplet", "advanced packaging",
                "silicon architect", "silicon design", "CPU microarchitect", "post-silicon", "tape-out"]
ROLE_RE = re.compile(r"\b(asic|rtl|soc|physical design|design verification|dft|chiplet|advanced packaging|silicon|"
                     r"microarchitect\w*|tape-?out|verilog|systemverilog|uvm|timing closure|place and route)\b", re.I)
# Chip-design role titles only (no bare "semiconductor" / "silicon", which match unrelated roles).
SWEEP_TITLES = [r"(^|[^a-zA-Z])(asic|rtl|dft|ASIC|RTL|DFT)([^a-zA-Z]|$)",
                r"soc (design|architect|verification|physical)|chiplet|tape-?out|physical design engineer|design verification",
                r"microarchitect|cpu architect|gpu architect|silicon architect|silicon design|post-silicon|pre-silicon|advanced packaging"]
# TheirStack keyword filter matches whole words ("asic" does not match "Basic"), unlike its regex filter.
SWEEP_KEYWORDS = ["asic", "rtl design", "rtl engineer", "dft engineer", "chiplet", "soc design", "soc architect",
                  "design verification", "physical design engineer", "silicon architect", "silicon design",
                  "cpu microarchitect", "post-silicon", "advanced packaging", "tape-out"]
# Final whole-word check on job titles (both providers), so only chip-design roles count as a hiring signal.
CHIP_TITLE_RE = re.compile(
    r"\b(asic|rtl|dft|chiplet|tape-?out|post-silicon|pre-silicon|advanced packaging|microarchitect\w*|"
    r"soc (design|architect\w*|verification|physical)|(cpu|gpu|silicon|soc) architect\w*|silicon (design|validation)|"
    r"design verification|physical design (engineer|lead)|asic physical)\b", re.I)
STAFFING = ["Staffing and Recruiting", "Human Resources Services"]
SMALL = ["1-10 employees", "11-50 employees", "51-200 employees", "201-500 employees", "501-1,000 employees",
         "501-1000 employees"]
# Already in the POC (Module 1 and Module 2) or large established chip / EDA vendors: flagged, not surfaced as new.
KNOWN = {
    "poc": ["Amazon", "Amazon Web Services", "AWS", "Google", "Alphabet", "Microsoft", "Meta", "Cerebras", "Tenstorrent",
            "Cisco", "Nokia", "Tesla", "Apple", "Samsung", "IBM", "Broadcom", "Marvell", "AMD", "Advanced Micro Devices",
            "NVIDIA", "Arm", "TSMC", "Intel"],
    "established_chip_vendor": ["Qualcomm", "MediaTek", "Texas Instruments", "Analog Devices", "Micron", "SK hynix",
                                "Infineon", "NXP", "STMicroelectronics", "Renesas", "Microchip", "onsemi", "Synopsys",
                                "Cadence", "Siemens", "GlobalFoundries", "Realtek", "Western Digital", "Sandisk",
                                "Lattice", "AMD", "Skyworks", "Qorvo", "Monolithic Power", "Silicon Labs", "Ambarella",
                                "Rambus", "Astera Labs", "Credo", "Alchip", "Faraday", "Socionext", "Global Unichip"],
}


_local = threading.local()


def thread_store(store):
    """Worker threads need their own SQLite connection; they share the run."""
    if getattr(_local, "store", None) is None:
        _local.store = RawStore(connect(), store.pipeline if hasattr(store, "pipeline") else "signal_sweep",
                                run_id=store.run_id)
    return _local.store


def norm(name):
    n = re.sub(r"[,.]|\b(inc|llc|ltd|corp|corporation|co|gmbh|plc|limited|technologies|technology|group)\b", "",
               (name or "").lower())
    return re.sub(r"\s+", " ", n).strip()


KNOWN_NORM = {norm(n): k for k, names in KNOWN.items() for n in names}


def known_flag(name):
    n = norm(name)
    for k, kind in KNOWN_NORM.items():
        if n == k or n.startswith(k + " "):
            return kind
    return ""


# --------------------------------------------------------------------------------------------- CoreSignal hiring
def cs_query(bucket, exclude_names):
    should_roles = [{"match_phrase": {"title": p}} for p in ROLE_PHRASES]
    must = [{"bool": {"should": should_roles, "minimum_should_match": 1}},
            {"range": {"date_posted": {"gte": f"{WINDOW} 00:00:00"}}},
            {"exists": {"field": "company_industry"}}]   # recruiters and job boards mostly have no industry
    must_not = [{"match_phrase": {"company_industry": s}} for s in STAFFING]
    must_not += [{"match_phrase": {"company_name": n}} for n in exclude_names]
    if bucket == "A":
        must_not.append({"match": {"company_industry": "semiconductor"}})
        must_not.append({"match_phrase": {"company_industry": "IT Services and IT Consulting"}})
    else:
        must.append({"match": {"company_industry": "semiconductor"}})
        must.append({"bool": {"should": [{"match_phrase": {"company_size_range": s}} for s in SMALL],
                              "minimum_should_match": 1}})
    return {"query": {"bool": {"must": must, "must_not": must_not}}}


def coresignal_sweep(store, rounds, per_round, workers=6):
    headers = {"apikey": env("CORESIGNAL_API_KEY"), "accept": "application/json", "Content-Type": "application/json"}
    jobs = []
    for bucket in ("A", "B"):
        seen_companies = []
        for rnd in range(rounds):
            q = cs_query(bucket, seen_companies + KNOWN["poc"] + KNOWN["established_chip_vendor"])
            status, ids, _ = store.fetch("coresignal", "job_search", q, None,
                                         _json_call("POST", CS_SEARCH, headers=headers, json=q))
            if status != 200 or not isinstance(ids, list):
                print(f"  coresignal search {bucket}{rnd}: HTTP {status} {str(ids)[:200]}")
                break
            todo = ids[:per_round]

            def collect(i):
                st, rec, _ = thread_store(store).fetch("coresignal", "job_collect", {"id": i}, None,
                                         _json_call("GET", CS_COLLECT.format(i), headers=headers))
                return rec if st == 200 else None

            with ThreadPoolExecutor(max_workers=workers) as pool:
                recs = [r for r in pool.map(collect, todo) if r]
            new = set()
            for r in recs:
                if not CHIP_TITLE_RE.search(r.get("title") or "") or re.search(r"substation|electrical design", r.get("title") or "", re.I):
                    continue
                src = (r.get("job_sources") or [{}])
                url = r.get("external_url") if r.get("external_url") not in (None, "None") else None
                url = url or next((s.get("url") for s in src if s.get("url")), None)
                desc = r.get("description") or ""
                m = ROLE_RE.search(desc)
                excerpt = ""
                if m:   # the sentence around the first role term, copied verbatim from the posting
                    a = max(desc.rfind(".", 0, m.start()) + 1, 0)
                    b = desc.find(".", m.end())
                    excerpt = desc[a:(b + 1 if b != -1 else m.end() + 200)].strip()[:400]
                jobs.append({"tool": "CoreSignal", "bucket": bucket, "company": r.get("company_name"),
                             "domain": r.get("company_domain"), "industry": r.get("company_industry"),
                             "size": r.get("company_size_range"), "hq_country": r.get("company_hq_country"),
                             "title": r.get("title"), "date": (r.get("date_posted") or "")[:10], "url": url,
                             "job_country": r.get("country"), "excerpt": excerpt})
                if r.get("company_name"):
                    new.add(r["company_name"])
            seen_companies += sorted(new - set(seen_companies))
            print(f"  coresignal bucket {bucket} round {rnd + 1}: {len(ids)} ids returned, {len(recs)} collected, "
                  f"{len(new)} companies")
            if not new:
                break
    return jobs


# --------------------------------------------------------------------------------------------- TheirStack companies
def theirstack_companies(store, limit):
    body = {"job_filters": {"posted_at_gte": WINDOW, "job_title_or": SWEEP_KEYWORDS},
            "industry_not": STAFFING + ["Semiconductor Manufacturing", "Semiconductors", "IT Services and IT Consulting",
                                        "Research Services", "Engineering Services", "Outsourcing and Offshoring Consulting"],
            "company_name_not": [n for n in KNOWN["poc"] + KNOWN["established_chip_vendor"] if len(n) < 5],
            "company_name_partial_match_not": [n for n in KNOWN["poc"] + KNOWN["established_chip_vendor"] if len(n) >= 5],
            "company_type": "direct_employer", "min_num_jobs_found": 2,
            "order_by": [{"field": "num_jobs_found", "desc": True}], "limit": limit, "page": 0}
    status, payload, _ = store.fetch("theirstack", "companies_search", body, None,
                                     TheirStack(store).call("POST", "https://api.theirstack.com/v1/companies/search",
                                                            json=body))
    if status != 200:
        print(f"  theirstack companies: HTTP {status} {str(payload)[:300]}")
        return []
    out = []
    for c in payload.get("data") or []:
        titles = [j.get("job_title") for j in (c.get("jobs_found") or []) if CHIP_TITLE_RE.search(j.get("job_title") or "")]
        if not titles or c.get("is_recruiting_agency"):
            continue
        out.append({"tool": "TheirStack", "company": c.get("name"), "domain": c.get("domain"),
                    "industry": c.get("industry"), "size": c.get("employee_count_range") or c.get("employee_count"),
                    "hq_country": c.get("country") or c.get("country_code"), "num_jobs": c.get("num_jobs_found"),
                    "url": c.get("url") or (f"https://{c['domain']}" if c.get("domain") else None),
                    "titles": titles[:3]})
    print(f"  theirstack companies: {len(out)}")
    return out


# --------------------------------------------------------------------------------------------- Exa news
NEWS_QUERIES = [
    "company announces successful tape-out of its first custom chip",
    "startup tapes out AI accelerator chip",
    "company designs its own custom silicon in-house chip announcement",
    "chiplet-based processor announced by startup",
    "company selects TSMC for its custom ASIC",
    "company selects Samsung Foundry for custom chip",
    "Intel Foundry 18A customer announces chip",
    "advanced packaging agreement for custom AI chip",
    "UCIe chiplet startup raises funding",
    "AI chip startup raises Series B funding",
    "automaker develops in-house autonomous driving chip",
    "robotics company develops custom chip",
    "telecom equipment maker custom ASIC silicon",
    "RISC-V custom SoC company announces tape-out",
    "Japanese AI chip startup develops custom accelerator",
    "Korean AI chip startup tape-out",
    "Indian semiconductor design startup tapes out chip",
    "European startup custom AI inference chip",
]


class SignalType(str, Enum):
    tape_out = "tape_out"
    custom_chip = "custom_chip_announcement"
    foundry = "foundry_engagement"
    packaging = "packaging_engagement"
    funding = "chip_funding"
    design_partnership = "design_partnership"
    other = "other"


class NewsCompany(BaseModel):
    company_name: str
    company_role: str          # e.g. "chip start-up", "automaker", "hyperscaler", "telecom equipment maker"
    signal_type: SignalType
    summary: str
    excerpt: str               # verbatim sentence from the article supporting the signal


class NewsCompanies(BaseModel):
    companies: List[NewsCompany]


NEWS_PROMPT = """You read one article and list the companies that the article shows are designing, commissioning,
taping out, manufacturing or packaging their OWN chips (custom silicon, ASICs, chiplets, AI accelerators).
Rules:
- Only companies whose own chip activity is stated in the article. Do not list foundries, EDA vendors, investors or
  suppliers unless the article describes their own chip.
- excerpt must be copied word for word from the article (one or two sentences) and support the signal.
- summary: one plain sentence. No facts that are not in the article.
- Return an empty list if no company qualifies."""


def exa_news(store, extractor, per_query):
    exa = Exa(store)
    docs = {}
    for q in NEWS_QUERIES:
        status, payload, _ = exa.search(None, q, f"{WINDOW}T00:00:00.000Z", num_results=per_query, max_characters=6000)
        if status != 200:
            print(f"  exa {status}: {str(payload)[:200]}")
            continue
        for r in payload.get("results") or []:
            if r.get("text") and r.get("url"):
                docs.setdefault(r["url"], (q, r))
    print(f"  exa: {len(docs)} articles from {len(NEWS_QUERIES)} queries")

    def extract(item):
        url, (q, r) = item
        text = f"Title: {r.get('title')}\nPublished: {r.get('publishedDate')}\n\n{r['text']}"
        try:
            res, _ = Extractor(thread_store(extractor.store))._call("sweep_news", NEWS_PROMPT, NewsCompanies, f"<article>\n{text}\n</article>",
                                     {"content_hash": content_hash(text)}, None)
        except ExtractionError as e:
            return []
        return [{"tool": "Exa + Gemini", "company": c.company_name, "role": c.company_role,
                 "signal": c.signal_type.value, "summary": c.summary, "excerpt": c.excerpt, "url": url,
                 "title": r.get("title"), "date": (r.get("publishedDate") or "")[:10], "query": q}
                for c in res.companies if excerpt_in_source(c.excerpt, text)]

    with ThreadPoolExecutor(max_workers=6) as pool:
        rows = [x for lst in pool.map(extract, docs.items()) for x in lst]
    print(f"  news: {len(rows)} company mentions with a verified excerpt")
    return rows


# --------------------------------------------------------------------------------------------- combine + export
def combine(jobs, ts, news):
    by = defaultdict(lambda: {"names": set(), "domains": set(), "industry": set(), "size": set(), "country": set(),
                              "tools": set(), "hiring_n": 0, "titles": [], "news": [], "first": None, "last": None,
                              "ts_jobs": None, "bucket": set(), "examples": []})
    for j in jobs:
        k = norm(j["company"])
        if not k:
            continue
        e = by[k]
        e["names"].add(j["company"]); e["tools"].add("CoreSignal"); e["hiring_n"] += 1; e["bucket"].add(j["bucket"])
        for f, src in (("domains", "domain"), ("industry", "industry"), ("size", "size"), ("country", "hq_country")):
            if j.get(src):
                e[f].add(str(j[src]))
        e["titles"].append(j["title"])
        if j.get("url") and len(e["examples"]) < 2:
            e["examples"].append(f"{j['date']} {j['title']} — {j['url']}")
        for d in [j.get("date")]:
            if d:
                e["first"] = min(e["first"] or d, d); e["last"] = max(e["last"] or d, d)
    for c in ts:
        k = norm(c["company"])
        if not k:
            continue
        e = by[k]
        e["names"].add(c["company"]); e["tools"].add("TheirStack"); e["ts_jobs"] = c.get("num_jobs")
        for f, src in (("domains", "domain"), ("industry", "industry"), ("size", "size"), ("country", "hq_country")):
            if c.get(src):
                e[f].add(str(c[src]))
        e["titles"] += [t for t in c["titles"] if t]
        e["bucket"].add("A")
    for n in news:
        k = norm(n["company"])
        if not k:
            continue
        e = by[k]
        e["names"].add(n["company"]); e["tools"].add("Exa"); e["news"].append(n)
        if n.get("role"):
            e["industry"].add(n["role"])
    rows = []
    for k, e in by.items():
        name = sorted(e["names"], key=len)[0]
        flag = known_flag(name)
        signals = []
        if e["hiring_n"] or e["ts_jobs"]:
            signals.append("Hiring chip designers")
        signals += sorted({n["signal"].replace("_", " ") for n in e["news"]})
        score = (min(e["hiring_n"], 10) + (min((e["ts_jobs"] or 0), 50) // 5) + 5 * len({n["url"] for n in e["news"]})
                 + 3 * (len(e["tools"]) - 1))
        rows.append({
            "company": name, "domain": ", ".join(sorted(e["domains"]))[:80], "industry / role": "; ".join(sorted(e["industry"]))[:120],
            "size": ", ".join(sorted(e["size"]))[:40], "HQ country": ", ".join(sorted(e["country"]))[:40],
            "type": ("System company building chips" if "A" in e["bucket"] else "Chip start-up / small chip company"
                     if "B" in e["bucket"] else "From news"),
            "already in POC / known vendor": {"poc": "In POC", "established_chip_vendor": "Established chip vendor"}.get(flag, ""),
            "signals": "; ".join(signals), "tools": ", ".join(sorted(e["tools"])),
            "chip jobs sampled (CoreSignal)": e["hiring_n"] or "", "silicon jobs listed (TheirStack)": e["ts_jobs"] or "",
            "example roles": "; ".join(dict.fromkeys(t for t in e["titles"] if t))[:240],
            "news evidence": "\n".join(f"{n['date']} {n['summary']} — {n['url']}" for n in e["news"][:2]),
            "news excerpt (verbatim)": "\n".join(f"\"{n['excerpt']}\"" for n in e["news"][:2]),
            "hiring evidence": "\n".join(e["examples"]),
            "latest signal date": max([x for x in [e["last"]] + [n["date"] for n in e["news"]] if x] or [""]),
            "_score": score,
        })
    for r in rows:
        r["lead quality"] = lead_quality(r)
    order = {"Strong lead": 0, "Lead": 1, "Supplier (design services / distributor)": 2, "Exclude (noise)": 3}
    rows.sort(key=lambda r: (r["already in POC / known vendor"] != "", order[r["lead quality"]], -r["_score"], r["company"]))
    return rows


NOISE_INDUSTRY = re.compile(r"government|construction|financial services|banking|insurance|venture capital|staffing|"
                            r"human resources|education|hospital|retail|real estate|legal services", re.I)
NOISE_NAMES = {"asic", "weekday ai (yc w21)", "jobs via dice", "jobot"}
SERVICES_INDUSTRY = re.compile(r"it services|engineering services|business consulting|design services|research services|"
                               r"outsourcing|professional services|information technology & services", re.I)
DISTRIBUTORS = {"arrow electronics", "avnet", "future electronics", "wpg holdings", "mouser electronics"}


def lead_quality(r):
    """Research-lead label for review (rows are kept either way)."""
    ind, name = r["industry / role"] or "", r["company"].lower()
    news = "tape out" in r["signals"] or "custom chip" in r["signals"] or "foundry" in r["signals"]
    if name in NOISE_NAMES or (NOISE_INDUSTRY.search(ind) and not news):
        return "Exclude (noise)"
    if name in DISTRIBUTORS or (SERVICES_INDUSTRY.search(ind) and not news and "Computer" not in ind):
        return "Supplier (design services / distributor)"
    if r["tools"].count(",") >= 1 or r["_score"] >= 10 or (news and "Hiring" in r["signals"]):
        return "Strong lead"
    return "Lead"


def write_xlsx(path, rows, jobs, ts, news, notes):
    wb = Workbook()
    wb.remove(wb.active)
    head = Font(bold=True, color="FFFFFF", name="Arial", size=10)
    fill = PatternFill("solid", fgColor="0068B5")
    body = Font(name="Arial", size=10)
    wrap = Alignment(wrap_text=True, vertical="top")

    def sheet(ws, cols, data, widths):
        ws.append(cols)
        for i, c in enumerate(cols, 1):
            cell = ws.cell(row=1, column=i)
            cell.font, cell.fill, cell.alignment = head, fill, wrap
            ws.column_dimensions[get_column_letter(i)].width = widths.get(c, 18)
        for d in data:
            ws.append([d.get(c) if not isinstance(d.get(c), (list, set)) else "; ".join(map(str, d.get(c))) for c in cols])
        for row in ws.iter_rows(min_row=2):
            for cell in row:
                cell.font, cell.alignment = body, wrap
        ws.freeze_panes = "B2"
        ws.auto_filter.ref = ws.dimensions

    ws = wb.create_sheet("All names")
    cols = [c for c in rows[0] if not c.startswith("_")] + ["Mia: keep? (Y/N)", "Comments"] if rows else []
    sheet(ws, cols, rows, {"company": 26, "signals": 34, "example roles": 44, "news evidence": 60,
                           "news excerpt (verbatim)": 60, "hiring evidence": 60, "industry / role": 30, "type": 26})
    for r in range(2, ws.max_row + 1):
        for c in (len(cols) - 1, len(cols)):
            ws.cell(row=r, column=c).fill = PatternFill("solid", fgColor="FFFF00")
    top = [r for r in rows if r["lead quality"] == "Strong lead" and not r["already in POC / known vendor"]]
    tcols = ["company", "type", "industry / role", "HQ country", "signals", "tools", "example roles", "news evidence",
             "latest signal date"]
    wt = wb.create_sheet("Top names for Mia", 0)
    sheet(wt, tcols + ["Mia: keep? (Y/N)", "Comments"], top,
          {"company": 26, "type": 24, "industry / role": 30, "signals": 34, "example roles": 44, "news evidence": 60})
    for rr in range(2, wt.max_row + 1):
        for cc in (len(tcols) + 1, len(tcols) + 2):
            wt.cell(row=rr, column=cc).fill = PatternFill("solid", fgColor="FFFF00")
    sheet(wb.create_sheet("Hiring evidence"), ["tool", "bucket", "company", "domain", "industry", "size", "hq_country",
                                               "title", "date", "job_country", "url", "excerpt"], jobs,
          {"company": 24, "title": 40, "url": 50, "excerpt": 70, "industry": 26})
    sheet(wb.create_sheet("TheirStack companies"), ["company", "domain", "industry", "size", "hq_country", "num_jobs",
                                                    "titles", "url"], ts, {"company": 26, "titles": 60, "industry": 26})
    sheet(wb.create_sheet("News evidence"), ["company", "role", "signal", "summary", "excerpt", "title", "date", "url",
                                             "query"], news, {"summary": 50, "excerpt": 70, "title": 40, "url": 50, "query": 36})
    wn = wb.create_sheet("Method & tools")
    wn.column_dimensions["A"].width = 26
    wn.column_dimensions["B"].width = 110
    for k, v in notes:
        wn.append([k, v])
    for row in wn.iter_rows():
        row[0].font = Font(bold=True, name="Arial", size=10)
        row[1].font, row[1].alignment = body, wrap
    wb.save(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cs-rounds", type=int, default=5)
    ap.add_argument("--cs-per-round", type=int, default=100)
    ap.add_argument("--ts-limit", type=int, default=25)   # free plan: max 25 per page
    ap.add_argument("--news-per-query", type=int, default=10)
    ap.add_argument("--no-news", action="store_true")
    args = ap.parse_args()
    conn = connect()
    store = RawStore(conn, "signal_sweep", vars(args))
    print("CoreSignal hiring sweep…")
    jobs = coresignal_sweep(store, args.cs_rounds, args.cs_per_round)
    print("TheirStack company search…")
    ts = theirstack_companies(store, args.ts_limit)
    news = []
    if not args.no_news:
        print("Exa news sweep…")
        news = exa_news(store, Extractor(store), args.news_per_query)
    rows = combine(jobs, ts, news)
    new = [r for r in rows if not r["already in POC / known vendor"]]
    notes = [
        ("Purpose", "Signal-first sweep: surface companies from signals (hiring chip designers, chip news) rather than "
                    "from a named list, to give an example name list for review."),
        ("Window", f"Signals dated from {WINDOW}."),
        ("Hiring (CoreSignal)", "Job titles containing ASIC, RTL, SoC, physical design, design verification, DFT, chiplet, "
                                "advanced packaging, silicon architect, CPU microarchitect, post-silicon, tape-out. Bucket A: "
                                "companies outside the semiconductor industry (system companies). Bucket B: semiconductor "
                                "companies with up to 1,000 employees (start-ups). Staffing agencies and IT-services firms "
                                "excluded. Each round excludes companies already found, so later rounds surface new names."),
        ("Hiring (TheirStack)", "Company search: companies with jobs matching silicon role titles since the window start, "
                                "outside semiconductors and staffing, ordered by number of matching jobs."),
        ("News (Exa + Gemini)", "18 searches for tape-outs, custom chips, foundry / packaging engagements and chip funding, "
                                "incl. Japan, Korea, India and Europe. Gemini lists the companies whose own chip activity "
                                "the article states; kept only if its supporting sentence is found word for word."),
        ("Not used", "Explorium (0 credits left), PredictLeads (credits used up), Axar.ai (no key), Apify and Bright Data "
                     "(scrapers - not needed for a name list; candidates for patents / LinkedIn later)."),
        ("Caveats", "Company names are as the providers list them. Job postings are vacancies, not hires. A name on this "
                    "list is a research lead, not a confirmed Intel prospect."),
        ("Counts", f"{len(rows)} companies surfaced, {len(new)} not already in the POC or established chip vendors; "
                   f"{len(jobs)} job records, {len(ts)} TheirStack companies, {len(news)} news mentions."),
    ]
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    out = REVIEW_DIR / "signal_sweep_names.xlsx"
    write_xlsx(out, rows, jobs, ts, news, notes)
    store.finish(records_out=len(rows))
    print(f"Done: {out} - {len(rows)} companies ({len(new)} new). live calls={store.live_calls}")


if __name__ == "__main__":
    main()
