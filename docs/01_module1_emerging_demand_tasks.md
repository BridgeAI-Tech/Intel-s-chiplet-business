# Module 1 — Emerging Demand Radar (Account / Prospect Intelligence)

Goal: find companies building/expanding custom silicon and gather evidence on their
maturity, external requirements and relevance to Intel (foundry, design/IP, advanced packaging).

Prerequisite: [Shared foundation](00_shared_foundation_tasks.md) S1–S5 done.
Sample scope: screen 8–12 companies → shortlist 3–5 → 1 deep dive. Last 12 months only.
Rule: build and review **one pipeline at a time** — share sample records + source links before moving on.


## Status — 2026-11-02 (sample delivered in web app)
| Task | Status |
|---|---|
| M1-0 Scope | 12 companies in master; 20/22 company records source-verified |
| M1-1 Firmographics | Explorium + SEC verified (domain, LinkedIn, HQ); evidence on company pages |
| M1-2 Technographics | Capability evidence comes from extracted signals (Explorium stack not used: generic IT) |
| M1-3 Hiring | 432 verified silicon postings: Tenstorrent 161, AWS 138 (amazon.jobs), Tesla 79, Cerebras 54. Other 8 companies not collected (PredictLeads volume/credits) |
| M1-4 News & filings | 370 verified signals across all 12 companies (Exa official + trade press, SEC filings). Deep dive (scripts/m1_deep_dive.py) on the pilot set: Cerebras 92 (41 from the 424B4 prospectus and 10-Qs), AWS 79 (10 from Amazon filings naming AWS/its chips), Tesla 26. Held back: data/review/m1_news_review.xlsx, m1_deep_dive_review.xlsx |
| M1-5 Supplier relationships | 103 relationships derived from verified signals |
| M1-6 Normalise & link | Shared company/programme/source IDs; duplicate reports merged as corroborating sources |
| M1-7 Assessment | **Blocked — needs research scoring rules (Shu Qi)**; no scores shown |
| M1-8 UI | Company-wise dashboard (8 numbered sections, company chips, evidence lake, data-source panel), company pages, signal detail, Ask AI |
| M1-9 Validation | Manual sample audit done; publish rule: verbatim excerpt + date provable from the document + fully inside window |

---

## M1-0. Scope confirmation
- [ ] Confirm screening list: AWS, Google, Microsoft, Meta, Cerebras, Tenstorrent, Cisco, Nokia, Tesla, Apple, Samsung Electronics, IBM.
- [ ] Tag Intel relationship: AWS / Google / Microsoft = existing (monitor, not new prospect); Meta = potential target to investigate; others = research.
- [ ] Preliminary shortlist for testing: Cerebras, AWS, Meta, Microsoft, Tesla. Deep dive: Cerebras (alt: Meta).
- [ ] Pilot companies for every pipeline: **Cerebras, AWS, Tesla**.

## M1-1. Firmographic pipeline (Explorium → website/Apify fallback)
- [ ] Pull for pilot 3: name, website, description, employee range, HQ + locations, parent/subsidiaries, LinkedIn, BUs, semiconductor activity.
- [ ] Verify domain match accuracy (e.g. AWS returns AWS, not Amazon retail).
- [ ] Fill gaps from company websites / targeted Apify only where needed.
- [ ] Store raw response in `raw_provider_record`, normalised into `company_master`.
- [ ] **Review checkpoint** → then scale to remaining companies.

## M1-2. Technographic & silicon-capability pipeline
- [ ] Explorium technographics — keep only semiconductor/design/infra-relevant fields; drop generic web-stack.
- [ ] Supplement with product pages, tech blogs, technical docs (Exa targeted).
- [ ] Tag against taxonomy: custom ASIC/SoC, CPU/GPU/AI accelerator, EDA, chiplet, EMIB/Foveros/CoWoS etc., foundry/assembly/test.
- [ ] Populate `programme_master` (e.g. Trainium, Graviton, MTIA, WSE-3, Dojo/AI5, Tenstorrent Blackhole).
- [ ] **Review checkpoint**.

## M1-3. Hiring pipeline (PredictLeads → career pages → targeted search)
- [ ] Semantic role search across the 8 role categories (not only exact title matches).
- [ ] Extract: original title, normalised title, function, role category, seniority, location, department/BU, description excerpt, posting date, first-observed, last-observed, status, programme/tech keywords, source URL + type, job ID, contract type.
- [ ] Dedup across providers and reposts (job ID + title/location/description hash).
- [ ] Keep posting date ≠ first-observed date.
- [ ] Compute volume + role-mix over time where history exists.
- [ ] Guardrails: vacancy ≠ hire; manufacturing/test/quality roles ≠ supplier-selection signal.
- [ ] **Review checkpoint** (title-matching accuracy, dates, dedup).

## M1-4. News, filings & company developments (Exa → Google News RSS → IR/filings)
- [ ] Run §8.2/§8.3 query combinations per company (custom silicon, chiplet, foundry, packaging, hiring, supplier, programme, investment, design win).
- [ ] Filings in last 12 months: 10-K/10-Q/8-K (US), IR pages for others.
- [ ] Capture categories: leadership, product/architecture, programme milestone, partnership, investment/M&A/financing, manufacturing/capacity, patent/standards, financial/regulatory.
- [ ] Each record: event date, publication date, collected date, URL, excerpt, category, evidence class → `m1_signal` + `source_evidence`.
- [ ] **Review checkpoint**.

## M1-5. Technical & supplier-signal pipeline
- [ ] Search supplier/partner sides (TSMC, Samsung Foundry, Intel Foundry, OSATs, Broadcom/Marvell design services, Arm, EDA vendors) for corroborating announcements.
- [ ] Patents & standards (UCIe membership, OCP, patent databases) — light touch for POC.
- [ ] Populate `supplier_partner_master` + relationship rows: supplier, category, relationship type, technology, commercial stage, status, evidence.
- [ ] Never infer an undisclosed supplier.
- [ ] **Review checkpoint**.

## M1-6. Normalise & link
- [ ] All M1 records linked by company_id / programme_id / supplier_id / source_id.
- [ ] Shared companies (AWS, Google, Microsoft, Meta, Samsung) reuse same IDs as Module 2.

## M1-7. Assessment & Intel mapping (logic from Shu Qi — do not invent)
- [ ] Receive criteria/scoring + qualification rules + Intel rulebook.
- [ ] Implement as config-driven rules writing to `assessment` with links to supporting signal IDs.
- [ ] Where fit unclear → "potential relevance — needs assessment", not forced mapping.
- [ ] Produce shortlist (3–5) + deep-dive dataset for Cerebras (or Meta).

## M1-8. Emerging Demand page (UI)
- [ ] Filters: industry, company, technology, development stage, evidence type.
- [ ] Company overview table: company | development stage | Intel relevance | relationship status.
- [ ] Selected company panel: profile, silicon activity, technology, Intel relevance with evidence.
- [ ] Hiring: trend chart, role-mix chart (click category → filtered postings), recent openings.
- [ ] Technology/development signals: programmes, milestones, patents/disclosures.
- [ ] Supplier & ecosystem table (click → source record).
- [ ] Sources & evidence table: date | signal | summary | URL | confidence.

## M1-9. Validation
- [ ] RAG test: all Module 1 example questions from brief §12 return cited, dated answers.
- [ ] Spot-check 10 random records back to source URLs.
- [ ] Missing data shown as unavailable, not inferred.

### Deliverables
- Validated company master (M1 portion), raw + normalised records per pipeline, review samples per checkpoint, shortlist + deep dive data, Emerging Demand page.
