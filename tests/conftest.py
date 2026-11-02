import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))

from chiplet.db import SCHEMA_PATH, connect, load_seed  # noqa: E402
import init_db  # noqa: E402


@pytest.fixture
def conn(tmp_path):
    c = connect(tmp_path / "test.db")
    with c:
        c.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        init_db.load_taxonomy(c, load_seed("taxonomy.json"))
        init_db.load_companies(c, load_seed("company_master.json")["companies"])
        init_db.load_programmes(c, load_seed("programme_master.json")["programmes"])
    return c
