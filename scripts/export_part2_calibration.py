"""Part 2 calibration workbook for the research team (framework v1 results + reviewer override columns).

Usage: python scripts/export_part2_calibration.py data/chiplet.db data/review/part2_calibration_v1.xlsx
Every rating, answer and mapping comes from company_assessment / portfolio_mapping; every evidence row resolves to the
stored source URL and verbatim excerpt. The Calibration tab recomputes the score live from the Weights tab, so the
reviewer can try new ratings or weights in Excel before changing them in the app's Settings page.
"""
import json
import sqlite3
import sys
from collections import Counter
from pathlib import Path

from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

DB, OUT = sys.argv[1], sys.argv[2]
conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row
cfg_row = conn.execute("SELECT version, config_json FROM scoring_config WHERE active = 1").fetchone()
cfg = json.loads(cfg_row["config_json"])
DIMS = cfg["dimensions"]
TIERS = sorted(cfg["tiers"], key=lambda t: t["tier"])

F = Font(name="Arial", size=10)
FB = Font(name="Arial", size=10, bold=True)
FH = Font(name="Arial", size=10, bold=True, color="FFFFFF")
FT = Font(name="Arial", size=14, bold=True)
FBLUE = Font(name="Arial", size=10, color="0000FF")
HEAD = PatternFill("solid", fgColor="0068B5")
INPUT = PatternFill("solid", fgColor="FFFF00")
GREY = PatternFill("solid", fgColor="F2F4F7")
thin = Side(style="thin", color="D9DEE5")
B = Border(left=thin, right=thin, top=thin, bottom=thin)
WRAP = Alignment(wrap_text=True, vertical="top")
CENTER = Alignment(horizontal="center", vertical="top", wrap_text=True)

OUTCOME = {"qualified": "Qualified", "conditional": "Conditional", "not_qualified_q1": "Not Qualified (fails Q1)",
           "not_qualified_fit": "Not Qualified (no fit)"}
ANSWER = {"yes": "Yes", "needs_validation": "Needs validation", "no": "No"}
REL = {"direct_fit": "Direct Fit", "adjacent_fit": "Adjacent / Close Fit", "no_identified_fit": "No Identified Fit"}
CAT = {c["key"]: c["label"] for c in cfg["mapping"]["categories"]}


def compute(ratings, qual):
    score = sum(ratings[d["key"]]["rating"] / 5 * d["weight"] for d in DIMS)
    tier = next(t["tier"] for t in sorted(TIERS, key=lambda t: -t["min_score"]) if score >= t["min_score"])
    q = {k: v["answer"] for k, v in qual.items()}
    if q["q1"] == "no":
        out = "not_qualified_q1"
    elif q["q2"] == "no" or q["q3"] == "no":
        out = "not_qualified_fit"
    elif q["q1"] == q["q2"] == q["q3"] == "yes":
        out = "qualified"
    else:
        out = "conditional"
    return round(score, 1), tier, out


rows = []
for r in conn.execute("""SELECT a.*, c.short_name FROM company_assessment a JOIN company_master c USING (company_id)
                         WHERE a.framework_version = ? ORDER BY c.short_name""", (cfg_row["version"],)):
    ratings, qual = json.loads(r["ratings"]), json.loads(r["qualification"])
    score, tier, out = compute(ratings, qual)
    maps = conn.execute("""SELECT m.*, o.name AS offering, se.url AS offering_url FROM portfolio_mapping m
                           LEFT JOIN intel_offering o USING (offering_id) LEFT JOIN source_evidence se ON se.source_id = o.source_id
                           WHERE m.assessment_id = ? ORDER BY m.category""", (r["assessment_id"],)).fetchall()
    rows.append(dict(r=r, ratings=ratings, qual=qual, score=score, tier=tier, outcome=out, maps=maps))

# Shortlist order mirrors web/lib/scoring.ts rank()
CONF = {"high": 3, "medium": 2, "low": 1}
FIT = {"direct_fit": 2, "adjacent_fit": 1, "no_identified_fit": 0}
OUT_RANK = {"qualified": 0, "conditional": 1}
rows.sort(key=lambda x: (OUT_RANK.get(x["outcome"], 2), -x["score"], -(x["r"]["development_stage"] or 0),
                         -CONF.get(x["r"]["evidence_confidence"], 0), -sum(FIT.get(m["relevance"], 0) for m in x["maps"])))
