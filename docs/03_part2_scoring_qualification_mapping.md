# Part 2 — Market Signal Scoring, Company Qualification & Intel Portfolio Mapping

Source: Shu Qi, "Intel Chiplet Market Signals — Technical Implementation Brief — Part 2" (SharePoint Word doc, read 2026-11-05).
Applies to Module 1 (prospect identification & assessment). Treat weights, thresholds and rules as **Version 1**,
configurable in the application (not hard-coded), calibrated after the initial sample.

Client requests with this brief:
- Scoring calculation, rating scale and qualification thresholds must be **configurable within the application**.
- Populate Module 2 data and show Module 2 in the dashboard so both modules are represented.

## 1. Market signal scoring

### A. Development stage (1–5, separate from the score)
| Stage | Classification | Criteria |
|---|---|---|
| 1 | Early Exploration | Exploring chiplet / custom silicon, limited evidence of active development |
| 2 | Capability Build | Hiring semiconductor engineers, building internal silicon teams or dedicated capabilities |
| 3 | Active Development | Actively developing proprietary silicon, custom ASICs, chiplet architectures |
| 4 | External Ecosystem Engagement | Engaging external foundries, IP providers, packaging partners or other ecosystem participants |
| 5 | Supplier Evaluation / Commercial Engagement | Supplier evaluation, manufacturing arrangements, design partnerships, packaging agreements or commercial engagement |

Rules: latest observable, verifiable activity; evidence + source URLs; no higher stage from an isolated or unverified
signal; record at project/activity level where possible; separate confirmed commercial engagement from exploratory
discussions or reported intentions. A higher stage does not by itself mean a higher-priority prospect.

### B. Weighted score (six dimensions, each rated 1–5, total /100)
| Dimension | Weight | Evaluate |
|---|---|---|
| A. Custom-silicon activity & strategic relevance | 25% | Proprietary silicon programmes, custom ASICs, processors, chiplet architectures |
| B. Engineering capability & hiring momentum | 20% | Hiring, semiconductor teams, chiplet architecture, RTL, physical design, packaging |
| C. Development maturity & progression | 15% | Prototypes, tape-outs, silicon validation, milestones towards deployment |
| D. External supplier & ecosystem signals | 15% | Foundry engagement, IP licensing, packaging partnerships, supplier evaluations, manufacturing collaborations |
| E. Intel offering fit | 20% | Alignment with Intel Foundry, process, design enablement, IP, advanced packaging, chiplet integration, assembly & test |
| F. Evidence strength & recency | 5% | Reliability, specificity, corroboration, recency |

Rating scale: 1 very weak (no meaningful evidence) · 2 limited · 3 moderate (credible but incomplete) · 4 strong ·
5 very strong (significant, specific, well-corroborated).

Overall score = Σ (rating ÷ 5 × weight). Example: 4/5 on A → 20 points.

Tiers: 80–100 Tier 1 high-priority prospect · 65–79 Tier 2 strong potential · 50–64 Tier 3 monitor · <50 Tier 4 low priority.

Evidence confidence (shown separately from the score): High = direct primary source (company announcements, official
hiring pages, confirmed partnerships) · Medium = credible, corroborated third-party reporting · Low = indirect,
unverified or speculative.

## 2. Company qualification (all three for "Qualified")
- **Q1 Custom-silicon relevance** — develops or commissions proprietary / custom silicon (processor, custom ASIC,
  chiplet architecture, third-party commissioned custom silicon), not only off-the-shelf processors.
- **Q2 External semiconductor requirement** — plausible external need for foundry manufacturing, design/IP, advanced
  packaging / chiplet integration, assembly & test. May be inferred from activities or operating model but must be
  labelled inferred, not confirmed.
- **Q3 Intel portfolio alignment** — plausible fit with at least one of foundry/process, design enablement/IP,
  advanced packaging/chiplet integration, assembly & test. No confirmed Intel relationship required.

| Outcome | Rule | Treatment |
|---|---|---|
| Qualified | Q1, Q2 and Q3 pass | Eligible for prospect shortlist |
| Conditional | Q1 passes, Q2 or Q3 needs validation | Monitor / investigate |
| Not Qualified | Fails Q1 | Exclude from Module 1 prospect shortlist |
| Not Qualified | No plausible external requirement or portfolio alignment | Exclude from active shortlist |

