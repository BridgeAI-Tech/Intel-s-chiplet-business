"""Module 2 representative event shortlist (M2-5) for research review."""
import sqlite3
import sys

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

DB, OUT = sys.argv[1], sys.argv[2]

# event_id -> (why selected, note for the reviewer)
PICKS = [
    ("evt_d77826822f00a8223d14", "Custom XPU business landing at a frontier AI lab (Anthropic), financed at 1 GW scale - where custom-silicon demand is going.",
     "Recorded stage says 'production ramp'; the source says deployment is expected from mid-2026, so treat as announced."),
    ("evt_66b5d49931af7448d4f4", "Merchant GPU leader (NVIDIA) partners with and invests $2.0B in a custom-XPU provider (Marvell): ecosystem consolidation around custom silicon.", ""),
    ("evt_a0d4f0e1ff74312a5a6d", "NVIDIA opens its NVLink fabric to third-party custom XPUs through a chiplet - multi-die / chiplet competition for custom silicon.", ""),
    ("evt_547051528ba3c1b34297", "AMD uses TSMC SoIC-X and CoWoS-L across its AI and data-center portfolio - competing advanced packaging (vs EMIB / Foveros).", ""),
    ("evt_3f66d8c0481aa942b04f", "AMD qualifies a 2.5D bridge interconnect (EFB) with OSATs ASE and SPIL - a bridge approach comparable in role to EMIB.", ""),
    ("evt_735b6587939ce80240dd", "TSMC 2 nm steep ramp in Q3 2026 - leading-edge process node competition.", "Company outlook statement (announced plan), from TSMC's earnings release filed with the SEC."),
    ("evt_c270f1b6829c73cf365b", "TSMC board approves up to US$20B for TSMC Arizona - US leading-edge foundry capacity.", ""),
    ("evt_8c51d4c229016cf1b8f6", "Arm moves into its own production silicon (AGI CPU) - changes Arm's role beyond IP licensing.",
     "Arm is also an Intel Foundry Chiplet Alliance partner; recorded partner (ASRock Rack) is one of several named in the release."),
    ("evt_94788ce2e0f312ed9f4f", "Samsung Foundry wins 2 nm and 2.3D/2.5D packaging collaboration with Broadcom (MoU) - foundry + packaging competition for a custom-silicon leader.", "Non-binding MoU (announced plan)."),
    ("evt_80c10b9e8e0744a1d839", "NVIDIA and Amkor plan >300% interposer capacity increase by end-2028 - OSAT advanced-packaging capacity build-out.", ""),
]

conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row
rows = []
for eid, why, note in PICKS:
    r = conn.execute(
        """SELECT e.*, c.short_name, rs.excerpt, se.url, se.source_type,
                  (SELECT COUNT(*) FROM record_source x WHERE x.record_type = 'm2_event' AND x.record_id = e.event_id) - 1 AS corroborating
           FROM m2_competitive_event e JOIN company_master c USING (company_id)
           JOIN record_source rs ON rs.record_type = 'm2_event' AND rs.record_id = e.event_id AND rs.source_role = 'primary'
           JOIN source_evidence se ON se.source_id = rs.source_id WHERE e.event_id = ?""", (eid,)).fetchone()
    assert r, eid
    rows.append((r, why, note))

LABEL = {"design_win_customer": "Design win / customer", "product_architecture": "Product / architecture",
         "foundry_process_manufacturing": "Foundry / process / manufacturing", "chiplet_advanced_packaging": "Chiplet / advanced packaging",
         "partnership_ecosystem": "Partnership / ecosystem", "strategic_investment_capacity": "Strategic investment / capacity",
         "confirmed_fact": "Confirmed fact", "press_released_intent": "Announced plan (press-released intent)",
         "custom_asic_provider": "Custom ASIC provider", "merchant_vendor": "Merchant semiconductor vendor",
         "external_foundry": "External foundry", "ip_architecture": "IP / architecture",
         "announced_intent": "Announced", "production_ramp": "Production ramp", "general_availability": "Generally available",
         "sampling_qualification": "Sampling / qualification", "unknown": "Not stated", "development": "In development"}
