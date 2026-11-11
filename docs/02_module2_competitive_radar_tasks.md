# Module 2 — Competitive Movement Radar (Competitive Intelligence)

Goal: track where custom-silicon business is landing, who is involved, and what it means for Intel.

Prerequisite: [Shared foundation](00_shared_foundation_tasks.md) S1–S5 done.
Sample scope: 6–8 competitor entities/groups, **5–10 representative developments**. Last 12 months only.
Rule: build and review **one pipeline at a time** — share sample records + source links before moving on.


## Status — 2026-11-11 (events collected, shown on /competitive-radar)
| Task | Status |
|---|---|
| M2-0 Scope | 7 competitors: Broadcom, Marvell, TSMC (pilot), AMD, NVIDIA, Arm, Samsung Foundry |
| M2-1 Profiles | In company master with value-chain role and Intel context |
| M2-2 Discovery | Free official sources only (Exa credits exhausted): newsroom sitemaps (NVIDIA, AMD, Marvell, Arm, Samsung), Broadcom releases via PR Newswire, Samsung Newsroom feed, SEC filings (10-K, 10-Q, 20-F, 8-K and 6-K exhibits). TSMC site blocks bots: TSMC from SEC 20-F/6-K. `scripts/m2_events_pipeline.py` |
| M2-3 Extraction & classification | 296 verified events (184 confirmed, 112 announced plans): NVIDIA 84, Arm 66, Marvell 60, AMD 45, TSMC 26, Broadcom 12, Samsung Foundry 3. Six event types; duplicates merged as corroborating sources; 496 held back in data/review/m2_events_review.xlsx |
| Counterparty names | **Done.** One canonical name per customer/partner (e.g. TSMC was 4 spellings, now 13 events under one name); when the event excerpt does not name the partner, a verbatim sentence from the same source that does is stored and shown (37 events). `scripts/m2_counterparties.py` |
| M2-4 Pre-signal trail | **Done.** 101 of 296 events link earlier records by fixed rules (same partner, same programme, partner's own announcements, supplier relationships, partner hiring build-up). Shown on each event page. `scripts/m2_pre_signal_trail.py` |
| M2-5 Representative 5–10 events | 10 events, 7 competitors, all 6 types: data/review/m2_representative_events.xlsx (scripts/export_m2_shortlist.py). Sent for Shu Qi review |
| M2-6 Event records | Done for all fields except Intel implication / response / priority (rulebook) |
| M2-7 Intel implication mapping | **Blocked — needs Shu Qi's rulebook** |
| M2-8 UI | /competitive-radar: overview charts, event register, foundry & packaging tracker; Ask Intelligence answers M2 questions |
| M2-9 Validation | **Brief §12 test: 6/6 Module 2 questions pass**, including Arm's role vs direct foundry competitors — data/review/rag_s12_test.md |

Rules added for M2: Module 1 category names map to M2 types only one-to-one (investment/financing and capacity → strategic investment/capacity; milestone → product/architecture); period dates ("Q4", "fiscal quarter ended …") keep no event date and rely on the document date; Samsung records count for Samsung Foundry only when the title or excerpt is about foundry work.

---

## M2-0. Scope confirmation
- [ ] Competitor entities and value-chain role tags:
  | Entity | Role tag |
  |---|---|
  | Broadcom, Marvell | Custom ASIC provider |
  | AMD, NVIDIA | Merchant semiconductor vendor |
  | Arm | IP/architecture competitor **and** ecosystem partner (Intel Chiplet Alliance) — never "direct foundry competitor" |
  | TSMC, Samsung Foundry | External foundry (direct foundry + packaging competitor) |
  | AWS Trainium/Graviton, Google TPU/Axion, Microsoft Maia/Cobalt, Meta MTIA | Hyperscaler in-house programme (programme-level only, parent stays customer/partner) |
- [ ] Pilot entities for every pipeline: **Broadcom, Marvell, TSMC**.
- [ ] Design-services / packaging / ecosystem players added only when materially involved in a tracked event.

## M2-1. Competitor profiles
- [ ] Reuse `company_master` IDs (hyperscalers shared with Module 1).
- [ ] Profile fields: company, value-chain role, technology focus, key programmes, Intel relationship context (e.g. Arm = Chiplet Alliance partner; AWS = Intel 18A customer).
- [ ] Hyperscaler programmes stored in `programme_master` and linked, not as separate competitor companies.

## M2-2. Event discovery pipeline (Exa → Google News RSS → official sources)
- [ ] Run §8.3 competitor queries (TSMC CoWoS/SoIC/2nm, Samsung I-Cube/X-Cube, Broadcom custom ASIC/Tomahawk/CPO, Marvell XPU/HBM, AMD chiplet/3D V-Cache/MI, NVIDIA multi-die/NVLink, Arm UCIe/Neoverse/Chiplet Alliance).
- [ ] Source priority: official newsroom/IR/filings → partner/supplier announcements → industry publications.
- [ ] Filings in last 12 months: earnings releases/10-K/10-Q (Broadcom, Marvell, AMD, NVIDIA), TSMC monthly/quarterly reports, Samsung IR.
- [ ] Store all candidates raw; pilot with Broadcom, Marvell, TSMC first.
- [ ] **Review checkpoint**.

## M2-3. Event extraction & classification
- [ ] Classify into the six event types: design win/customer, product/architecture, foundry/process/manufacturing, chiplet/advanced packaging, partnership/ecosystem, strategic investment/capacity/other.
- [ ] Dedup the same development reported by multiple outlets into one event with multiple source_ids.
- [ ] Assign evidence class: confirmed fact / corroborated inference / press-released intent. Partnership PR ≠ completed design win.
- [ ] Never infer undisclosed customers (e.g. unnamed Broadcom XPU customers stay "undisclosed").

## M2-4. Pre-signal trail linking
- [ ] For each event, link earlier related signals (hiring spikes, supplier announcements, prior news) from Module 1 / M2 data where visible.

## M2-5. Select representative event set
- [ ] Pick 5–10 developments covering the six types and at least 6 entities.
- [ ] Share shortlist with Shu Qi for review.

## M2-6. Competitive event record (fields → `m2_competitive_event`)
- [ ] Competitor, event ID, event title, event type
- [ ] Event date, publication date, first-observed date
- [ ] Customer / partner (if identified)
- [ ] Chip / product / programme (programme_id)
- [ ] Architecture / process node (if disclosed)
- [ ] Packaging / interconnect technology
- [ ] Value-chain role
- [ ] Commercial stage / development status
- [ ] Evidence classification
- [ ] Source URL(s) + supporting excerpt
- [ ] Potential Intel implication *(rulebook from Shu Qi)*
- [ ] Relevant marketing / competitive response *(rulebook from Shu Qi)*
- [ ] Pre-signal trail
- [ ] Priority / assessment category *(rulebook from Shu Qi)*

## M2-7. Intel implication mapping (logic from Shu Qi — do not invent)
- [ ] Implement rulebook mapping events → Intel areas: foundry/process, EMIB/Foveros packaging, chiplet integration, design enablement/IP, assembly & test.
- [ ] Unclear fit → "potential relevance — needs assessment".
- [ ] Action tags: Watchlist / Message / Campaign / Competitive response / Escalate, each linked to supporting events.

## M2-8. Competitive Radar page (UI)
- [ ] Filters: competitor, category, event type, technology, evidence class.
- [ ] Competitor overview: company | competitive area | latest activity; grouped as foundry / packaging / product / IP-ecosystem / hyperscaler programme.
- [ ] Development timeline (date × company × technology).
- [ ] Event register table + selected event detail (summary, customer/partner, product, evidence class, Intel implication, source links).
- [ ] Chiplet / advanced packaging tracker: competitor | technology | programme | partner | status.
- [ ] Arm shown with IP/architecture + Chiplet Alliance partner context.

## M2-9. Validation
- [ ] RAG test: all Module 2 example questions from brief §12 (incl. "Arm's role vs direct foundry competitors") return cited, dated answers with fact/inference/intent labels.
- [ ] Every event traceable to ≥1 source URL with excerpt.
- [ ] Spot-check evidence classes against source wording.

### Deliverables
- Competitor profiles, 5–10 classified competitive events with full fields, packaging tracker data, Competitive Radar page.
