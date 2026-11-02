# Intel Chiplet Market Signals POC — Shared Foundation Tasks

Both modules sit on top of this. Finish S1–S4 before starting pipeline work in
[Module 1](01_module1_emerging_demand_tasks.md) or [Module 2](02_module2_competitive_radar_tasks.md).
Data period for everything: last 12 months (Nov 2025 – Oct 2026).

Owner split: **Satish** = collection, extraction, normalisation, backend, app.
**Shu Qi** = assessment criteria, scoring, qualification rules, Intel portfolio mapping rulebook.

---

## S1. Shared database schema
- [x] Pick store: SQLite (libSQL/Turso-compatible) at data/chiplet.db; RAG chunks + embeddings in `rag_chunk` table.
- [x] Create tables with shared IDs:
  - `company_master` (company_id, official_name, primary_domain, alt_domains, hq_country, hq_city, linkedin_url/id, parent_company_id, business_units, research_role[], module_flags)
  - `programme_master` (programme_id, company_id, name e.g. Trainium/MTIA/TPU, type, architecture, process_node, packaging, tech_areas[])
  - `supplier_partner_master` (supplier_id, company_id ref, category: foundry/IP/EDA/design-services/OSAT/packaging/memory)
  - `source_evidence` (source_id, url, source_type, source_name, title, publication_date, event_date, collected_date, first_observed_date, excerpt, raw_payload_ref, screenshot_path)
  - `taxonomy` (role categories, event types, technologies, supplier categories, status labels, evidence classes)
  - `m1_signal` (signal_id, company_id, programme_id, signal_type, category, summary, source_id[], evidence_class, dates…)
  - `m2_competitive_event` (event_id, see Module 2 §M2-6 fields)
  - `assessment` (assessment_id, entity ref, criteria scores, intel_relevance, implication, confidence, action_tag, supporting signal/event ids)
  - `raw_provider_record` (provider, request, response JSON, fetched_at) — never deleted after normalisation
- [x] Keep event_date / publication_date / first_observed_date as three separate columns everywhere.

## S2. Common taxonomy
- [x] Hiring role categories: Architecture & system design, RTL/logic design, Physical design, Verification & validation, DFT & test, Packaging & integration, Manufacturing/bring-up/product eng, Sourcing & supplier mgmt, Other.
- [x] Event types (M2 six types) + M1 signal types (leadership, product/architecture, milestone, partnership, investment/M&A, manufacturing/capacity, patent/standards, financial/regulatory).
- [x] Technology tags from brief §8.1 keyword groups (ASIC, SoC, XPU, chiplet, UCIe, EMIB, Foveros, CoWoS, SoIC, I-Cube, X-Cube, HBM, 2.5D/3D, hybrid bonding, process nodes…).
- [x] Evidence classes: `confirmed_fact`, `corroborated_inference`, `press_released_intent`.
- [x] Action tags: Watchlist, Message, Campaign, Competitive response, Escalate.
- [x] Intel relationship status: existing customer/partner, potential target, research-only benchmark.

## S3. Company master (validate BEFORE any pipeline)
- [x] Build list: Module 1 (AWS, Google, Microsoft, Meta, Cerebras, Tenstorrent, Cisco, Nokia, Tesla, Apple, Samsung Electronics, IBM) + Module 2 (Broadcom, Marvell, AMD, NVIDIA, Arm, TSMC, Samsung Foundry + hyperscaler programmes).
- [x] For each: official name, primary domain, alt/BU domains, HQ, LinkedIn URL/ID, parent/subsidiaries, BUs, silicon programmes, research role.
- [x] Watch tricky mappings: AWS vs amazon.com; Google vs alphabet; Samsung Electronics vs Samsung Foundry (same legal entity, separate role); Meta vs facebook.com; Arm (arm.com) vs Arm Holdings.
- [ ] Export master list for review and get sign-off. *(exported: data/review/company_master_review.xlsx — sign-off pending)*

## S4. Source access & coverage validation
- [x] Explorium: credits, firmographic + technographic fields, domain match accuracy (test Cerebras, AWS, Tesla).
- [x] PredictLeads: job postings history depth, fields, rate limits (test Cerebras, AWS, Tesla).
- [x] Exa: date filters, result relevance for Broadcom, Marvell, TSMC.
- [x] Google News RSS: fallback coverage.
- [x] SEC EDGAR / IR pages / TWSE (TSMC) / DART (Samsung) for filings.
- [x] Record per source: match accuracy, 12-month availability, field completeness, freshness, limits/credits, export options, usage rights → [source_validation_report.md](source_validation_report.md); samples in data/review/source_probe_samples.xlsx.
- [x] Reuse existing clients from the hp-new repo: `pipeline/connectors/explorium_client.py`, `predictleads_client.py`, `pipeline/crawlers/exa_crawler.py`, `google_news_crawler.py`, `filings_crawler.py`. *(endpoint/auth patterns reused in chiplet/sources/providers.py; filings_crawler.py not reused — it fabricates links)*

## S5. Shared extraction layer
- [x] Implement brief §8.5 extraction prompt as one function (page/document → structured JSON + excerpt + evidence class).
- [x] Separate job-posting extraction variant.
- [x] Deterministic helpers: entity matching by domain, date parsing, dedup (URL canonicalisation + content hash).
- [x] Fields left `null`/"unavailable" when not in source — no inference.

- [ ] Run extraction sample on real data — blocked: needs ANTHROPIC_API_KEY in .env (`python scripts/run_extraction_sample.py`).

## S6. App shell, RAG and validation (after both modules have data)
- [ ] Web app shell: Overview | Emerging Demand | Competitive Radar | Evidence | Ask AI; global filters (period, company, category, search).
- [ ] Password protection (Vercel access controls).
- [ ] Overview page: KPI cards, M1/M2 highlight panels, priority findings (Question → Finding → Evidence → Intel implication → Action → Sources), recent signals feed — all computed from DB.
- [ ] Evidence Library page: searchable table of `source_evidence` + record detail.
- [ ] RAG: index structured records + evidence excerpts + raw text (not dashboard summaries); answers cite URL + date; label fact / inference / intent; no buying-intent claims.
- [ ] End-to-end validation against §17 completion criteria.