scored_top = [x["r"]["company_id"] for x in rows if x["outcome"] == "qualified"][: cfg["shortlist"]["shortlist_max"]]
BRIEF = json.load(open(Path(__file__).resolve().parent.parent / "data/seed/m1_shortlist.json", encoding="utf-8"))
shortlist = BRIEF["companies"]   # active shortlist: the brief's preliminary shortlist (Section 7)


def resolve(cid, rid):
    """(label, date, evidence class, url, verbatim excerpt) for a cited record id."""
    kind, _, key = rid.partition(":")
    if kind == "sig":
        x = conn.execute("""SELECT s.title, COALESCE(s.event_date, s.publication_date) d, s.evidence_class, se.url, rs.excerpt
                            FROM m1_signal s LEFT JOIN record_source rs ON rs.record_type = 'm1_signal' AND rs.record_id = s.signal_id
                            AND rs.source_role = 'primary' LEFT JOIN source_evidence se ON se.source_id = rs.source_id
                            WHERE s.signal_id = ?""", (key,)).fetchone()
        return (x["title"], x["d"], x["evidence_class"], x["url"], x["excerpt"]) if x else (rid, None, None, None, None)
    if kind == "rel":
        x = conn.execute("""SELECT sp.name, r.relationship_type, COALESCE(r.event_date, r.publication_date) d, r.evidence_class,
                                   se.url, rs.excerpt
                            FROM company_relationship r JOIN supplier_partner_master sp USING (supplier_id)
                            LEFT JOIN record_source rs ON rs.record_type = 'relationship' AND rs.record_id = r.relationship_id
                            AND rs.source_role = 'primary' LEFT JOIN source_evidence se ON se.source_id = rs.source_id
                            WHERE r.relationship_id = ?""", (key,)).fetchone()
        if x:
            return (f"Relationship with {x['name']} ({x['relationship_type'].replace('_', ' ')})", x["d"], x["evidence_class"], x["url"], x["excerpt"])
        return (rid, None, None, None, None)
    if rid == "hiring:engineering_roles":
        n = conn.execute("SELECT COUNT(*) FROM hiring_posting WHERE company_id = ?", (cid,)).fetchone()[0]
        return (f"Silicon job postings collected ({n})", None, None, None, None)
    if rid == "intel:intel_relationship":
        return ("Intel relationship evidence (company profile)", None, None, None, None)
    return (rid, None, None, None, None)


def header(ws, cols, row=1):
    for i, (name, width) in enumerate(cols, 1):
        c = ws.cell(row=row, column=i, value=name)
        c.font, c.fill, c.alignment, c.border = FH, HEAD, CENTER, B
        ws.column_dimensions[get_column_letter(i)].width = width
    ws.freeze_panes = ws.cell(row=row + 1, column=3)
    ws.row_dimensions[row].height = 42


def put(ws, row, col, value, font=F, fill=None, align=WRAP):
    c = ws.cell(row=row, column=col, value=value)
    c.font, c.alignment, c.border = font, align, B
    if fill:
        c.fill = fill
    return c


wb = Workbook()

