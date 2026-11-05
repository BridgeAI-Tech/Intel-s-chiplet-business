"""Write a read-only database snapshot for the deployed web app: web/data/chiplet.db.

Raw provider payloads stay in the full pipeline database (data/chiplet.db); the snapshot keeps every
structured record, every source document and its excerpts, and the raw-record metadata (provider,
endpoint, fetch time) so provenance is still visible.
"""
import shutil
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "chiplet.db"
DST = ROOT / "web" / "data" / "chiplet.db"


def main():
    DST.parent.mkdir(parents=True, exist_ok=True)
    src = sqlite3.connect(SRC)
    dst = sqlite3.connect(DST.with_suffix(".tmp"))
    src.backup(dst)
    src.close()
    dst.execute("UPDATE raw_provider_record SET response_json = '{}'")
    dst.commit()
    dst.execute("VACUUM")
    dst.close()
    shutil.move(DST.with_suffix(".tmp"), DST)
    print(f"Snapshot written: {DST} ({DST.stat().st_size / 1e6:.1f} MB)")
    # Curated selections the app shows alongside the records (copied so the web build stays self-contained).
    shutil.copy(ROOT / "data" / "seed" / "m2_shortlist.json", ROOT / "web" / "lib" / "m2-shortlist.json")
    shutil.copy(ROOT / "data" / "seed" / "m1_shortlist.json", ROOT / "web" / "lib" / "m1-shortlist.json")


if __name__ == "__main__":
    sys.exit(main())
