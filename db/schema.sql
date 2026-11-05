-- Intel Chiplet Market Signals POC — shared backend schema (Modules 1 & 2)
-- SQLite / libSQL compatible. JSON arrays are stored as TEXT.
-- Date convention: ISO-8601 (YYYY-MM-DD or full timestamp). event_date, publication_date
-- and first_observed_date are always kept as separate columns and never back-filled from each other.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Common taxonomy
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS taxonomy_term (
    dimension     TEXT NOT NULL,          -- e.g. hiring_role_category, m2_event_type, technology
    code          TEXT NOT NULL,
    label         TEXT NOT NULL,
    description   TEXT,
    parent_code   TEXT,                   -- grouping within a dimension (e.g. technology group)
    aliases       TEXT,                   -- JSON array of match terms / synonyms
    sort_order    INTEGER,
    PRIMARY KEY (dimension, code)
);

-- ---------------------------------------------------------------------------
-- Company master (shared by both modules)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_master (
    company_id                 TEXT PRIMARY KEY,      -- cmp_<slug>
    official_name              TEXT NOT NULL,
    short_name                 TEXT NOT NULL,
    entity_type                TEXT NOT NULL,         -- company | subsidiary | business_unit
    primary_domain             TEXT NOT NULL UNIQUE,  -- primary matching key across providers
    alt_domains                TEXT,                  -- JSON array
    hq_country                 TEXT,
    hq_city                    TEXT,
    linkedin_url               TEXT,
    linkedin_verified          INTEGER NOT NULL DEFAULT 0,
    parent_company_id          TEXT REFERENCES company_master(company_id),
    business_units             TEXT,                  -- JSON array
    industry                   TEXT,                  -- taxonomy: industry
    research_roles             TEXT NOT NULL,         -- JSON array, taxonomy: research_role
    value_chain_role           TEXT,                  -- taxonomy: value_chain_role (Module 2 lens)
    intel_relationship_status  TEXT,                  -- taxonomy: intel_relationship_status
    in_module_1                INTEGER NOT NULL DEFAULT 0,
    in_module_2                INTEGER NOT NULL DEFAULT 0,
    matching_notes             TEXT,                  -- domain / provider matching caveats
    needs_verification         TEXT,                  -- JSON array of fields still to confirm
    domain_status              TEXT NOT NULL DEFAULT 'unchecked', -- unchecked | ok | redirect_same_org | reachable_blocked | redirect_other | failed
    domain_final_url           TEXT,
    domain_checked_at          TEXT,
    master_status              TEXT NOT NULL DEFAULT 'draft',     -- draft | validated | signed_off
    created_at                 TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at                 TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Name variants used for deterministic entity matching in news / filings / jobs.
CREATE TABLE IF NOT EXISTS company_alias (
    alias        TEXT NOT NULL,                      -- case kept: "Arm" and "ARM" match differently
    company_id   TEXT NOT NULL REFERENCES company_master(company_id),
    PRIMARY KEY (alias, company_id)
);

-- ---------------------------------------------------------------------------
-- Programme / product master
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS programme_master (
    programme_id       TEXT PRIMARY KEY,               -- prg_<company>_<slug>
    company_id         TEXT NOT NULL REFERENCES company_master(company_id),
    name               TEXT NOT NULL,
    programme_type     TEXT NOT NULL,                  -- taxonomy: programme_type
    technology_tags    TEXT,                           -- JSON array, taxonomy: technology
    architecture       TEXT,                           -- only when disclosed
    process_node       TEXT,                           -- only when disclosed
    packaging          TEXT,                           -- only when disclosed
    competes_with_intel INTEGER,                       -- 1/0/NULL (unknown)
    aliases            TEXT,                           -- JSON array (generations, product names)
    notes              TEXT,
    record_status      TEXT NOT NULL DEFAULT 'draft',  -- draft | validated
    created_at         TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (company_id, name)
);

-- ---------------------------------------------------------------------------
-- Supplier / partner master and relationships
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS supplier_partner_master (
    supplier_id        TEXT PRIMARY KEY,               -- sup_<slug>
    company_id         TEXT REFERENCES company_master(company_id), -- set when also in company master
    name               TEXT NOT NULL,
    domain             TEXT,
    supplier_category  TEXT NOT NULL,                  -- taxonomy: supplier_category
    notes              TEXT,
    created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS company_relationship (
    relationship_id      TEXT PRIMARY KEY,             -- rel_<hash>
    company_id           TEXT NOT NULL REFERENCES company_master(company_id),
    supplier_id          TEXT NOT NULL REFERENCES supplier_partner_master(supplier_id),
    programme_id         TEXT REFERENCES programme_master(programme_id),
    relationship_type    TEXT NOT NULL,                -- taxonomy: relationship_type
    technology_tags      TEXT,                         -- JSON array
    commercial_stage     TEXT,                         -- taxonomy: commercial_stage
    evidence_class       TEXT NOT NULL CHECK (evidence_class IN ('confirmed_fact','corroborated_inference','press_released_intent')),
    event_date           TEXT,
    publication_date     TEXT,
    first_observed_date  TEXT,
    summary              TEXT,
    run_id               TEXT REFERENCES pipeline_run(run_id),
    created_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Provenance: pipeline runs, raw provider payloads, source evidence
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pipeline_run (
    run_id        TEXT PRIMARY KEY,
    pipeline      TEXT NOT NULL,                       -- firmographics | technographics | hiring | news | filings | supplier | m2_events
    started_at    TEXT NOT NULL,
    finished_at   TEXT,
    params        TEXT,                                -- JSON
    status        TEXT NOT NULL DEFAULT 'running',     -- running | succeeded | failed
    records_in    INTEGER,
    records_out   INTEGER,
    notes         TEXT
);

-- Untouched provider responses. Never deleted after normalisation.
CREATE TABLE IF NOT EXISTS raw_provider_record (
    raw_record_id   TEXT PRIMARY KEY,
    run_id          TEXT REFERENCES pipeline_run(run_id),
    provider        TEXT NOT NULL,                     -- explorium | predictleads | exa | google_news | sec_edgar | web
    endpoint        TEXT,
    request_params  TEXT,                              -- JSON
    company_id      TEXT REFERENCES company_master(company_id),
    http_status     INTEGER,
    response_json   TEXT NOT NULL,
    fetched_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source_evidence (
    source_id            TEXT PRIMARY KEY,             -- src_<hash of canonical_url>
    url                  TEXT NOT NULL,
    canonical_url        TEXT NOT NULL UNIQUE,
    source_type          TEXT NOT NULL,                -- taxonomy: source_type
    source_name          TEXT,                         -- publisher / site
    title                TEXT,
    publication_date     TEXT,
    event_date           TEXT,
    collected_date       TEXT NOT NULL,
    first_observed_date  TEXT NOT NULL,
    excerpt              TEXT,                         -- short supporting excerpt
    full_text            TEXT,                         -- cleaned text kept for RAG
    content_hash         TEXT,
    raw_record_id        TEXT REFERENCES raw_provider_record(raw_record_id),
    screenshot_path      TEXT,
    created_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Many-to-many link between any structured record and its evidence.
CREATE TABLE IF NOT EXISTS record_source (
    record_type   TEXT NOT NULL,                       -- m1_signal | m2_event | hiring_posting | relationship | assessment | company | programme
    record_id     TEXT NOT NULL,
    source_id     TEXT NOT NULL REFERENCES source_evidence(source_id),
    source_role   TEXT NOT NULL DEFAULT 'primary',     -- primary | corroborating
    excerpt       TEXT,                                -- excerpt specific to this record, if narrower than the source excerpt
    PRIMARY KEY (record_type, record_id, source_id)
);

-- ---------------------------------------------------------------------------
-- Module 1 records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hiring_posting (
    posting_id           TEXT PRIMARY KEY,
    company_id           TEXT NOT NULL REFERENCES company_master(company_id),
    programme_id         TEXT REFERENCES programme_master(programme_id),
    provider             TEXT NOT NULL,
    provider_job_id      TEXT,
    dedup_key            TEXT NOT NULL UNIQUE,         -- hash of normalised title + location + description
    original_title       TEXT NOT NULL,
    normalised_title     TEXT,
    job_function         TEXT,
    role_category        TEXT,                         -- taxonomy: hiring_role_category
    seniority            TEXT,                         -- taxonomy: seniority
    location             TEXT,
    department           TEXT,
    description_excerpt  TEXT,
    keywords             TEXT,                         -- JSON array of programme / technology keywords
    contract_type        TEXT,
    posting_date         TEXT,
    first_observed_date  TEXT NOT NULL,
    last_observed_date   TEXT,
    posting_status       TEXT,                         -- taxonomy: posting_status
    source_id            TEXT REFERENCES source_evidence(source_id),
    raw_record_id        TEXT REFERENCES raw_provider_record(raw_record_id),
    run_id               TEXT REFERENCES pipeline_run(run_id),
    created_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS m1_signal (
    signal_id                TEXT PRIMARY KEY,
    company_id               TEXT NOT NULL REFERENCES company_master(company_id),
    programme_id             TEXT REFERENCES programme_master(programme_id),
    signal_type              TEXT NOT NULL,            -- taxonomy: m1_signal_type
    title                    TEXT NOT NULL,
    summary                  TEXT,
    technology_tags          TEXT,                     -- JSON array
    counterparty_company_id  TEXT REFERENCES company_master(company_id),
    event_date               TEXT,
    publication_date         TEXT,
    first_observed_date      TEXT NOT NULL,
    evidence_class           TEXT NOT NULL CHECK (evidence_class IN ('confirmed_fact','corroborated_inference','press_released_intent')),
    extraction_method        TEXT NOT NULL,            -- deterministic | llm | manual
    extraction_model         TEXT,
    run_id                   TEXT REFERENCES pipeline_run(run_id),
    record_status            TEXT NOT NULL DEFAULT 'extracted', -- extracted | reviewed | rejected
    created_at               TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Module 2 records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS m2_competitive_event (
    event_id                 TEXT PRIMARY KEY,
    company_id               TEXT NOT NULL REFERENCES company_master(company_id),   -- competitor
    programme_id             TEXT REFERENCES programme_master(programme_id),
    event_title              TEXT NOT NULL,
    event_type               TEXT NOT NULL,            -- taxonomy: m2_event_type
    event_date               TEXT,
    publication_date         TEXT,
    first_observed_date      TEXT NOT NULL,
    counterparty_company_id  TEXT REFERENCES company_master(company_id),   -- customer / partner, when identified
    counterparty_name        TEXT,                     -- free text when not in master, or 'undisclosed'
    product_or_programme     TEXT,
    architecture_or_node     TEXT,
    packaging_or_interconnect TEXT,
    value_chain_role         TEXT,                     -- taxonomy: value_chain_role
    commercial_stage         TEXT,                     -- taxonomy: commercial_stage
    evidence_class           TEXT NOT NULL CHECK (evidence_class IN ('confirmed_fact','corroborated_inference','press_released_intent')),
    summary                  TEXT,
    pre_signal_trail         TEXT,                     -- JSON array of {record_type, record_id}
    extraction_method        TEXT NOT NULL,
    extraction_model         TEXT,
    run_id                   TEXT REFERENCES pipeline_run(run_id),
    record_status            TEXT NOT NULL DEFAULT 'extracted',
    created_at               TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Assessments (criteria and rulebook supplied by research side)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment (
    assessment_id        TEXT PRIMARY KEY,
    module               INTEGER NOT NULL CHECK (module IN (1, 2)),
    entity_type          TEXT NOT NULL,                -- company | programme | m2_event
    entity_id            TEXT NOT NULL,
    framework_version    TEXT NOT NULL,                -- version of the research rulebook applied
    criteria             TEXT,                         -- JSON {criterion: value}
    development_stage    TEXT,
    intel_relevance      TEXT,
    intel_offering_areas TEXT,                         -- JSON array, taxonomy: intel_offering_area
    implication          TEXT,
    competitive_response TEXT,
    priority             TEXT,
    confidence           TEXT,
    action_tag           TEXT,                         -- taxonomy: action_tag
    rationale            TEXT,
    assessed_by          TEXT,
    assessed_at          TEXT NOT NULL,
    status               TEXT NOT NULL DEFAULT 'draft' -- draft | reviewed
);

CREATE TABLE IF NOT EXISTS assessment_evidence (
    assessment_id  TEXT NOT NULL REFERENCES assessment(assessment_id),
    record_type    TEXT NOT NULL,
    record_id      TEXT NOT NULL,
    PRIMARY KEY (assessment_id, record_type, record_id)
);

-- ---------------------------------------------------------------------------
-- RAG index over structured records + evidence (filled in S6)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rag_chunk (
    chunk_id         TEXT PRIMARY KEY,
    record_type      TEXT NOT NULL,
    record_id        TEXT NOT NULL,
    source_id        TEXT REFERENCES source_evidence(source_id),
    company_id       TEXT REFERENCES company_master(company_id),
    chunk_text       TEXT NOT NULL,
    embedding        BLOB,
    embedding_model  TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS ix_programme_company   ON programme_master(company_id);
CREATE INDEX IF NOT EXISTS ix_raw_company         ON raw_provider_record(company_id, provider);
CREATE INDEX IF NOT EXISTS ix_hiring_company      ON hiring_posting(company_id, role_category);
CREATE INDEX IF NOT EXISTS ix_m1_company          ON m1_signal(company_id, signal_type);
CREATE INDEX IF NOT EXISTS ix_m2_company          ON m2_competitive_event(company_id, event_type);
CREATE INDEX IF NOT EXISTS ix_rel_company         ON company_relationship(company_id);
CREATE INDEX IF NOT EXISTS ix_record_source_src   ON record_source(source_id);
CREATE INDEX IF NOT EXISTS ix_rag_record          ON rag_chunk(record_type, record_id);

-- ---------------------------------------------------------------------------
-- Part 2: scoring, qualification and Intel portfolio mapping (docs/03_part2_scoring_qualification_mapping.md)
-- Ratings, stages and mappings are stored with the record IDs behind them; the overall score, tier and
-- qualification outcome are computed from the active scoring_config at read time, so editing the config
-- re-scores every company without re-running extraction.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scoring_config (
    version       TEXT PRIMARY KEY,
    config_json   TEXT NOT NULL,
    active        INTEGER NOT NULL DEFAULT 0,
    updated_at    TEXT NOT NULL,
    updated_by    TEXT
);

CREATE TABLE IF NOT EXISTS intel_offering (            -- Intel Portfolio & Technology Reference Database
    offering_id       TEXT PRIMARY KEY,
    dataset           TEXT NOT NULL,                   -- product | process | packaging | ip_design | ecosystem
    name              TEXT NOT NULL,
    mapping_category  TEXT NOT NULL,                   -- foundry_process | design_ip | advanced_packaging
    description       TEXT,
    applications      TEXT,
    status            TEXT,                            -- active | announced | legacy | unknown
    related_partners  TEXT,                            -- JSON array, as named in the source
    source_id         TEXT REFERENCES source_evidence(source_id),
    excerpt           TEXT NOT NULL,                   -- verbatim from the official source
    verified_date     TEXT NOT NULL,
    run_id            TEXT REFERENCES pipeline_run(run_id)
);

CREATE TABLE IF NOT EXISTS company_assessment (
    assessment_id               TEXT PRIMARY KEY,
    company_id                  TEXT NOT NULL REFERENCES company_master(company_id),
    framework_version           TEXT NOT NULL,
    custom_silicon_activity     TEXT,
    development_stage           INTEGER,
    stage_rationale             TEXT,
    stage_record_ids            TEXT,                  -- JSON array of "type:id"
    ratings                     TEXT NOT NULL,         -- JSON {dimension: {rating, rationale, record_ids, insufficient}}
    evidence_confidence         TEXT,                  -- high | medium | low (computed from cited records)
    primary_share               REAL,
    qualification               TEXT NOT NULL,         -- JSON {q1|q2|q3: {answer: yes|needs_validation|no, status, rationale, record_ids}}
    opportunity_interpretation  TEXT,
    checks                      TEXT,                  -- JSON list of deterministic adjustments applied
    model                       TEXT,
    run_id                      TEXT REFERENCES pipeline_run(run_id),
    assessed_at                 TEXT NOT NULL,
    status                      TEXT NOT NULL DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS portfolio_mapping (
    mapping_id          TEXT PRIMARY KEY,
    assessment_id       TEXT NOT NULL REFERENCES company_assessment(assessment_id),
    company_id          TEXT NOT NULL REFERENCES company_master(company_id),
    category            TEXT NOT NULL,                 -- foundry_process | design_ip | advanced_packaging
    activity            TEXT,
    requirement         TEXT,
    offering_id         TEXT REFERENCES intel_offering(offering_id),
    relevance           TEXT NOT NULL,                 -- direct_fit | adjacent_fit | no_identified_fit
    requirement_status  TEXT NOT NULL,                 -- confirmed | inferred | unverified
    rationale           TEXT,
    record_ids          TEXT                           -- JSON array of "type:id"
);
CREATE INDEX IF NOT EXISTS ix_assessment_company ON company_assessment(company_id);
CREATE INDEX IF NOT EXISTS ix_mapping_company ON portfolio_mapping(company_id);