Considerations: missing public evidence → Conditional, not automatic exclusion; hyperscalers (AWS, Google, Microsoft,
Meta) are not automatically competitors — assess as prospects where they build or commission custom silicon; existing
Intel relationships don't disqualify, but a specific Foundry / Design-IP / Packaging opportunity must be identifiable;
exclude standard buyers using only off-the-shelf processors.

Shortlist: screen 8–12 → shortlist 3–5 → 1 deep dive. Prioritise by (1) overall score and tier, (2) development stage
and progression, (3) evidence confidence, (4) specific Intel portfolio fit and opportunity. Never by score alone — a
high score must still pass qualification.

## 3. Intel portfolio mapping rulebook

### A. Intel Portfolio & Technology Reference Database (six datasets)
| Dataset | Captures | Official reference |
|---|---|---|
| 1 Product Master | Intel products, services, offerings | Intel ARK — Product Specifications |
| 2 Process Technology Master | Foundry processes, nodes, manufacturing | Intel Foundry — Process Technologies |
| 3 Packaging Technology Master | EMIB, Foveros, 2.5D/3D, advanced packaging | Intel Foundry — Advanced Packaging |
| 4 IP & Design Capability Master | Design enablement, IP, design services | Intel Foundry Accelerator — Design Ecosystem |
| 5 Ecosystem Partner Master | Chiplet Alliance, IP Alliance, ecosystem partners | Chiplet Alliance / IP Alliance |
| 6 Technical Evidence Library | Official docs, specs, announcements, source URLs | Intel Foundry — Resource Library |

Priorities: P1 Intel Packaging Portfolio, Chiplet Alliance, Process Portfolio; P2 Intel ARK, IP Alliance, Foundry
Resource Library. Per entry: name & category, description & capabilities, applications / segments, associated Intel
products, status (active / announced / legacy), related ecosystem partners, official source URL + last verification date.
Intel offerings and ecosystem partners stay separate entities; third-party IP via the IP Alliance is never presented as
proprietary Intel IP.

### B. Mapping categories
| Category | Map | Intel offerings |
|---|---|---|
| Foundry / Process | External manufacturing, custom ASIC/processor manufacturing, process-node needs, chiplet die manufacturing | Intel Foundry, process technologies, manufacturing |
| Design / IP / Design Enablement | Custom silicon design, chiplet architecture, IP, design enablement, EDA, engineering support | Intel Foundry design ecosystem, IP Alliance, EDA Alliance, Design Services Alliance |
| Advanced Packaging / Chiplet Integration | Multi-die, 2.5D/3D, die-to-die, interconnect, assembly & test | EMIB, Foveros, Intel Foundry ASAT |

Official pages listed: Intel Foundry Overview, Process Technologies, Manufacturing; Foundry Accelerator — Design
Ecosystem, IP Alliance, Software & Services; Advanced Packaging, Chiplet Alliance, Packaging & Test Research.

### C. Mapping rules
1 map from requirements to Intel's actual capabilities · 2 multiple mappings allowed · 3 distinguish direct vs adjacent
fit · 4 every mapping linked to an activity, signal or requirement · 5 never present an inferred opportunity as an
existing partnership, supplier relationship or confirmed commercial opportunity.

### D. Relevance classification (per mapping)
Direct Fit (requirement aligns with a specific Intel offering) · Adjacent / Close Fit (plausible, needs validation) ·
No Identified Fit. Requirement status: Confirmed (stated / demonstrated) · Inferred (from activities or model) ·
Unverified (insufficient evidence).

### E. Output per company
Activity / initiative · technical or commercial requirement · Intel portfolio category · specific Intel product,
technology or capability · relevance (Direct / Adjacent / None) · requirement status (Confirmed / Inferred /
Unverified) · supporting URLs and evidence. Mappings are potential alignment, not confirmation of procurement intent.

## 4. Web application output (per assessed company)
Company name · custom-silicon activity · development stage (1–5) · overall score (/100) · tier (1–4) · evidence
confidence (High/Medium/Low) · qualification status (Qualified/Conditional/Not Qualified) · Foundry / Design-IP /
Packaging relevance (Direct / Adjacent / No Identified Fit) · supporting evidence (URLs + excerpts) · opportunity
interpretation. Everything traceable to market signals and source URLs — structured outputs, not only AI narrative.

