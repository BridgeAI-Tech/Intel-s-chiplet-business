"""Development stage per silicon programme (brief Part 2 stage model, applied per project instead of per company).

Fixed rules over the records already linked to each programme (no model call, nothing inferred):

  Stage 5  Supplier evaluation / commercial engagement - a foundry, packaging or design-partner relationship at
           sampling, production ramp or general availability, or a foundry/manufacturing development.
  Stage 4  External ecosystem engagement - any relationship with an external foundry, IP, EDA, memory or design
           partner, or a partnership / chiplet-packaging development.
  Stage 3  Active development - product/architecture, programme milestone or customer-deployment developments.
  Stage 2  Capability build - silicon job postings that name the programme.
  Stage 1  Early exploration - only announced plans, or no linked record.

Guard (brief: "do not assign a higher stage based on an isolated or unverified signal"): stage 4 or 5 needs at least
`min_supporting_records_above_stage_3` records at that level, including a confirmed fact; otherwise the next level
down is tried. Thresholds come from the active scoring_config.

Usage: python scripts/m1_programme_stage.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from chiplet.db import connect

LIVE = "record_status IN ('extracted', 'reviewed')"
LABELS = {1: "Early Exploration", 2: "Capability Build", 3: "Active Development", 4: "External Ecosystem Engagement",
          5: "Supplier Evaluation / Commercial Engagement"}
S5_SIGNALS = {"foundry_process_manufacturing", "manufacturing_capacity"}
S4_SIGNALS = {"partnership_ecosystem", "chiplet_advanced_packaging"}
S3_SIGNALS = {"product_architecture", "programme_milestone", "design_win_customer"}
S5_REL_TYPES = {"foundry_manufacturing", "design_partner", "packaging_assembly_test", "osat"}
S5_REL_STAGES = {"sampling_qualification", "production_ramp", "general_availability"}


def rules(conn):
    cfg = json.loads(conn.execute("SELECT config_json FROM scoring_config WHERE active = 1 ORDER BY updated_at DESC LIMIT 1")
                     .fetchone()["config_json"])
    r = cfg["stage_rules"]
    return r["min_supporting_records_above_stage_3"], r["require_confirmed_fact_above_stage_3"]


def main():
    conn = connect()
    conn.executescript(open(Path(__file__).resolve().parent.parent / "db" / "schema.sql", encoding="utf-8").read()
                       .split("-- Development stage per silicon programme")[1].split("CREATE TABLE IF NOT EXISTS m2_competitive_event")[0]
                       .split("\n", 2)[2])
    min_n, need_confirmed = rules(conn)
    programmes = conn.execute("""SELECT p.programme_id, p.company_id, p.name, p.aliases FROM programme_master p
                                 JOIN company_master c USING (company_id) WHERE c.in_module_1 = 1""").fetchall()
    rows = []
    for p in programmes:
        levels = {5: [], 4: [], 3: [], 2: [], 1: []}   # (record_id, confirmed?)
        for s in conn.execute(f"SELECT signal_id, signal_type, evidence_class FROM m1_signal WHERE programme_id = ? AND {LIVE}",
                              (p["programme_id"],)):
            confirmed = s["evidence_class"] == "confirmed_fact"
            lvl = 5 if s["signal_type"] in S5_SIGNALS else 4 if s["signal_type"] in S4_SIGNALS else \
                3 if s["signal_type"] in S3_SIGNALS else 1
            if not confirmed and lvl == 3:
                lvl = 1   # an announced product is a plan, not active development
            levels[lvl].append((f"sig:{s['signal_id']}", confirmed))
        for r in conn.execute("SELECT relationship_id, relationship_type, commercial_stage, evidence_class "
                              "FROM company_relationship WHERE programme_id = ?", (p["programme_id"],)):
            lvl = 5 if (r["relationship_type"] in S5_REL_TYPES and r["commercial_stage"] in S5_REL_STAGES) else 4
            levels[lvl].append((f"rel:{r['relationship_id']}", r["evidence_class"] == "confirmed_fact"))
        names = [p["name"].lower()] + [a.lower() for a in json.loads(p["aliases"] or "[]")]
        for j in conn.execute("SELECT posting_id, keywords, original_title FROM hiring_posting WHERE company_id = ?",
                              (p["company_id"],)):
            text = (" ".join(json.loads(j["keywords"] or "[]")) + " " + (j["original_title"] or "")).lower()
            if any(n and n in text for n in names):
                levels[2].append((f"job:{j['posting_id']}", True))

        if not any(levels.values()):
            continue   # no linked record: the stage is unknown, not "early exploration"
        stage, why = 1, "Only announced plans are linked to this programme."
        for lvl in (5, 4):
            recs = levels[lvl]
            if len(recs) >= min_n and (not need_confirmed or any(c for _, c in recs)):
                stage = lvl
                break
        else:
            stage = 3 if levels[3] else 2 if levels[2] else 1
        if stage in (5, 4):
            why = (f"{len(levels[stage])} linked records at this level, "
                   f"{sum(c for _, c in levels[stage])} of them confirmed.")
        elif stage == 3:
            held = [l for l in (5, 4) if levels[l]]
            why = f"{len(levels[3])} confirmed product or milestone records." + (
                f" Higher-level records exist ({', '.join(str(len(levels[l])) + ' at stage ' + str(l) for l in held)}) "
                f"but fewer than {min_n} or none confirmed, so they do not lift the stage." if held else "")
        elif stage == 2:
            why = f"{len(levels[2])} silicon job postings name the programme; no confirmed development records."
        record_ids = [rid for rid, _ in levels[stage]][:40] if stage > 1 else [rid for rid, _ in levels[1]][:40]
        evidence = {str(k): len(v) for k, v in levels.items()}
        rows.append((p["programme_id"], p["company_id"], stage, LABELS[stage], why, json.dumps(record_ids), json.dumps(evidence)))

    with conn:
        conn.execute("DELETE FROM programme_stage")
        conn.executemany("""INSERT INTO programme_stage (programme_id, company_id, stage, stage_label, rationale, record_ids,
                            evidence) VALUES (?, ?, ?, ?, ?, ?, ?)""", rows)
    for pid, cid, stage, label, why, _, ev in sorted(rows, key=lambda r: (r[1], -r[2])):
        print(f"{cid:24} {pid:40} stage {stage} {label:45} {ev}")


if __name__ == "__main__":
    main()