# --- How to use --------------------------------------------------------------------------------------------------
ws = wb.active
ws.title = "How to use"
ws.column_dimensions["A"].width = 120
n = len(rows)
qual_n = sum(x["outcome"] == "qualified" for x in rows)
lines = [
    ("Intel Chiplet Market Signals — Part 2 calibration pack (framework " + cfg_row["version"] + ")", FT),
    ("", F),
    (f"What this is: the research framework (scoring, development stage, qualification, Intel portfolio mapping) applied to the "
     f"{n} screened Module 1 companies. Ratings were drafted by the AI against the framework, then rule-checked in code; "
     f"every rating cites stored records, and every record links to its source URL and verbatim excerpt.", F),
    ("", F),
    ("Tabs", FB),
    ("1. Calibration — one row per company. AI ratings (grey) and your override columns (yellow). Score and tier recalculate live.", F),
    ("2. Weights & tiers — the v1 weights and tier thresholds (yellow, editable). Changing them recalculates the Calibration tab.", F),
    ("3. Rating evidence — every dimension rating with the AI rationale and each cited record (date, evidence class, URL, excerpt).", F),
    ("4. Qualification — Q1/Q2/Q3 answers, requirement status and rationale per company, with an override column.", F),
    ("5. Intel mapping — Foundry / Design-IP / Packaging mapping per company with the specific Intel offering and its official page.", F),
    ("6. Stage — development stage (1–5) with rationale and the records behind it.", F),
    ("7. Observations — patterns in the v1 results and the calibration questions we need your decision on.", F),
    ("", F),
    ("How to review", FB),
    ("• Enter a rating (1–5) in a yellow 'Your rating' cell only where you disagree; blank keeps the AI rating.", F),
    ("• 'Calibrated score' uses your rating where given, otherwise the AI rating, with the weights on the Weights & tiers tab.", F),
    ("• Try weight or tier changes on the Weights & tiers tab; agreed values are then saved in the web app at /settings as a new version (v1.1).", F),
    ("• Add comments in the 'Reviewer comments' columns; answer the questions on the Observations tab.", F),
    ("", F),
    ("Status: draft. Nothing here is a confirmed Intel opportunity — mappings show potential alignment, not procurement intent.", FB),
]
for i, (t, f) in enumerate(lines, 1):
    c = ws.cell(row=i, column=1, value=t)
    c.font, c.alignment = f, Alignment(wrap_text=True, vertical="top")

# --- Weights & tiers ---------------------------------------------------------------------------------------------
wt = wb.create_sheet("Weights & tiers")
header(wt, [("Dimension", 46), ("Weight (%)", 12), ("What it evaluates", 80)])
wt.freeze_panes = "A2"
for i, d in enumerate(DIMS, 2):
    put(wt, i, 1, d["label"], FB)
    put(wt, i, 2, d["weight"], FBLUE, INPUT, CENTER)
    put(wt, i, 3, d.get("evaluate", ""))
tot = len(DIMS) + 2
put(wt, tot, 1, "Total (must be 100)", FB)
put(wt, tot, 2, f"=SUM(B2:B{tot - 1})", FB, None, CENTER)
wt.conditional_formatting.add(f"B{tot}", FormulaRule(formula=[f"B{tot}<>100"], fill=PatternFill("solid", fgColor="F8CBAD")))
trow = tot + 2
for j, (name, w) in enumerate([("Tier", 46), ("Minimum score", 12), ("Meaning", 80)], 1):
    c = wt.cell(row=trow, column=j, value=name)
    c.font, c.fill, c.alignment, c.border = FH, HEAD, CENTER, B
TIER_CELLS = {}
for k, t in enumerate(TIERS, trow + 1):
    put(wt, k, 1, f"Tier {t['tier']}", FB)
    if t["tier"] == len(TIERS):
        put(wt, k, 2, 0, F, GREY, CENTER)
    else:
        put(wt, k, 2, t["min_score"], FBLUE, INPUT, CENTER)
    put(wt, k, 3, t["label"])
    TIER_CELLS[t["tier"]] = f"'Weights & tiers'!$B${k}"
srow = trow + len(TIERS) + 2
put(wt, srow, 1, "Rating scale", FB)
for k, r in enumerate(cfg["rating_scale"], srow + 1):
    put(wt, k, 1, f"{r['rating']} — {r['label']}", FB)
    put(wt, k, 3, r["meaning"])
WEIGHT = {d["key"]: f"'Weights & tiers'!$B${i}" for i, d in enumerate(DIMS, 2)}

# --- Calibration -------------------------------------------------------------------------------------------------
wc = wb.create_sheet("Calibration", 1)
cols = [("#", 4), ("Company", 18), ("Stage (1–5)", 8), ("Evidence confidence", 11), ("Qualification (AI)", 14),
        ("On shortlist (brief §7)", 10), ("Score-based top 5", 9), ("AI score /100", 9), ("AI tier", 7)]
for d in DIMS:
    cols += [(f"AI: {d['label']}", 12), (f"Your rating: {d['label']}", 12)]
cols += [("Calibrated score /100", 11), ("Calibrated tier", 9), ("Change vs AI", 9), ("Reviewer comments", 40)]
header(wc, cols)
dv = DataValidation(type="whole", operator="between", formula1="1", formula2="5", allow_blank=True,
                    error="Enter a whole number from 1 to 5, or leave blank to keep the AI rating.")