lab = lambda v: LABEL.get(v, (v or "").replace("_", " ").capitalize()) if v else ""

F = Font(name="Arial", size=10)
FB = Font(name="Arial", size=10, bold=True)
FH = Font(name="Arial", size=10, bold=True, color="FFFFFF")
HEAD = PatternFill("solid", fgColor="0068B5")
INPUT = PatternFill("solid", fgColor="FFFF00")
thin = Side(style="thin", color="D9DEE5")
B = Border(left=thin, right=thin, top=thin, bottom=thin)
WRAP = Alignment(wrap_text=True, vertical="top")

wb = Workbook()

# --- Shortlist ---------------------------------------------------------------------------------------------------
ws = wb.active
ws.title = "Shortlist"
cols = [("#", 4), ("Competitor", 13), ("Value-chain role", 16), ("Event type", 20), ("Event title", 38),
        ("Event date", 11), ("Publication date", 12), ("Customer / partner", 18), ("Product / programme", 20),
        ("Process node", 14), ("Packaging / interconnect", 22), ("Commercial stage (as recorded)", 16),
        ("Evidence class", 18), ("Supporting excerpt (verbatim)", 60), ("Source URL", 40), ("Source type", 14),
        ("Corroborating sources", 12), ("Why selected", 42), ("Note for reviewer", 34), ("Event ID", 24),
        ("Potential Intel implication", 30), ("Marketing / competitive response", 30), ("Priority / assessment category", 20),
        ("Keep in final set? (Y/N)", 12), ("Reviewer comments", 30)]
ws.append([c for c, _ in cols])
for i, (_, w) in enumerate(cols, 1):
    ws.column_dimensions[get_column_letter(i)].width = w
    cell = ws.cell(1, i)
    cell.font, cell.fill, cell.alignment, cell.border = FH, HEAD, Alignment(wrap_text=True, vertical="center"), B
REVIEW_FROM = 21   # columns from here on are for the research team
for n, (r, why, note) in enumerate(rows, 1):
    ws.append([n, r["short_name"], lab(r["value_chain_role"]), lab(r["event_type"]), r["event_title"],
               r["event_date"] or "not stated", r["publication_date"], r["counterparty_name"] or "", r["product_or_programme"] or "",
               r["architecture_or_node"] or "", r["packaging_or_interconnect"] or "", lab(r["commercial_stage"]),
               lab(r["evidence_class"]), r["excerpt"], r["url"], lab(r["source_type"]), r["corroborating"], why, note,
               r["event_id"], "", "", "", "", ""])
for row in ws.iter_rows(min_row=2, max_row=ws.max_row):
    for cell in row:
        cell.font, cell.alignment, cell.border = F, WRAP, B
        if cell.column >= REVIEW_FROM:
            cell.fill = INPUT
    row[14].hyperlink = row[14].value
    row[14].font = Font(name="Arial", size=10, color="0068B5", underline="single")
ws.freeze_panes = "C2"
ws.row_dimensions[1].height = 42
last = ws.max_row

# --- Coverage (formulas) -----------------------------------------------------------------------------------------
cv = wb.create_sheet("Coverage")
cv.append(["Coverage check", ""])
cv["A1"].font = Font(name="Arial", size=12, bold=True)
cv.append(["Requirement (brief M2-5)", "Value"])
types = ["Design win / customer", "Product / architecture", "Foundry / process / manufacturing", "Chiplet / advanced packaging",
         "Partnership / ecosystem", "Strategic investment / capacity"]
