# S4 — Source Access & Coverage Validation

Probe date: 2026-11-02 · Window: 2025-11-01 → 2026-11-01 (last 12 months)
Pilot set: **Cerebras, AWS, Tesla** (Module 1) · **Broadcom, Marvell, TSMC** (Module 2) · SEC EDGAR checked for all public companies.

Every probe response is stored untouched in `raw_provider_record` (48 records, linked to `pipeline_run`).
Sample records and source links for review: **`data/review/source_probe_samples.xlsx`**
(Explorium 3 · PredictLeads silicon jobs 51 · Exa 75 · Google News 216 · SEC filings 326).

## Summary

| Source | Access | Domain / entity match | 12-month data | Verdict |
|---|---|---|---|---|
| Explorium firmographics | ✅ API key works | ✅ 3/3 correct (AWS matched as AWS, not Amazon) | Current snapshot only (no history) | **Use** for firmographics |
| Explorium technographics | ✅ | ✅ | Snapshot | **Low value** — generic IT stack; supplement from web |
| Explorium hierarchy | ✅ | ⚠ Cerebras: no record; Tesla: wrong subsidiaries | Snapshot | **Do not trust** without verification |
| PredictLeads job openings | ✅ | ✅ Cerebras, Tesla · ❌ `aws.amazon.com` rejected | ✅ history with first/last seen + closed status | **Use** (Cerebras, Tesla); AWS via `amazon.com` or amazon.jobs |
| amazon.jobs search (official career site) | ✅ public JSON, no key | ✅ "Annapurna Labs" query | Open roles only | **Use** for AWS silicon roles |
| Exa search | ✅ | n/a (query-based) | ✅ `startPublishedDate` honoured; 100% of results in window | **Primary** news & web source |
| Google News RSS | ✅ free | n/a | ✅ with `when:1y`; capped at 100 items/feed | **Fallback** — needs month windows and URL resolution |
| SEC EDGAR | ✅ free (UA header) | ✅ 16/18 public companies by ticker → CIK | ✅ full filing list | **Use** for filings |
| Samsung (Electronics & Foundry) | ❌ not on EDGAR | — | — | Needs DART OpenAPI key or Samsung IR site |
| Tenstorrent | — | private | — | News / website only |

## 1. Explorium (Cerebras, AWS, Tesla)

Calls: 3 × match + 3 × (firmographics, technographics, company_hierarchies) = 12.

**Firmographics — good.** All three matched the right entity:

| | Name returned | HQ | Employees | LinkedIn | Industry |
|---|---|---|---|---|---|
| Cerebras | Cerebras Systems Inc. | Sunnyvale, US | 1001-5000 | /company/cerebras-systems ✓ | Semiconductor manufacturing |
| AWS | Amazon Web Services (AWS) | Seattle, US | 10001+ | /company/amazon-web-services ✓ | IT services |
| Tesla | Tesla, Inc. | Austin, US | 10001+ | /company/tesla-motors ✓ | Motor vehicle manufacturing |

LinkedIn URLs agree with the company master seed → can set `linkedin_verified` for these three.
Explorium also returns ticker `xnas:cbrs` for Cerebras — consistent with its IPO (see §5).

**Technographics — weak for this POC.**
- Cerebras: 96 tools, all generic IT/web (AWS, Atlassian, Cisco Meraki…) — no EDA, foundry or packaging signals.
- Tesla: empty stack.
- AWS: 1,413 tools; a few relevant (Cadence Innovus, Cadence Spectre, Ansys) but buried in noise.
- → Per brief §5.2, do not display generic stack. Keep only a curated allowlist (EDA, FPGA, semiconductor IP tools); get silicon capability from product pages, technical docs and filings instead.

**Hierarchy — unreliable.** Cerebras: `miss`. Tesla subsidiaries include *Etteplan*, *Cardinal Glass Industries*, *Castello SGR* (not Tesla subsidiaries). AWS parent correctly "amazoncom" but subsidiaries mix acquisitions with unrelated names ("nice", "harvest groupe"). → Store raw, but company master parent/subsidiary links stay manually verified.

**Credits:** responses do not report credit usage — check the Explorium dashboard for the 12 calls made.

## 2. PredictLeads job openings (Cerebras, AWS, Tesla)

Calls: 10 (including pagination, date-filter and sizing tests).

**Fields available** (matches brief §5.3): title, translated_title, normalized_title, description, url, `first_seen_at`, `last_seen_at`, `posted_at`, status, seniority, categories, location_data, contract_types, tags, O*NET data, job ID.

**Findings**
- History: Cerebras records go back to 2018 with `status=closed` → hiring trend over 12 months is possible.
- `posted_at` is sparse (Cerebras 20/1000, Tesla 128/1000). **`first_seen_at` is the reliable date** — keep posting date and first-observed separate as the brief requires; never back-fill one from the other.
- Pagination: `page` + `limit` (max 1,000), newest first; `meta.count` returned when `page` is passed.
- Server-side date filter works: `first_seen_at_from` / `first_seen_at_until`.
- 12-month volumes (`first_seen_at_from=2025-11-01`):

  | Domain | Jobs | Calls @1,000 |
  |---|---|---|
  | cerebras.ai | 411 | 1 |
  | cerebras.net | 0 | — (confirms `.ai` is the right key) |
  | tesla.com | 12,701 | 13 |
  | amazon.com | 43,411 | 44 |

- `aws.amazon.com` → HTTP 400 "not a valid company ID or domain". AWS jobs live under `amazon.com`, mostly non-silicon.
- Silicon relevance from titles in the probe pages: Cerebras 115/1000 (ASIC RTL, design verification, physical design, post-silicon bring-up, PCB layout); Tesla has a Bengaluru AI-hardware cluster (ASIC RTL, SoC verification, DFT, physical design) inside mostly sales/manufacturing roles.
- Title regex is not enough: "SOC" matched *Security Operations Center*. → Role classification needs title + description context (planned LLM/semantic step in S5), not keywords alone.