wc.add_data_validation(dv)
first_dim_col = 10
for i, x in enumerate(rows, 2):
    r = x["r"]
    put(wc, i, 1, i - 1, F, None, CENTER)
    put(wc, i, 2, r["short_name"], FB)
    put(wc, i, 3, r["development_stage"], F, None, CENTER)
    put(wc, i, 4, (r["evidence_confidence"] or "").capitalize(), F, None, CENTER)
    put(wc, i, 5, OUTCOME[x["outcome"]], F, None, CENTER)
    tag = "Yes — deep dive" if r["company_id"] == BRIEF["deep_dive"] else "Yes — alternative" if r["company_id"] == BRIEF["deep_dive_alternative"] else "Yes"
    put(wc, i, 6, tag if r["company_id"] in shortlist else "", FB, None, CENTER)
    put(wc, i, 7, "Yes" if r["company_id"] in scored_top else "", F, None, CENTER)
    ai_terms, cal_terms = [], []
    for j, d in enumerate(DIMS):
        ca, cy = first_dim_col + 2 * j, first_dim_col + 2 * j + 1
        rt = x["ratings"][d["key"]]
        put(wc, i, ca, rt["rating"], F, GREY, CENTER)
        if rt.get("insufficient"):
            wc.cell(row=i, column=ca).value = rt["rating"]
            wc.cell(row=i, column=ca).font = Font(name="Arial", size=10, italic=True, color="C00000")
        yc = put(wc, i, cy, None, FBLUE, INPUT, CENTER)
        dv.add(yc)
        a, y = f"{get_column_letter(ca)}{i}", f"{get_column_letter(cy)}{i}"
        ai_terms.append(f"{a}/5*{WEIGHT[d['key']]}")
        cal_terms.append(f"IF({y}=\"\",{a},{y})/5*{WEIGHT[d['key']]}")
    tier_formula = lambda cell: (f"=IF({cell}>={TIER_CELLS[1]},1,IF({cell}>={TIER_CELLS[2]},2,IF({cell}>={TIER_CELLS[3]},3,4)))")
    put(wc, i, 8, "=ROUND(" + "+".join(ai_terms) + ",1)", FB, None, CENTER)
    put(wc, i, 9, tier_formula(f"H{i}"), F, None, CENTER)
    sc = first_dim_col + 2 * len(DIMS)
    put(wc, i, sc, "=ROUND(" + "+".join(cal_terms) + ",1)", FB, None, CENTER)
    put(wc, i, sc + 1, tier_formula(f"{get_column_letter(sc)}{i}"), F, None, CENTER)
    put(wc, i, sc + 2, f"={get_column_letter(sc)}{i}-H{i}", F, None, CENTER)
    put(wc, i, sc + 3, None, F, INPUT)
last = len(rows) + 1
note = last + 2
wc.cell(row=note, column=2, value="Red italic AI rating = hiring dimension flagged 'insufficient data' (no job postings collected for that company). Hiring for Meta, Microsoft, Google, Apple, IBM, Cisco, Nokia and Samsung is from a recent sample of about 20 postings.").font = Font(name="Arial", size=9, italic=True, color="C00000")
wc.cell(row=note + 1, column=2, value="On shortlist = the brief's preliminary shortlist (Section 7). Score-based top 5 = top Qualified by AI v1 score, for reference. Change qualification answers on the Qualification tab.").font = Font(name="Arial", size=9, italic=True)
wc.cell(row=note + 2, column=2, value="Average AI score").font = FB
wc.cell(row=note + 2, column=8, value=f"=ROUND(AVERAGE(H2:H{last}),1)").font = FB
sc_letter = get_column_letter(first_dim_col + 2 * len(DIMS))
wc.cell(row=note + 2, column=first_dim_col + 2 * len(DIMS), value=f"=ROUND(AVERAGE({sc_letter}2:{sc_letter}{last}),1)").font = FB

# --- Rating evidence ---------------------------------------------------------------------------------------------
we = wb.create_sheet("Rating evidence")
header(we, [("Company", 16), ("Dimension", 26), ("AI rating", 8), ("AI rationale", 60), ("Rule check applied", 30),
            ("Cited record", 40), ("Record date", 11), ("Evidence class", 16), ("Source URL", 40),
            ("Verbatim excerpt", 70), ("Reviewer comments", 30)])