r0 = 3
cv.cell(r0, 1, "Events in shortlist (target 5-10)")
cv.cell(r0, 2, f"=COUNTA(Shortlist!E2:E{last})")
cv.cell(r0 + 1, 1, "Distinct competitors (target at least 6)")
cv.cell(r0 + 1, 2, f"=SUMPRODUCT((Shortlist!B2:B{last}<>\"\")/COUNTIF(Shortlist!B2:B{last},Shortlist!B2:B{last}&\"\"))")
cv.cell(r0 + 2, 1, "Confirmed facts")
cv.cell(r0 + 2, 2, f"=COUNTIF(Shortlist!M2:M{last},\"Confirmed fact\")")
cv.cell(r0 + 3, 1, "Announced plans")
cv.cell(r0 + 3, 2, f"=COUNTIF(Shortlist!M2:M{last},\"Announced plan*\")")
cv.cell(r0 + 5, 1, "Events per type (all six types must be at least 1)")
cv.cell(r0 + 5, 1).font = FB
for i, t in enumerate(types):
    cv.cell(r0 + 6 + i, 1, t)
    cv.cell(r0 + 6 + i, 2, f"=COUNTIF(Shortlist!D2:D{last},A{r0 + 6 + i})")
cv.cell(r0 + 13, 1, "Types covered (target 6)")
cv.cell(r0 + 13, 2, f"=COUNTIF(B{r0 + 6}:B{r0 + 11},\">0\")")
for row in cv.iter_rows(min_row=2, max_row=cv.max_row):
    for cell in row:
        if cell.value is not None:
            cell.font = FB if cell.row == 2 or cell.row == r0 + 5 else F
cv.column_dimensions["A"].width = 48
cv.column_dimensions["B"].width = 12

# --- How to use --------------------------------------------------------------------------------------------------
hw = wb.create_sheet("How to use")
lines = [
    ("Module 2 - representative competitive events (M2-5) for research review", True),
    ("", False),
    ("What this is", True),
    ("10 events chosen from the 296 verified Module 2 events in the database (7 competitors, last 12 months, from 1 Nov 2025).", False),
    ("Every excerpt was re-checked word-for-word against the stored source document before this sheet was written.", False),
    ("", False),
    ("How the 10 were chosen (selection only - no scoring or Intel mapping applied)", True),
    ("1. Cover all six Module 2 event types and at least 6 competitors.", False),
    ("2. Prefer confirmed facts and primary official sources (company press release, SEC filing); announced plans included where they show direction.", False),
    ("3. Prefer events about custom silicon, process nodes, chiplets and advanced packaging - the areas Module 2 tracks.", False),
    ("4. Prefer events with a named customer or partner. Undisclosed customers are never filled in.", False),
    ("", False),
    ("What to fill in (yellow cells on the Shortlist tab, columns U-Y)", True),
    ("Potential Intel implication, Marketing / competitive response, Priority / assessment category - per the research rulebook.", False),
    ("Keep in final set? (Y/N) and Reviewer comments. Everything else is source data - please do not edit it.", False),
    ("", False),
    ("Example of a filled-in review (illustration of the format only, not a judgement on any event)", True),
    ("Potential Intel implication: 'Foundry / process - potential relevance, needs assessment'", False),
    ("Marketing / competitive response: 'Watchlist'", False),
    ("Priority / assessment category: 'Medium'   Keep in final set?: 'Y'   Reviewer comments: 'Confirm with Q4 filing'", False),
    ("", False),
    ("Notes", True),
    ("'Commercial stage (as recorded)' is the extraction's reading; two rows carry a reviewer note where the source wording is more cautious.", False),
    ("Event titles are short AI-written summaries; the verbatim excerpt and source URL are the evidence.", False),
    ("Pre-signal trail (M2-4) is not built yet, so it is not included.", False),
]
for text, bold in lines:
    hw.append([text])
    hw.cell(hw.max_row, 1).font = Font(name="Arial", size=12 if hw.max_row == 1 else 10, bold=bold)
hw.column_dimensions["A"].width = 130
wb.move_sheet("How to use", offset=-2)

wb.calculation.fullCalcOnLoad = True   # cached values are computed by Excel on open
wb.save(OUT)
print("saved", OUT, len(rows), "events")
