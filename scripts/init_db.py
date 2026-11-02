"""Create the shared database and load taxonomy, company master and programme master seeds.

Usage:
    python scripts/init_db.py            # create / upsert
    python scripts/init_db.py --reset    # drop the database file first

Re-running is safe: seeds are upserted and domain-validation results already stored are kept.
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from chiplet.db import DB_PATH, SCHEMA_PATH, connect, load_seed, to_json
from chiplet.extract.store import upsert_source


def check_seeds(taxonomy, companies, programmes):
    """Return a list of human-readable problems; empty means the seeds are consistent."""
    codes = {dim: {t["code"] for t in terms} for dim, terms in taxonomy.items()}
    errors = []
    company_ids = {c["company_id"] for c in companies}
    seen_domains = {}

    def check_code(dim, value, where):
        if value is not None and value not in codes[dim]:
            errors.append(f"{where}: '{value}' is not a {dim} code")

    for c in companies:
        where = c["company_id"]
        check_code("industry", c.get("industry"), where)
        check_code("value_chain_role", c.get("value_chain_role"), where)
        check_code("intel_relationship_status", c.get("intel_relationship_status"), where)
        for role in c["research_roles"]:
            check_code("research_role", role, where)
        if c.get("parent_company_id") and c["parent_company_id"] not in company_ids:
            errors.append(f"{where}: parent '{c['parent_company_id']}' not in company master")
        if c["entity_type"] not in ("company", "subsidiary", "business_unit"):
            errors.append(f"{where}: bad entity_type '{c['entity_type']}'")
        for v in c.get("verification", []):
            check_code("source_type", v.get("source_type"), f"{where} verification")
            if not (v.get("source_url") and v.get("excerpt") and v.get("fields")):
                errors.append(f"{where}: verification entry needs source_url, excerpt and fields")
            if v.get("evidence_class"):
                check_code("evidence_class", v["evidence_class"], f"{where} verification")
        for domain in [c["primary_domain"], *c.get("alt_domains", [])]:
            domain = domain.lower()
            if domain in seen_domains:
                errors.append(f"{where}: domain '{domain}' already used by {seen_domains[domain]}")
            seen_domains[domain] = where

    for p in programmes:
        where = p["programme_id"]
        if p["company_id"] not in company_ids:
            errors.append(f"{where}: company '{p['company_id']}' not in company master")
        check_code("programme_type", p["programme_type"], where)
        for tag in p.get("technology_tags", []):
            check_code("technology", tag, where)

    if len(company_ids) != len(companies):
        errors.append("duplicate company_id in company_master.json")
    return errors


def load_taxonomy(conn, taxonomy):
    for dimension, terms in taxonomy.items():
        for order, t in enumerate(terms):
            conn.execute(
                """INSERT INTO taxonomy_term (dimension, code, label, description, parent_code, aliases, sort_order)
                   VALUES (?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT (dimension, code) DO UPDATE SET
                     label = excluded.label, description = excluded.description,
                     parent_code = excluded.parent_code, aliases = excluded.aliases,
                     sort_order = excluded.sort_order""",
                (dimension, t["code"], t["label"], t.get("description"), t.get("parent_code"),
                 to_json(t.get("aliases")), order),
            )


def load_companies(conn, companies):
    # Parents first so the self-referencing foreign key is satisfied.
    ordered = sorted(companies, key=lambda c: c.get("parent_company_id") is not None)
    pending = list(ordered)
    loaded = set(r[0] for r in conn.execute("SELECT company_id FROM company_master"))
    while pending:
        progressed = False
        for c in list(pending):
            if c.get("parent_company_id") and c["parent_company_id"] not in loaded:
                continue
            conn.execute(
                """INSERT INTO company_master (
                       company_id, official_name, short_name, entity_type, primary_domain, alt_domains,
                       hq_country, hq_city, linkedin_url, linkedin_verified, parent_company_id, business_units,
                       industry, research_roles, value_chain_role, intel_relationship_status, in_module_1,
                       in_module_2, matching_notes, needs_verification)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT (company_id) DO UPDATE SET
                       official_name = excluded.official_name, short_name = excluded.short_name,
                       entity_type = excluded.entity_type, primary_domain = excluded.primary_domain,
                       alt_domains = excluded.alt_domains, hq_country = excluded.hq_country,
                       hq_city = excluded.hq_city, linkedin_url = excluded.linkedin_url,
                       linkedin_verified = excluded.linkedin_verified,
                       parent_company_id = excluded.parent_company_id, business_units = excluded.business_units,
                       industry = excluded.industry, research_roles = excluded.research_roles,
                       value_chain_role = excluded.value_chain_role,
                       intel_relationship_status = excluded.intel_relationship_status,
                       in_module_1 = excluded.in_module_1, in_module_2 = excluded.in_module_2,
                       matching_notes = excluded.matching_notes, needs_verification = excluded.needs_verification,
                       updated_at = datetime('now')""",
                (c["company_id"], c["official_name"], c["short_name"], c["entity_type"],
                 c["primary_domain"].lower(), to_json(c.get("alt_domains", [])), c.get("hq_country"),
                 c.get("hq_city"), c.get("linkedin_url"), c.get("linkedin_verified", 0), c.get("parent_company_id"),
                 to_json(c.get("business_units", [])), c.get("industry"), to_json(c["research_roles"]),
                 c.get("value_chain_role"), c.get("intel_relationship_status"), c["in_module_1"],
                 c["in_module_2"], c.get("matching_notes"), to_json(c.get("needs_verification", []))),
            )
            conn.execute("DELETE FROM company_alias WHERE company_id = ?", (c["company_id"],))
            for alias in {c["short_name"], c["official_name"], *c.get("aliases", [])}:
                conn.execute("INSERT OR IGNORE INTO company_alias (alias, company_id) VALUES (?, ?)",
                             (alias, c["company_id"]))
            loaded.add(c["company_id"])
            pending.remove(c)
            progressed = True
        if not progressed:
            raise RuntimeError(f"Unresolvable parent links: {[c['company_id'] for c in pending]}")


def load_verification(conn, companies):
    """Each verification entry becomes a source_evidence row linked to its company via record_source."""
    for c in companies:
        conn.execute("DELETE FROM record_source WHERE record_type = 'company' AND record_id = ?", (c["company_id"],))
        for v in c.get("verification", []):
            raw_id = v.get("raw_record_id")
            if raw_id and not conn.execute("SELECT 1 FROM raw_provider_record WHERE raw_record_id = ?", (raw_id,)).fetchone():
                raw_id = None           # fresh database: the provider payload is not stored locally
            source_id = upsert_source(conn, url=v["source_url"], source_type=v["source_type"],
                                      source_name=v.get("source_name"), publication_date=v.get("publication_date"),
                                      excerpt=v["excerpt"], raw_record_id=raw_id)
            conn.execute("""INSERT OR REPLACE INTO record_source (record_type, record_id, source_id, source_role, excerpt)
                            VALUES ('company', ?, ?, 'primary', ?)""",
                         (c["company_id"], source_id, json.dumps({"fields": v["fields"], "checked_at": v.get("checked_at"),
                                                                  "evidence_class": v.get("evidence_class"),
                                                                  "excerpt": v["excerpt"]}, ensure_ascii=False)))


def load_programmes(conn, programmes):
    for p in programmes:
        conn.execute(
            """INSERT INTO programme_master (
                   programme_id, company_id, name, programme_type, technology_tags, architecture,
                   process_node, packaging, competes_with_intel, aliases, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT (programme_id) DO UPDATE SET
                   company_id = excluded.company_id, name = excluded.name,
                   programme_type = excluded.programme_type, technology_tags = excluded.technology_tags,
                   architecture = excluded.architecture, process_node = excluded.process_node,
                   packaging = excluded.packaging, competes_with_intel = excluded.competes_with_intel,
                   aliases = excluded.aliases, notes = excluded.notes, updated_at = datetime('now')""",
            (p["programme_id"], p["company_id"], p["name"], p["programme_type"],
             to_json(p.get("technology_tags", [])), p.get("architecture"), p.get("process_node"),
             p.get("packaging"), p.get("competes_with_intel"), to_json(p.get("aliases", [])), p.get("notes")),
        )


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--reset", action="store_true", help="delete the database file before loading")
    args = parser.parse_args()

    taxonomy = load_seed("taxonomy.json")
    companies = load_seed("company_master.json")["companies"]
    programmes = load_seed("programme_master.json")["programmes"]

    errors = check_seeds(taxonomy, companies, programmes)
    if errors:
        print("Seed validation failed:")
        for e in errors:
            print("  -", e)
        sys.exit(1)

    if args.reset and DB_PATH.exists():
        DB_PATH.unlink()

    conn = connect()
    with conn:
        conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        load_taxonomy(conn, taxonomy)
        load_companies(conn, companies)
        load_programmes(conn, programmes)
    load_verification(conn, companies)
    conn.commit()

    counts = {t: conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
              for t in ("taxonomy_term", "company_master", "company_alias", "programme_master")}
    m1 = conn.execute("SELECT COUNT(*) FROM company_master WHERE in_module_1 = 1").fetchone()[0]
    m2 = conn.execute("SELECT COUNT(*) FROM company_master WHERE in_module_2 = 1").fetchone()[0]
    print(f"Database: {DB_PATH}")
    for table, n in counts.items():
        print(f"  {table:<18} {n}")
    print(f"  Module 1 companies {m1}, Module 2 entities {m2}")


if __name__ == "__main__":
    main()
