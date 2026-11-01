"""Shared SQLite connection and paths for the chiplet POC backend."""
import json
import os
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT / "db" / "schema.sql"
SEED_DIR = ROOT / "data" / "seed"
REVIEW_DIR = ROOT / "data" / "review"
DB_PATH = Path(os.environ.get("CHIPLET_DB_PATH", ROOT / "data" / "chiplet.db"))


def connect(path=DB_PATH):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def load_seed(name):
    with open(SEED_DIR / name, encoding="utf-8") as f:
        return json.load(f)


def to_json(value):
    return None if value is None else json.dumps(value, ensure_ascii=False)