row = 2
for x in sorted(rows, key=lambda x: x["r"]["short_name"]):
    r = x["r"]
    checks = json.loads(r["checks"] or "[]")
    for d in DIMS:
        rt = x["ratings"][d["key"]]
        rule = "; ".join(c for c in checks if c.startswith(d["key"]))
        cited = rt.get("record_ids") or [None]
        for k, rid in enumerate(cited):
            label, date, cls, url, exc = resolve(r["company_id"], rid) if rid else ("(no record cited)", None, None, None, None)
            vals = [r["short_name"], d["label"], rt["rating"], rt.get("rationale") if k == 0 else "", rule if k == 0 else "",
                    label, date, (cls or "").replace("_", " "), url, exc, None]
            for col, v in enumerate(vals, 1):
                c = put(we, row, col, v, FB if col == 1 else F, INPUT if col == 11 else None, CENTER if col == 3 else WRAP)
                if col == 9 and url:
                    c.hyperlink, c.font = url, Font(name="Arial", size=10, color="0563C1", underline="single")
            row += 1
we.auto_filter.ref = f"A1:K{row - 1}"

# --- Qualification -----------------------------------------------------------------------------------------------
wq = wb.create_sheet("Qualification")
header(wq, [("Company", 16), ("Question", 30), ("AI answer", 14), ("Requirement status", 12), ("AI rationale", 70),
            ("Cited records", 50), ("Your answer (Yes / Needs validation / No)", 16), ("Reviewer comments", 30)])
dq = DataValidation(type="list", formula1='"Yes,Needs validation,No"', allow_blank=True)
wq.add_data_validation(dq)
row = 2
QLABEL = {q["key"]: f"{q['key'].upper()} {q['label']}" for q in cfg["qualification"]["questions"]}
for x in sorted(rows, key=lambda x: x["r"]["short_name"]):
    for qk in ("q1", "q2", "q3"):
        q = x["qual"][qk]
        recs = "\n".join(f"• {resolve(x['r']['company_id'], rid)[0]}" for rid in q.get("record_ids") or [])
        vals = [x["r"]["short_name"], QLABEL[qk], ANSWER.get(q["answer"], q["answer"]),
                (q.get("requirement_status") or "").capitalize(), q.get("rationale"), recs or "(none cited)"]
        for col, v in enumerate(vals, 1):
            put(wq, row, col, v, FB if col == 1 else F)
        dq.add(put(wq, row, 7, None, FBLUE, INPUT, CENTER))
        put(wq, row, 8, None, F, INPUT)
        row += 1
    put(wq, row, 1, x["r"]["short_name"], FB, GREY)
    put(wq, row, 2, "Outcome (AI v1)", FB, GREY)
    put(wq, row, 3, OUTCOME[x["outcome"]], FB, GREY)
    for col in range(4, 9):
        put(wq, row, col, None, F, GREY)
    row += 1

# --- Intel mapping -----------------------------------------------------------------------------------------------
wm = wb.create_sheet("Intel mapping")
header(wm, [("Company", 16), ("Category", 22), ("Activity / initiative", 50), ("Requirement", 40), ("Intel offering", 26),
            ("Relevance", 14), ("Requirement status", 12), ("Rationale", 60), ("Intel source page", 36),
            ("Cited records", 44), ("Your relevance (Direct / Adjacent / None)", 16), ("Reviewer comments", 30)])
dm = DataValidation(type="list", formula1='"Direct Fit,Adjacent / Close Fit,No Identified Fit"', allow_blank=True)
wm.add_data_validation(dm)
row = 2
for x in sorted(rows, key=lambda x: x["r"]["short_name"]):
    for m in x["maps"]:
        recs = "\n".join(f"• {resolve(x['r']['company_id'], rid)[0]}" for rid in json.loads(m["record_ids"] or "[]"))
        vals = [x["r"]["short_name"], CAT.get(m["category"], m["category"]), m["activity"], m["requirement"],
                m["offering"] or "—", REL.get(m["relevance"], m["relevance"]), (m["requirement_status"] or "").capitalize(),
                m["rationale"], m["offering_url"], recs or "(none cited)"]
        for col, v in enumerate(vals, 1):
            c = put(wm, row, col, v, FB if col == 1 else F)
            if col == 9 and v:
                c.hyperlink, c.font = v, Font(name="Arial", size=10, color="0563C1", underline="single")
        dm.add(put(wm, row, 11, None, FBLUE, INPUT, CENTER))
        put(wm, row, 12, None, F, INPUT)
        row += 1
