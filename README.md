# Intel Chiplet Market Signals — POC

Evidence-led sample for Module 1 (Emerging Demand Radar) and Module 2 (Competitive Movement Radar).
Task breakdown: [docs/](docs/00_shared_foundation_tasks.md).

## Layout
| Path | Purpose |
|---|---|
| `db/schema.sql` | Shared backend schema for both modules (company, programme, supplier, evidence, taxonomy, M1 signals, M2 events, assessments, RAG chunks) |
| `data/seed/taxonomy.json` | Common taxonomy: role categories, event types, technologies, evidence classes, action tags… |
| `data/seed/company_master.json` | Company master — domains are the matching key for every provider |
| `data/seed/programme_master.json` | Silicon programmes / products used as search terms and link targets |
| `chiplet/db.py` | DB connection and paths (`CHIPLET_DB_PATH` overrides the default `data/chiplet.db`) |
| `scripts/init_db.py` | Create DB, check seeds against the taxonomy, upsert seeds |
| `scripts/validate_company_master.py` | Live domain check + review workbook `data/review/company_master_review.xlsx` |

## Setup
```bash
pip install -r requirements.txt
python scripts/init_db.py --reset
python scripts/validate_company_master.py
```

`master_status`: `draft` → `validated` (primary domain passes and no open `needs_verification` items) → `signed_off` (set by a reviewer only).