**Recommended hiring approach**
- Cerebras: full 12-month pull from PredictLeads (1 call).
- Tesla: 13 paged calls, then classify locally; keep only silicon role categories in signals but retain all raw.
- AWS: **amazon.jobs** official search (`/en/search.json?base_query=Annapurna Labs` → 305 open roles with posted date, job ID, location) as primary for open roles; PredictLeads `amazon.com` with a keyword pre-filter on Annapurna/Trainium/Graviton only if closed-role history is needed (44 calls).

## 3. Exa (Broadcom, Marvell, TSMC)

Calls: 6 (open web + official-domain-only per company). **Cost reported in response: $0.057 total** (~$0.007–0.012 per search).

- `startPublishedDate` honoured — all 75 results dated inside the window; 100% matched the technology keywords.
- Official-domain mode (`includeDomains`) surfaces first-party evidence well, e.g.
  - Broadcom: *Broadcom Ships 3.5D Face-to-Face Compute SoC* (investors.broadcom.com, 2026-02-26); *OpenAI and Broadcom Unveil LLM-Optimized Intelligence Processor* (2026-06-24)
  - Marvell: *Marvell to Acquire Celestial AI* (investor.marvell.com, 2025-12-02); *Next Generation Die-to-Die Interconnects for XPUs* (2026-04-15)
  - TSMC: board resolutions (pr.tsmc.com) — but also careers pages ("SoIC Manager") → filter careers URLs out of news.
- Open-web mode returns good industry press (TrendForce, EE Times, The Register, SemiAnalysis, DCD) **plus low-quality aggregators** (globaltradedraft.com, api.finexus.net, freedom251.com, referently.com). TSMC open-web returned 0 first-party results.
- `publishedDate` on product pages (e.g. marvell.com/products/…) reflects crawl/update date, **not an event date** → store as publication date only; event date must be extracted from text.

**Recommendation:** run each query twice — official domains (company + partner newsroom/IR) and open web restricted to a source allowlist/tier list; drop careers URLs; extract event date separately.

## 4. Google News RSS (fallback)

- Bug found and fixed: `when:12m` is read as 12 *minutes* → 0 results. `when:1y` works (46 / 70 / 100 items for Broadcom / Marvell / TSMC).
- Each feed is capped at 100 items (TSMC hit the cap) → use monthly `after:` / `before:` windows for full coverage.
- Links are `news.google.com/rss/articles/…` redirects → must be resolved to the publisher URL before storing as evidence.
- Heavy share of stock commentary (Yahoo Finance, Motley Fool-style) → apply the same source tiering as Exa.

## 5. Filings — SEC EDGAR

Free; requires a descriptive User-Agent. `company_tickers.json` → CIK → `submissions` gives the full filing index.

| Ticker | Filer | 10-K/20-F | 10-Q | 8-K / 6-K | Other |
|---|---|---|---|---|---|
| AVGO | Broadcom | 1 | 3 | 13 | |
| MRVL | Marvell | 1 | 3 | 19 | |
| AMD | AMD | 1 | 3 | 13 | |
| NVDA | NVIDIA | 1 | 3 | 13 | |
| ARM | Arm Holdings | 1 (20-F) | | 13 (6-K) | |
| TSM | TSMC | 1 (20-F) | | 55 (6-K) | |
| CBRS | **Cerebras** | | 2 | 3 | **S-1, 424B4 (IPO)** |
| TSLA | Tesla | 1 | 3 | 10 | |
| AMZN / GOOGL / MSFT / META | parents of hyperscalers | 1 each | 3 each | 9–16 | |
| CSCO / IBM / AAPL / NOK | | 1 / 1 / 0 / 1 (20-F) | 3 / 3 / 3 / – | 8 / 13 / 7 / 52 (6-K) | |

- **Cerebras is now public** — its S-1 / 424B4 prospectus (risk factors, supplier and customer concentration, manufacturing partners) is the strongest single source for the deep dive.
- Apple's FY2026 10-K is not yet filed (fiscal year ended September).
- Not covered: **Samsung Electronics / Samsung Foundry** (Korea — DART OpenAPI needs a free key; or samsung.com IR PDFs), **Tenstorrent** (private).
- The old hp-new `filings_crawler.py` must **not** be reused: it builds made-up report names and `investors.<company>.com` links instead of querying any source.

## 6. Decisions needed

1. **AWS hiring:** amazon.jobs (open roles, free) as primary, plus PredictLeads `amazon.com` (44 calls) only if closed-role history is needed?
2. **Samsung filings:** register a DART OpenAPI key, or use Samsung IR PDFs manually for the POC?
3. **Explorium technographics:** agree to show only a curated EDA/semiconductor-tool allowlist and otherwise rely on web/filings evidence.
4. **Source tiering for news:** approve a tier list (Tier 1 official/partner newsroom & filings, Tier 2 trade press such as TrendForce/EE Times/SemiAnalysis/DCD/The Register/Tom's Hardware, Tier 3 everything else, excluded aggregators).

## 7. Usage & rights notes (to confirm on account pages)

- Explorium and PredictLeads do not return credit usage in responses — check dashboards; raw responses are cached by request so re-runs cost nothing.
- Exa reports cost per call (`costDollars`).
- Google News RSS: unofficial, no SLA; store publisher URL + excerpt, not full article text.
- SEC EDGAR: public domain; keep request rate ≤ 10/s.
- Data-usage terms for Explorium / PredictLeads content in a client-facing dashboard: **not yet confirmed**.
