"""Pipeline-run bookkeeping and raw-response storage shared by every source client.

Every provider response is written untouched to raw_provider_record. A request with the same
provider + endpoint + params is served from that table instead of the network (unless refresh=True),
so re-running a pipeline does not spend provider credits twice.
"""
import hashlib
import json
import os
import uuid
from datetime import datetime, timezone

from dotenv import load_dotenv

from chiplet.db import ROOT

load_dotenv(ROOT / ".env")


def utc_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def env(name):
    return os.environ.get(name, "").strip().strip('"')


class RawStore:
    def __init__(self, conn, pipeline, params=None):
        self.conn = conn
        self.run_id = f"run_{datetime.now(timezone.utc):%Y%m%d%H%M%S}_{uuid.uuid4().hex[:6]}"
        self.live_calls = 0
        self.cached_calls = 0
        with conn:
            conn.execute("INSERT INTO pipeline_run (run_id, pipeline, started_at, params) VALUES (?, ?, ?, ?)",
                         (self.run_id, pipeline, utc_now(), json.dumps(params or {})))

    @staticmethod
    def _key(provider, endpoint, params):
        blob = json.dumps([provider, endpoint, params], sort_keys=True, default=str)
        return "raw_" + hashlib.sha256(blob.encode()).hexdigest()[:32]

    def fetch(self, provider, endpoint, params, company_id, call, refresh=False):
        """call() -> (http_status, payload). Returns (http_status, payload, from_cache)."""
        raw_id = self._key(provider, endpoint, params)
        if not refresh:
            row = self.conn.execute(
                "SELECT http_status, response_json FROM raw_provider_record WHERE raw_record_id = ?", (raw_id,)
            ).fetchone()
            if row and row["http_status"] and row["http_status"] < 500:
                self.cached_calls += 1
                return row["http_status"], json.loads(row["response_json"]), True

        status, payload = call()
        self.live_calls += 1
        with self.conn:
            self.conn.execute(
                """INSERT INTO raw_provider_record
                       (raw_record_id, run_id, provider, endpoint, request_params, company_id, http_status,
                        response_json, fetched_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT (raw_record_id) DO UPDATE SET run_id = excluded.run_id,
                       http_status = excluded.http_status, response_json = excluded.response_json,
                       fetched_at = excluded.fetched_at""",
                (raw_id, self.run_id, provider, endpoint, json.dumps(params, sort_keys=True, default=str),
                 company_id, status, json.dumps(payload, ensure_ascii=False), utc_now()),
            )
        return status, payload, False

    def finish(self, status="succeeded", records_out=None, notes=None):
        with self.conn:
            self.conn.execute(
                """UPDATE pipeline_run SET finished_at = ?, status = ?, records_in = ?, records_out = ?, notes = ?
                   WHERE run_id = ?""",
                (utc_now(), status, self.live_calls + self.cached_calls, records_out, notes, self.run_id),
            )
