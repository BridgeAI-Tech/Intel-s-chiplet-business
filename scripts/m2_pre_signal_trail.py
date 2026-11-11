"""Pre-signal trail for Module 2 events (M2-4): earlier records that pointed towards each competitive event.

Fixed rules, existing verified records only (no provider or model calls). For an event by competitor X with
customer/partner Y on date D, the trail lists records dated before D:

  1. earlier X events naming the same customer/partner Y (prior news between the same parties);
  2. earlier X events on the same programme;
  3. Module 1 developments of Y that name X (the customer's side of the story);
  4. Module 1 supplier relationships between Y and X;
  5. Y's silicon job postings in the 180 days before D (a hiring build-up, shown as a count, never as intent).

Written to m2_competitive_event.pre_signal_trail as a JSON list of {type, id, date, title, rule}.

Usage: python scripts/m2_pre_signal_trail.py
"""
import json
import sys
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from chiplet.db import connect

LIVE = "record_status IN ('extracted', 'reviewed')"
MAX_ITEMS = 10
HIRING_DAYS = 180


def day(d):
    """A comparable date from 'YYYY', 'YYYY-MM' or 'YYYY-MM-DD' (start of the period)."""
    if not d:
        return None
    parts = (d + "-01-01")[:10] if len(d) < 10 else d[:10]
    try:
        return date.fromisoformat(parts if len(d) != 7 else d + "-01")
    except ValueError:
        return None


def main():
    conn = connect()
    events = conn.execute(f"""SELECT event_id, company_id, counterparty_company_id, counterparty_name, programme_id,
                                     COALESCE(event_date, publication_date) AS d, event_title
                              FROM m2_competitive_event WHERE {LIVE}""").fetchall()
    stats = Counter()
    with conn:
        for e in events:
            d = day(e["d"])
            trail = []
            if d:
                def before(rows, typ, rule, title_key="title", id_key="id"):
                    for r in rows:
                        rd = day(r["d"])
                        if rd and rd < d and r[id_key] != e["event_id"]:
                            trail.append({"type": typ, "id": r[id_key], "date": r["d"], "title": r[title_key], "rule": rule})
                if e["counterparty_name"]:
                    before(conn.execute(f"""SELECT event_id AS id, event_title AS title, COALESCE(event_date, publication_date) AS d
                                            FROM m2_competitive_event WHERE {LIVE} AND company_id = ? AND counterparty_name = ?""",
                                        (e["company_id"], e["counterparty_name"])), "m2_event", "earlier event with the same partner")
                if e["programme_id"]:
                    before(conn.execute(f"""SELECT event_id AS id, event_title AS title, COALESCE(event_date, publication_date) AS d
                                            FROM m2_competitive_event WHERE {LIVE} AND programme_id = ?""", (e["programme_id"],)),
                           "m2_event", "earlier event on the same programme")
                y = e["counterparty_company_id"]
                if y:
                    before(conn.execute(f"""SELECT signal_id AS id, title, COALESCE(event_date, publication_date) AS d
                                            FROM m1_signal WHERE {LIVE} AND company_id = ? AND counterparty_company_id = ?""",
                                        (y, e["company_id"])), "m1_signal", "partner's own development naming this competitor")
                    before(conn.execute("""SELECT r.relationship_id AS id, sp.name || ' (' || r.relationship_type || ')' AS title,
                                                  COALESCE(r.event_date, r.publication_date) AS d
                                           FROM company_relationship r JOIN supplier_partner_master sp USING (supplier_id)
                                           WHERE r.company_id = ? AND sp.company_id = ?""", (y, e["company_id"])),
                           "relationship", "supplier relationship already on record")
                    since = (d - timedelta(days=HIRING_DAYS)).isoformat()
                    n = conn.execute("""SELECT COUNT(*) FROM hiring_posting WHERE company_id = ?
                                        AND COALESCE(posting_date, first_observed_date) >= ?
                                        AND COALESCE(posting_date, first_observed_date) < ?""",
                                     (y, since, d.isoformat())).fetchone()[0]
                    if n >= 3:
                        trail.append({"type": "hiring", "id": y, "date": since, "count": n,
                                      "title": f"{n} silicon job postings in the {HIRING_DAYS} days before",
                                      "rule": "partner's hiring build-up (vacancies, not purchase intent)"})
            seen, uniq = set(), []
            for t in sorted(trail, key=lambda t: t["date"] or "", reverse=True):
                if (t["type"], t["id"]) not in seen:
                    seen.add((t["type"], t["id"]))
                    uniq.append(t)
            uniq = uniq[:MAX_ITEMS]
            stats["with trail" if uniq else "no earlier signal visible"] += 1
            conn.execute("UPDATE m2_competitive_event SET pre_signal_trail = ? WHERE event_id = ?",
                         (json.dumps(uniq) if uniq else None, e["event_id"]))
    print(f"{len(events)} events: " + ", ".join(f"{k} {v}" for k, v in stats.items()))


if __name__ == "__main__":
    main()
