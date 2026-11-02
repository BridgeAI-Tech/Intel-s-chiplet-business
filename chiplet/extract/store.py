"""Write source evidence with stable IDs. first_observed_date is set once and never moved later."""
from chiplet.extract.normalize import canonical_url, content_hash, parse_date, stable_id
from chiplet.sources.store import utc_now


def upsert_source(conn, *, url, source_type, source_name=None, title=None, publication_date=None,
                  event_date=None, excerpt=None, full_text=None, raw_record_id=None, screenshot_path=None):
    canon = canonical_url(url)
    source_id = stable_id("src", canon)
    today = utc_now()[:10]
    pub = parse_date(publication_date)
    evt = parse_date(event_date)
    with conn:
        conn.execute(
            """INSERT INTO source_evidence (source_id, url, canonical_url, source_type, source_name, title,
                   publication_date, event_date, collected_date, first_observed_date, excerpt, full_text,
                   content_hash, raw_record_id, screenshot_path)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT (source_id) DO UPDATE SET
                   collected_date = excluded.collected_date,
                   title = COALESCE(excluded.title, source_evidence.title),
                   source_name = COALESCE(excluded.source_name, source_evidence.source_name),
                   publication_date = COALESCE(source_evidence.publication_date, excluded.publication_date),
                   event_date = COALESCE(source_evidence.event_date, excluded.event_date),
                   excerpt = COALESCE(excluded.excerpt, source_evidence.excerpt),
                   full_text = COALESCE(excluded.full_text, source_evidence.full_text),
                   content_hash = COALESCE(excluded.content_hash, source_evidence.content_hash),
                   raw_record_id = COALESCE(excluded.raw_record_id, source_evidence.raw_record_id),
                   screenshot_path = COALESCE(excluded.screenshot_path, source_evidence.screenshot_path)""",
            (source_id, url, canon, source_type, source_name, title, pub.value if pub else None,
             evt.value if evt else None, today, today, excerpt, full_text,
             content_hash(full_text) if full_text else None, raw_record_id, screenshot_path),
        )
    return source_id
