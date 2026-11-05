import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from m1_assessment import compute_outcome  # noqa: E402

CFG = json.loads((Path(__file__).resolve().parent.parent / "data/seed/scoring_config_v1.json").read_text(encoding="utf-8"))
DIMS = [d["key"] for d in CFG["dimensions"]]


def ratings(**over):
    return {k: {"rating": over.get(k, 3)} for k in DIMS}


def qual(q1="yes", q2="yes", q3="yes"):
    return {"q1": {"answer": q1}, "q2": {"answer": q2}, "q3": {"answer": q3}}


def test_brief_example_and_weights_sum():
    assert sum(d["weight"] for d in CFG["dimensions"]) == 100
    # Brief: a rating of 4/5 for custom-silicon activity contributes 20 points (4 / 5 x 25).
    base = compute_outcome(ratings(custom_silicon=1), qual(), CFG)[0]
    assert compute_outcome(ratings(custom_silicon=4), qual(), CFG)[0] - base == 15  # 20 - 5


def test_tiers():
    assert compute_outcome(ratings(**{k: 5 for k in DIMS}), qual(), CFG)[:2] == (100.0, 1)
    assert compute_outcome(ratings(**{k: 4 for k in DIMS}), qual(), CFG)[:2] == (80.0, 1)
    assert compute_outcome(ratings(), qual(), CFG)[:2] == (60.0, 3)
    assert compute_outcome(ratings(**{k: 1 for k in DIMS}), qual(), CFG)[:2] == (20.0, 4)


def test_qualification_outcomes():
    r = ratings()
    assert compute_outcome(r, qual(), CFG)[2] == "qualified"
    assert compute_outcome(r, qual(q3="needs_validation"), CFG)[2] == "conditional"
    assert compute_outcome(r, qual(q1="needs_validation"), CFG)[2] == "conditional"
    assert compute_outcome(r, qual(q1="no"), CFG)[2] == "not_qualified_q1"
    assert compute_outcome(r, qual(q2="no"), CFG)[2] == "not_qualified_fit"
