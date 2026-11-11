"""Re-apply the Module 2 counterparty rules to stored events (no provider calls).

  - one canonical name per customer/partner (normalize.canonical_party), linked to company_master where known;
  - when the event's excerpt does not name the party, keep a verbatim sentence from the same source that does
    (m2_competitive_event.counterparty_excerpt); with no such sentence the party is removed;
  - our own summary text uses the short display name (TSMC, not "Taiwan Semiconductor Manufacturing Company
    Limited"). Source excerpts are never changed: they must stay verbatim.

Usage: python scripts/m2_counterparties.py [--dry-run]
"""
import argparse
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from m2_events_pipeline import counterparty_fields

from chiplet.db import connect
from chiplet.extract.normalize import CompanyIndex


# Long legal names written into summaries -> the display name used everywhere in the UI.
SUMMARY_NAMES = [(re.compile(r'Taiwan Semiconductor Manufacturing Company(?: Limited| Ltd\.?)?(?:\s*\(\s*["“]?TSMC["”]?\s*\))?'), "TSMC")]


def short_names_in_summaries(conn):
    n = 0
    for table, key in (("m2_competitive_event", "event_id"), ("company_relationship", "relationship_id"),
                       ("m1_signal", "signal_id")):
        for k, text in conn.execute(f"SELECT {key}, summary FROM {table} WHERE summary LIKE '%Taiwan Semiconductor%'").fetchall():
            new = text
            for pat, short in SUMMARY_NAMES:
                new = pat.sub(short, new)
            if new != text:
                conn.execute(f"UPDATE {table} SET summary = ? WHERE {key} = ?", (new, k))
                n += 1
    return n


def ensure_column(conn):
    cols = {r[1] for r in conn.execute("PRAGMA table_info(m2_competitive_event)")}
    if "counterparty_excerpt" not in cols:
        conn.execute("ALTER TABLE m2_competitive_event ADD COLUMN counterparty_excerpt TEXT")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    conn = connect()
    ensure_column(conn)
    idx = CompanyIndex.load(conn)
    rows = conn.execute("""
        SELECT e.event_id, e.counterparty_name, rs.excerpt, se.full_text
        FROM m2_competitive_event e
        JOIN record_source rs ON rs.record_type = 'm2_event' AND rs.record_id = e.event_id AND rs.source_role = 'primary'
        JOIN source_evidence se ON se.source_id = rs.source_id
        WHERE e.counterparty_name IS NOT NULL""").fetchall()
    stats, renamed = Counter(), Counter()
    with conn:
        for r in rows:
            name, cp_id, extra = counterparty_fields(idx, r["counterparty_name"], r["excerpt"], r["full_text"])
            if name is None:
                stats["removed (not named anywhere in the source)"] += 1
            elif extra:
                stats["kept, extra sentence added"] += 1
            else:
                stats["kept, named in the excerpt"] += 1
            if name != r["counterparty_name"]:
                renamed[f"{r['counterparty_name']} -> {name}"] += 1
            if not args.dry_run:
                conn.execute("""UPDATE m2_competitive_event SET counterparty_name = ?, counterparty_company_id = ?,
                                counterparty_excerpt = ? WHERE event_id = ?""", (name, cp_id, extra, r["event_id"]))
        renamed_summaries = short_names_in_summaries(conn)
        if args.dry_run:
            conn.rollback()
    print(f"{len(rows)} events with a counterparty; {renamed_summaries} summaries shortened to display names")
    for k, v in stats.items():
        print(f"  {k}: {v}")
    print("Renamed:")
    for k, v in sorted(renamed.items()):
        print(f"  {k} ({v})")


if __name__ == "__main__":
    main()
