"""Brief section 12 RAG test (M1-9, M2-9): ask every example question through the running web app and check
each answer against the brief's RAG response requirements.

Checks per answer (automatic; a person still reads the answers in the report):
  cited      - the answer cites at least 2 stored records
  sourced    - every cited record has a source URL
  dated      - every cited record has a date
  classed    - the answer labels evidence (confirmed / announced plan / inference)
  no_intent  - no claim of buying intent / supplier selection without a qualifier

Output: data/review/rag_s12_test.md (questions, answers, cited sources, check results).

Usage: python scripts/rag_s12_test.py [--base http://localhost:3000]
"""
import argparse
import re
import sys
from datetime import date
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent

# Technical Implementation Brief (Part 1), section 12 "RAG Query Examples", verbatim.
QUESTIONS = {
    "Module 1": [
        "Which companies show the strongest evidence of building custom-silicon capabilities?",
        "What changes have occurred in engineering hiring and role mix over the last 12 months?",
        "Which companies show evidence of moving from early development towards external ecosystem engagement?",
        "What supplier relationships have been identified, and what is their reported status?",
        "Which companies have announced relevant technology or silicon-development milestones?",
        "What evidence supports the assessment of a particular company's potential relevance to Intel?",
    ],
    "Module 2": [
        "What are the most significant custom-silicon design wins announced in the last 12 months?",
        "Which companies are expanding advanced packaging or chiplet capabilities?",
        "What are the latest material developments involving Broadcom, Marvell and TSMC?",
        "Which competitive developments could be relevant to Intel's foundry or packaging offerings?",
        "What partnerships or ecosystem developments could affect Intel's competitive position?",
        "What is Arm's role in the chiplet ecosystem, and how does it differ from that of Intel's direct foundry competitors?",
    ],
}
CLASS_WORDS = re.compile(r"confirmed|announced|plan|intent|inference|inferred", re.I)
INTENT_CLAIM = re.compile(r"(will|plans? to|intends? to) (buy|purchase|select|choose) .{0,40}intel|selected intel|chose intel", re.I)


def run(base, q):
    r = requests.post(f"{base}/api/ask", json={"question": q}, timeout=300)
    r.raise_for_status()
    return r.json()


def check(res):
    srcs = res.get("sources") or []
    ans = res.get("answer") or ""
    return {
        "cited": len(srcs) >= 2,
        "sourced": bool(srcs) and all(s.get("url") for s in srcs),
        "dated": bool(srcs) and all(s.get("date") for s in srcs),
        "classed": bool(CLASS_WORDS.search(ans)),
        "no_intent": not INTENT_CLAIM.search(ans),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3000")
    args = ap.parse_args()
    out = [f"# Brief section 12 RAG test — {date.today().isoformat()}", "",
           "Each example question from the brief was asked through Ask Intelligence (`/api/ask`).", ""]
    summary, total, passed = [], 0, 0
    for module, qs in QUESTIONS.items():
        for i, q in enumerate(qs, 1):
            try:
                res = run(args.base, q)
            except Exception as e:
                res = {"answer": f"ERROR: {e}", "sources": []}
            c = check(res)
            ok = all(c.values())
            total += 1
            passed += ok
            summary.append(f"| {module} Q{i} | {'PASS' if ok else 'CHECK'} | " + " | ".join("yes" if v else "**no**" for v in c.values())
                           + f" | {len(res.get('sources') or [])} |")
            out += [f"## {module} Q{i}. {q}", "", res.get("answer", "").strip(), "", "**Cited sources:**", ""]
            for s in res.get("sources") or []:
                out.append(f"- [{s.get('ref')}] {s.get('company')} · {s.get('date') or 'undated'} · "
                           f"{s.get('evidence_class') or 'n/a'} · [{s.get('title')}]({s.get('url')})")
            out += ["", "Checks: " + ", ".join(f"{k} {'✓' if v else '✗'}" for k, v in c.items()), ""]
            print(f"{module} Q{i}: {'PASS' if ok else 'CHECK'} {c}", flush=True)
    head = ["## Result", "", f"**{passed} of {total} answers pass every automatic check.**", "",
            "| Question | Result | Cites ≥2 records | Every source has URL | Every source dated | Evidence class stated | No unsupported intent | Sources |",
            "| --- | --- | --- | --- | --- | --- | --- | --- |", *summary, ""]
    text = "\n".join(out[:4] + head + out[4:])
    path = ROOT / "data" / "review" / "rag_s12_test.md"
    path.write_text(text, encoding="utf-8")
    print(f"{passed}/{total} pass. Report: {path}")


if __name__ == "__main__":
    main()