wm.auto_filter.ref = f"A1:L{row - 1}"

# --- Stage -------------------------------------------------------------------------------------------------------
wsg = wb.create_sheet("Stage")
header(wsg, [("Company", 16), ("AI stage", 8), ("Stage name", 24), ("Custom-silicon activity", 60), ("Stage rationale", 70),
             ("Records behind the stage", 50), ("Your stage (1–5)", 10), ("Reviewer comments", 30)])
STAGE = {s["stage"]: s["label"] for s in cfg["development_stages"]}
ds = DataValidation(type="whole", operator="between", formula1="1", formula2="5", allow_blank=True)
wsg.add_data_validation(ds)
for i, x in enumerate(sorted(rows, key=lambda x: x["r"]["short_name"]), 2):
    r = x["r"]
    recs = "\n".join(f"• {resolve(r['company_id'], rid)[0]}" for rid in json.loads(r["stage_record_ids"] or "[]"))
    for col, v in enumerate([r["short_name"], r["development_stage"], STAGE.get(r["development_stage"], ""),
                             r["custom_silicon_activity"], r["stage_rationale"], recs], 1):
        put(wsg, i, col, v, FB if col == 1 else F, None, CENTER if col == 2 else WRAP)
    ds.add(put(wsg, i, 7, None, FBLUE, INPUT, CENTER))
    put(wsg, i, 8, None, F, INPUT)

# --- Observations ------------------------------------------------------------------------------------------------
wo = wb.create_sheet("Observations")
wo.column_dimensions["A"].width = 6
wo.column_dimensions["B"].width = 100
wo.column_dimensions["C"].width = 50
dist = {d["key"]: Counter(x["ratings"][d["key"]]["rating"] for x in rows) for d in DIMS}
insufficient = [x["r"]["short_name"] for x in rows if x["ratings"]["engineering_hiring"].get("insufficient")]
stage5 = sum(x["r"]["development_stage"] == 5 for x in rows)
cond = [x["r"]["short_name"] for x in rows if x["outcome"] == "conditional"]
tier1 = sum(x["tier"] == 1 for x in rows)
scores = [x["score"] for x in rows]


FULL_PULL = {"cmp_aws", "cmp_cerebras", "cmp_tesla", "cmp_tenstorrent"}
sampled = [x["r"]["short_name"] for x in rows if x["r"]["company_id"] not in FULL_PULL]
hiring_note = (f"Hiring data: full 12-month job pulls for AWS, Cerebras, Tesla and Tenstorrent (PredictLeads, amazon.jobs); for "
               f"{', '.join(sampled)} a recent sample of about 20 silicon postings each (TheirStack), with the provider's total count "
               f"given to the assessment. 'Insufficient data' flags: {len(insufficient) or 'none'}.")
ARCHIVE = Path(__file__).resolve().parent.parent / "data/archive/assessment_v1_all_before_theirstack_hiring.json"
drift = []
if ARCHIVE.exists():
    before = json.load(open(ARCHIVE, encoding="utf-8"))
    for x in rows:
        o = before.get(x["r"]["company_id"])
        if not o:
            continue
        ro = json.loads(o["ratings"])
        moved = [f"{d['label'].split(' ')[0]} {ro[d['key']]['rating']}→{x['ratings'][d['key']]['rating']}" for d in DIMS
                 if d["key"] != "engineering_hiring" and ro[d["key"]]["rating"] != x["ratings"][d["key"]]["rating"]]
        if o["development_stage"] != x["r"]["development_stage"]:
            moved.append(f"stage {o['development_stage']}→{x['r']['development_stage']}")
        if moved:
            drift.append(f"{x['r']['short_name']} ({', '.join(moved)})")