## 5. Next steps (from the brief)
1. Populate the Intel Portfolio & Technology Reference Database (P1 first, official Intel pages).
2. Implement the scoring criteria (six dimensions, weights, rating scale, development stage).
3. Implement the qualification rules (Q1/Q2/Q3 and outcomes).
4. Implement portfolio mapping (multi-category, evidence and relevance classifications).
5. Validate on the initial sample: 8–12 screened → 3–5 shortlisted → 1 deeper assessment.

## Implementation status — 2026-11-05
| Step | Status |
|---|---|
| Configurable, not hard-coded | Weights, rating-scale wording, tier thresholds, stage rules, confidence thresholds and shortlist size live in `scoring_config` (seed `data/seed/scoring_config_v1.json`), editable at `/settings`. Saving creates a new version (v1.1, v1.2…) with history and restore. Score, tier, qualification outcome and shortlist are computed at read time from the active version (`web/lib/scoring.ts`, mirrored by `compute_outcome` in `scripts/m1_assessment.py`), so a change re-scores every company immediately. |
| 1. Intel Portfolio & Technology Reference Database | 49 entries from 6 official Intel Foundry pages (Packaging & Test, Chiplet Alliance, Process, IP Alliance, Design Ecosystem, Manufacturing), each with a verbatim excerpt; partners kept separate. intel.com refuses scripted requests, so pages were read in a browser and saved under `data/intel_pages/` (`scripts/intel_reference.py`). Not yet covered: Intel ARK product pages, Foundry Resource Library. Shown at `/intel-portfolio`. |
| 2. Scoring criteria | Development stage 1–5 and six dimension ratings for all 12 screened companies (`scripts/m1_assessment.py`), each citing record IDs. Rule checks: uncited rating → 1; hiring dimension flagged "insufficient" where no job postings were collected (8 companies); stage 4–5 needs ≥2 records incl. a confirmed fact; evidence confidence computed from source types. |
| 3. Qualification rules | Q1/Q2/Q3 per company with requirement status; outcome computed from the config. Result: 10 Qualified, 2 Conditional (Cerebras — Q3 needs validation; Samsung Electronics). |
| 4. Portfolio mapping | One mapping per category per company (Direct / Adjacent / No Identified Fit, Confirmed / Inferred / Unverified) pointing to a specific Intel reference offering; Direct Fit requires a specific offering and evidence. |
| 5. Validation on the sample | 12 screened → shortlist = top 5 Qualified (AWS 100, Tesla 96, Tenstorrent 92, Microsoft 84, Meta / Apple 80) → deep-dive candidate AWS. Ratings are AI-applied and rule-checked, status "draft": scores run high (10 of 12 Qualified), so Version 1 calibration by the research team is the next step, as the brief anticipates. |

Web: dashboard tab "Scoring & shortlist" (table of all 12, shortlist, weights), `/assessment/[company]` (full traceable assessment), `/intel-portfolio`, `/settings`.
Deployment note: on a read-only snapshot deployment, Settings changes last only for the running instance; a persistent database (e.g. Turso / Cloud SQL) is needed for durable edits.

## Update — 2026-11-05: brief's preliminary shortlist applied
- Active prospect shortlist = Part 1 brief §7: Cerebras, AWS, Meta, Microsoft, Tesla; deep-dive candidate Cerebras, alternative Meta
  (`data/seed/m1_shortlist.json`, shown on the "Scoring & shortlist" tab). The framework v1 score ranking is kept beside it for reference.
- Deep source extraction extended to Meta and Microsoft (SEC filings + official newsroom/engineering-blog RSS feeds; Exa has no
  credits): Meta 20 → 33 signals, Microsoft 22 → 39; relationships 6 → 18 and 13 → 22. Review sheet:
  `data/review/m1_deep_dive_review_meta_microsoft.xlsx`. Earlier assessments archived in `data/archive/`.
- Fix: the trade-press domain match treated microsoft.com as ft.com, and fb.com was missing from Meta's domains, so 23 of their own
  pages were labelled third-party. Relabelled; Microsoft evidence confidence moves Low → High. Other companies unaffected.
- Re-assessed Meta (80, Qualified, Medium) and Microsoft (84, Qualified, High). Scores unchanged: hiring data is still not collected
  for them (no provider credits).