drift_note = ("Consistency: re-running the AI assessment after adding hiring data also moved some non-hiring ratings: "
              + "; ".join(drift) + ". These need a reviewer's eye." if drift else
              "Consistency: re-running the assessment changed only the hiring ratings.")


def share(key, val):
    return dist[key].get(val, 0)


obs = [
    ("Observations from the v1 results", None),
    (f"{qual_n} of {n} companies are Qualified and {len(cond)} Conditional ({', '.join(cond)}); none are Not Qualified. "
     f"{tier1} of {n} land in Tier 1; scores range {min(scores)}–{max(scores)}.", None),
    (f"Ceiling effect: Development maturity is rated 5 for {share('development_maturity', 5)} of {n}, Custom-silicon activity 5 for "
     f"{share('custom_silicon', 5)} of {n}, Evidence strength 5 for {share('evidence_strength', 5)} of {n}. These dimensions barely separate the companies.", None),
    (f"Development stage 5 (supplier evaluation / commercial engagement) for {stage5} of {n}, so the stage barely "
     f"separates the companies either (see question Q3 on what stage 5 should require).", None),
    (hiring_note, None),
    (drift_note, None),
    ("Intel offering fit and External ecosystem signals are the dimensions that actually separate the companies.", None),
    ("The sample was pre-screened for custom-silicon activity, so a high qualification rate is partly expected.", None),
    ("", None),
    ("Questions for your decision", "Your answer"),
    ("Q1. For 8 companies hiring is rated from a recent sample of about 20 postings plus the provider's total count; AWS, Cerebras, "
     "Tesla and Tenstorrent have a full 12-month pull. Is a sample enough for the rating, or should we buy credits for full pulls?", ""),
    ("Q2. Should a rating of 5 require more than one confirmed fact (e.g. two independent primary sources within 12 months)? This would "
     "spread the Custom-silicon, Maturity and Evidence ratings.", ""),
    ("Q3. Stage 5 needs 'supplier evaluation or commercial engagement'. Should a public foundry/IP customer relationship alone count, "
     "or should stage 5 need evidence of a new evaluation, agreement or design partnership in the window?", ""),
    ("Q4. Are the v1 weights right (25/20/15/15/20/5)? E.g. raise Intel offering fit or Ecosystem signals, lower Development maturity.", ""),
    ("Q5. Are the tier thresholds right (80/65/50)? With v1 ratings most companies reach Tier 1.", ""),
    ("Q6. Samsung Electronics runs Samsung Foundry, an Intel competitor in Module 2. Keep it as a Module 1 prospect (Conditional) or exclude?", ""),
    ("Q7. Cerebras is Conditional (Q3 Intel fit needs validation) despite scoring 84. Agree, or is there a specific Intel fit to confirm?", ""),
    ("Q8. The active shortlist is the brief's preliminary list (Cerebras, AWS, Meta, Microsoft, Tesla; Cerebras deep dive, Meta alternative). "
     "The score-based top 5 differs (Tenstorrent and Apple in, Cerebras and Meta out). Keep the brief's list, or adjust it after calibration?", ""),
    ("Q9. The brief says to treat Microsoft as an account to monitor, not automatically a new prospect. Keep it on the shortlist?", ""),
]
r = 1
for text, ans in obs:
    if ans is not None or text.startswith("Observations"):
        a = wo.cell(row=r, column=2, value=text)
        a.font = FB
        if ans is not None:
            h = wo.cell(row=r, column=3, value=ans)
            h.font = FB
    else:
        if text:
            wo.cell(row=r, column=1, value="•").font = F
        a = wo.cell(row=r, column=2, value=text)
        a.font = F
        if text.startswith("Q"):
            put(wo, r, 3, None, F, INPUT)
    a.alignment = Alignment(wrap_text=True, vertical="top")
    r += 1
for rr in range(1, r):
    if (wo.cell(row=rr, column=2).value or "").startswith("Q") and rr > 9:
        wo.cell(row=rr, column=1, value=None)
        put(wo, rr, 3, None, F, INPUT)

for sheet in wb.worksheets:
    sheet.sheet_view.zoomScale = 90
wb.calculation.fullCalcOnLoad = True
wb.save(OUT)
print(f"{OUT}: {n} companies, shortlist (brief) {', '.join(x['r']['short_name'] for x in rows if x['r']['company_id'] in shortlist)}")
