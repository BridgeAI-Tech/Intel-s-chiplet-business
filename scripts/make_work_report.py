"""Intel Chiplet POC - complete work report (what, why, how, tools, UI presentation)."""
import sys
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle)

OUT = sys.argv[1]
pdfmetrics.registerFont(TTFont("Arial", "C:/Windows/Fonts/arial.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Bold", "C:/Windows/Fonts/arialbd.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Italic", "C:/Windows/Fonts/ariali.ttf"))
from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily("Arial", normal="Arial", bold="Arial-Bold", italic="Arial-Italic", boldItalic="Arial-Bold")

BLUE = colors.HexColor("#0068B5")
INK = colors.HexColor("#1f2933")
MUTED = colors.HexColor("#5b6773")
LINE = colors.HexColor("#d9dee5")
SOFT = colors.HexColor("#eef5fb")
GREEN = colors.HexColor("#e7f6ee")
AMBER = colors.HexColor("#fff4dc")
RED = colors.HexColor("#fde8e8")

H1 = ParagraphStyle("h1", fontName="Arial-Bold", fontSize=16, leading=20, textColor=BLUE, spaceBefore=4, spaceAfter=8)
H2 = ParagraphStyle("h2", fontName="Arial-Bold", fontSize=12, leading=15, textColor=INK, spaceBefore=10, spaceAfter=5)
P = ParagraphStyle("p", fontName="Arial", fontSize=9.5, leading=13.5, textColor=INK, spaceAfter=5)
SMALL = ParagraphStyle("s", parent=P, fontSize=8.5, leading=11.5, textColor=MUTED)
BUL = ParagraphStyle("b", parent=P, leftIndent=12, bulletIndent=2, spaceAfter=2.5)
CELL = ParagraphStyle("c", fontName="Arial", fontSize=8.5, leading=11, textColor=INK)
CELLB = ParagraphStyle("cb", parent=CELL, fontName="Arial-Bold")
HEAD = ParagraphStyle("hd", parent=CELL, fontName="Arial-Bold", textColor=colors.white)
TITLE = ParagraphStyle("t", fontName="Arial-Bold", fontSize=24, leading=30, textColor=BLUE, alignment=TA_CENTER)
SUB = ParagraphStyle("st", fontName="Arial", fontSize=12, leading=17, textColor=MUTED, alignment=TA_CENTER)


def bullets(items):
    return [Paragraph(t, BUL, bulletText="\u2022") for t in items]


def table(rows, widths, status_col=None, head=True):
    data = [[Paragraph(str(c), HEAD if (head and i == 0) else (CELLB if j == 0 else CELL)) for j, c in enumerate(r)]
            for i, r in enumerate(rows)]
    t = Table(data, colWidths=[w * mm for w in widths], repeatRows=1 if head else 0)
    st = [("GRID", (0, 0), (-1, -1), 0.4, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
          ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
          ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]
    if head:
        st.append(("BACKGROUND", (0, 0), (-1, 0), BLUE))
    if status_col is not None:
        for i, r in enumerate(rows[1:], 1):
            s = str(r[status_col]).lower()
            fill = GREEN if s.startswith("done") else AMBER if s.startswith("partly") or s.startswith("in review") else RED
            st.append(("BACKGROUND", (status_col, i), (status_col, i), fill))
    t.setStyle(TableStyle(st))
    return t


def footer(c, doc):
    c.saveState()
    c.setFont("Arial", 7.5)
    c.setFillColor(MUTED)
    c.drawString(18 * mm, 10 * mm, "Intel Chiplet Market Signals POC - work report - 6 Nov 2026")
    c.drawRightString(A4[0] - 18 * mm, 10 * mm, f"Page {doc.page}")
    c.restoreState()


s = []
# ---------------------------------------------------------------- cover + summary
s += [Spacer(1, 40 * mm), Paragraph("Intel Chiplet Market Signals", TITLE), Spacer(1, 4 * mm),
      Paragraph("Proof of Concept - complete work report", SUB), Spacer(1, 3 * mm),
      Paragraph("What the task was, what we did, why, how, which tools, and how to present the web app", SUB),
      Spacer(1, 14 * mm),
      Paragraph("Prepared by BridgeAI (Satish - data and technology) for review with Shu Qi (research, scoring and rules). "
                "Status as of 6 November 2026. Every number in this report is counted from the project database.", SMALL),
      Spacer(1, 10 * mm)]
s.append(table([
    ["", "In one line"],
    ["The project", "An evidence-led system that finds companies building their own chips (custom silicon / chiplets) who could "
                    "become Intel Foundry customers, and tracks what Intel's competitors are doing."],
    ["The answer to 'is everything done?'", "Most of it. Modules 1 and 2, hiring for all 12 companies and the Part 2 framework are built, populated and shown in the web app. "
     "A few items are open: calibration by Shu Qi, the written deep-dive on Cerebras, Intel ARK / Resource Library, "
     "per-project stage, Module 2 pre-signal trail and Intel-implication fields, and deployment (section 2 lists them)."],
], [45, 125], head=True))
s.append(PageBreak())

# ---------------------------------------------------------------- 1. the task
s.append(Paragraph("1. What the task was", H1))
s.append(Paragraph("The client (Intel) gave two technical briefs. Part 1 defines what data to collect; Part 2 defines how to judge it.", P))
s.append(table([
    ["Brief", "What it asks for"],
    ["Part 1 - Module 1: Emerging Demand Radar", "Screen 8-12 named companies for custom-silicon activity in the last 12 months (news, filings, hiring, "
     "partners). Shortlist 3-5, deep-dive 1. Companies named in the brief (section 7): AWS, Google, Microsoft, Meta, Cerebras, "
     "Tenstorrent, Cisco, Nokia, Tesla, Apple, Samsung Electronics, IBM. Preliminary shortlist: Cerebras, AWS, Meta, Microsoft, "
     "Tesla; Cerebras deep dive, Meta alternative."],
    ["Part 1 - Module 2: Competitive Radar", "Track 6-8 competitors (Broadcom, Marvell, AMD, NVIDIA, Arm, TSMC, Samsung Foundry): "
     "products, design wins, foundry and packaging moves, partnerships, investments. Pick 5-10 representative events."],
    ["Part 1 - evidence rules", "Every record needs a source URL and the supporting excerpt; classify as Confirmed fact, "
     "Corroborated inference or Press-released intent; last 12 months only."],
    ["Part 2 - Scoring", "Development stage 1-5 and a weighted score out of 100 over six dimensions (25/20/15/15/20/5), "
     "tiers 80/65/50, evidence confidence High/Medium/Low shown separately."],
    ["Part 2 - Qualification", "Q1 custom silicon, Q2 external semiconductor need, Q3 Intel portfolio fit: Qualified / Conditional / "
     "Not Qualified. Shortlist must not be by score alone."],
    ["Part 2 - Intel portfolio mapping", "Build an Intel Portfolio & Technology Reference Database from official Intel pages, then map each "
     "company to Foundry / Design-IP / Packaging as Direct, Adjacent or No fit, with Confirmed / Inferred / Unverified status."],
    ["Part 2 - client requests", "Scoring, rating scale and thresholds configurable in the app (not hard-coded). Show Module 2 in the dashboard."],
], [48, 122]))

s.append(Paragraph("Why this matters (the purpose)", H2))
s += bullets([
    "Intel Foundry manufactures, packages and tests chips designed by other companies. Its sales team needs to know <b>who</b> is designing "
    "their own chips, <b>how far along</b> they are, and <b>which Intel offering</b> fits them.",
    "It also needs to know <b>what competitors</b> (TSMC, Samsung Foundry, Broadcom, Marvell and others) are winning, so it can respond.",
    "Because this goes to a client, every statement must be <b>provable</b>: an exact sentence from an official or reliable source, with its "
    "link and date. Nothing is taken from AI memory.",
])

# ---------------------------------------------------------------- 2. status
s.append(Paragraph("2. Task-by-task status", H1))
s.append(table([
    ["Task", "Status", "Detail"],
    ["Company master (12 prospects + 7 competitors)", "Done", "Domains, HQ, LinkedIn verified from Explorium and SEC; sign-off sheet exported."],
    ["M1 news, filings, partners", "Done", "433 verified signals for the 12 companies (300 confirmed, 133 announced plans); 124 relationships."],
    ["M1 deep source extraction", "Done", "Cerebras 92, AWS 82, Microsoft 39, Meta 33, Tesla 28 signals - the five brief-shortlist companies."],
    ["M1 hiring", "Done", "545 silicon job postings for all 12. Full 12-month pulls: Tenstorrent 161, AWS 138, Tesla 79, Cerebras 54. Recent sample of ~20 each (TheirStack) for the other 8: 113 stored, plus the provider total count."],
    ["M2 competitor events", "Done", "296 verified events (184 confirmed, 112 announced): NVIDIA 84, Arm 66, Marvell 60, AMD 45, TSMC 26, Broadcom 12, Samsung Foundry 3."],
    ["M2 representative events", "In review", "10 events covering all 7 competitors and 6 event types, sent to Shu Qi."],
    ["M2 pre-signal trail (M2-4)", "Not started", "Linking earlier hints to later announcements."],
    ["M2 Intel implication (M2-7)", "Not started", "Needs Shu Qi's rulebook for implication, response and priority fields."],
    ["Part 2 configurable framework", "Done", "Settings page: weights, tiers, rating wording, stage rules, confidence thresholds, shortlist size; versioned with restore."],
    ["Part 2 Intel reference database", "Partly", "49 entries from 6 official Intel Foundry pages (P1 complete). Not yet: Intel ARK, Resource Library, 3 more pages."],
    ["Part 2 stage + score + qualification", "Done", "All 12 companies: 10 Qualified, 2 Conditional (Cerebras - Q3 needs validation; Samsung Electronics)."],
    ["Part 2 portfolio mapping", "Done", "36 mappings (12 companies x 3 categories), each pointing to a specific Intel offering and its evidence."],
    ["Per-project development stage", "Not started", "Stage is per company; the brief asks per project 'where possible'."],
    ["Shortlist", "Done", "Brief's preliminary shortlist applied: Cerebras, AWS, Meta, Microsoft, Tesla. Score ranking kept for reference."],
    ["Written deep-dive (Cerebras)", "Not started", "Data and scoring are in the app; the one-page opportunity write-up is not."],
    ["Calibration of v1", "In review", "Calibration workbook sent; scores run high (10 of 12 Qualified)."],
    ["Deployment", "Not started", "Needs GCP access from the manager or a Vercel login."],
], [46, 20, 104], status_col=1))

# ---------------------------------------------------------------- 3. what we did / how
s.append(Paragraph("3. What we did and how", H1))
s.append(Paragraph("The same four-step method is used for every kind of data:", P))
s.append(table([
    ["Step", "What happens", "Why"],
    ["1. Collect", "Pull documents from official newsrooms, SEC filings, job sites and selected trade press. Every raw response is stored unchanged.",
     "Repeatable and auditable; re-runs cost nothing because responses are cached."],
    ["2. Extract", "Gemini reads each document and returns structured JSON: company, event type, product, partner, date, exact sentence.",
     "Turns long articles and filings into comparable records."],
    ["3. Check (publish rule)", "A record is kept only if the excerpt is word-for-word in the source, the date is stated in the document and "
     "falls inside the window (from 1 Nov 2025), and the source is attributable. Others go to a review sheet.",
     "Client rule: 100% source-verified, nothing from model memory."],
    ["4. Show", "Records are written to one SQLite database and shown in the web app with charts, filters and links to the proof.",
     "Every number on screen is a count of real records."],
], [26, 92, 52]))

s.append(Paragraph("Module 1 - Emerging Demand Radar", H2))
s += bullets([
    "Built the company master for the 12 named companies, verifying domains and HQ with Explorium and SEC.",
    "Collected news and announcements (Exa search, official newsrooms), SEC filings (10-K, 10-Q, IPO prospectus, 8-K earnings exhibits) and "
    "partner announcements.",
    "Deep source extraction for the shortlist companies - Cerebras (incl. its 424B4 IPO prospectus), AWS (Amazon filings naming AWS chips), "
    "Tesla, Meta and Microsoft (their newsroom and engineering-blog feeds).",
    "Hiring: silicon job postings from PredictLeads and Amazon Jobs (full 12 months for 4 companies) and TheirStack (recent sample for the other 8), classified by role (verification, physical design, RTL, packaging...).",
    "Relationships: who supplies or partners with each company (TSMC, Broadcom, Arm, Synopsys...), each with its source.",
])
s.append(Paragraph("Module 2 - Competitive Radar", H2))
s += bullets([
    "Exa credits were exhausted, so we switched to free official sources: newsroom sitemaps (NVIDIA, AMD, Marvell, Arm, Samsung), "
    "Broadcom releases via PR Newswire, the Samsung Newsroom feed, and SEC filings (TSMC from its 20-F and 6-K reports).",
    "Sites that block automated access (TSMC, intel.com, Samsung article pages) were not bypassed; we used their filings, feeds or a "
    "browser capture instead.",
    "Events classified into six types and as confirmed or announced; duplicates merged as corroborating sources; 10 representative events picked.",
])
s.append(Paragraph("Part 2 - Scoring, qualification and Intel mapping", H2))
s += bullets([
    "Stored Shu Qi's framework as configuration version v1 (weights, rating scale, tiers, stages, qualification rules).",
    "Captured 6 official Intel Foundry pages in the browser and built a 49-entry reference of Intel offerings (process nodes, EMIB, Foveros, "
    "ASAT, IP and EDA alliances), each with the verbatim passage; partners kept separate from Intel's own offerings.",
    "For each company, Gemini drafted the stage, six ratings, Q1-Q3 answers and mappings from that company's verified records only - each "
    "must cite record IDs.",
    "Code then enforces the rules: an uncited rating drops to 1; stage 4-5 needs at least 2 records including a confirmed fact; Direct Fit "
    "needs a specific Intel offering; confidence is calculated from the share of primary sources; missing hiring data is flagged.",
    "Score, tier, qualification and ranking are calculated live from the active settings, so changing a weight re-scores everyone.",
])

s.append(Paragraph("Why we built it this way", H2))
s += bullets([
    "<b>Verbatim check in code</b> - so no AI-invented fact can reach the client.",
    "<b>Raw cache of every response</b> - results are reproducible and re-runs are free.",
    "<b>AI drafts, rules decide</b> - Gemini does the reading; deterministic code applies the brief's rules so results are consistent.",
    "<b>Settings, not code</b> - the brief says v1 will be calibrated; the research team can change it without a developer.",
])
s.append(PageBreak())

# ---------------------------------------------------------------- 4. tools
s.append(Paragraph("4. Tools and technology", H1))
s.append(table([
    ["Tool", "Used for", "Notes"],
    ["Gemini (Google AI)", "Reading documents into structured records; drafting assessments; Ask Intelligence chat", "Temperature 0 and a fixed JSON schema; output is checked against the source."],
    ["Exa", "Web search for company news and trade press", "Credits exhausted (402) - later work used free official sources."],
    ["SEC EDGAR", "10-K, 10-Q, 20-F, 424B4 prospectus, 8-K and 6-K exhibits", "Free; official filing dates."],
    ["Official newsrooms / RSS / sitemaps", "NVIDIA, AMD, Marvell, Arm, Samsung, Meta, Microsoft, Cerebras, AWS...", "Publisher's own title, date and full text."],
    ["PR Newswire", "Broadcom press releases", "Broadcom's own site renders only in the browser."],
    ["PredictLeads", "Job postings (Cerebras, Tesla, Tenstorrent)", "Credits used up (100/100)."],
    ["TheirStack", "Job postings for the other 8 companies", "Free plan 200 credits/month; 172 used, 28 left until 5 Dec 2026."],
    ["Explorium", "Company firmographics (domain, HQ, LinkedIn)", "Credits used up."],
    ["Amazon Jobs", "AWS / Annapurna Labs job postings", "Public job site."],
    ["Browser capture", "intel.com pages (blocked to scripts)", "Pages saved with URL and capture date; not bypassed."],
    ["Python + SQLite", "Pipelines, rule checks, one database (data/chiplet.db)", "35 automated tests pass."],
    ["openpyxl / reportlab", "Review Excel sheets and PDF reports", ""],
    ["Next.js + React + Tailwind + libSQL", "The web dashboard", "Reads a snapshot of the database; streaming chat."],
], [40, 70, 60]))

s.append(Paragraph("Data volume (from the database)", H2))
s.append(table([
    ["Item", "Count"],
    ["Module 1 verified signals (12 companies)", "433"],
    ["Company relationships", "124"],
    ["Module 2 verified competitor events", "296"],
    ["Source documents stored with evidence", "972"],
    ["Silicon job postings (12 companies)", "545"],
    ["Intel reference entries / official pages", "49 / 6"],
    ["Company assessments / portfolio mappings", "12 / 36"],
    ["AI extraction calls cached (Gemini)", "2,467"],
], [110, 60]))

s.append(Paragraph("5. Files shared (review sheets)", H1))
s.append(table([
    ["File (data/review/)", "What it contains", "Who uses it"],
    ["company_master_review.xlsx", "Company master: 12 prospects, 7 competitors and related entities, with verified identifiers", "Sign-off on scope"],
    ["m1_news_review.xlsx, m1_deep_dive_review*.xlsx", "Records held back by the publish rule, with reasons", "Audit of what was excluded"],
    ["m1_hiring_review*.xlsx", "Job postings held back, with reasons (PredictLeads / amazon.jobs and TheirStack runs)", "Hiring dimension check"],
    ["m2_events_review.xlsx", "All Module 2 events and held-back items", "Competitor audit"],
    ["m2_representative_events.xlsx", "10 representative events with yellow review columns", "Shu Qi - pick final set"],
    ["part2_calibration_v1.xlsx", "Ratings with override columns that re-score live, evidence, Q1-Q3, mapping, 9 questions", "Shu Qi - calibrate v1"],
], [52, 78, 40]))
s.append(PageBreak())

# ---------------------------------------------------------------- 6. UI presentation
s.append(Paragraph("6. The web app - what is in it and how to present it", H1))
s.append(table([
    ["Page", "What it shows"],
    ["Home - Emerging Demand Radar", "Company buttons (All five, AWS, Cerebras, Meta, Microsoft, Tesla) and tabs: Overview (key numbers and charts), "
     "Developments, Hiring, Partners & suppliers, Intel relationship, SEC filings, Scoring & shortlist, All sources."],
    ["Scoring & shortlist tab", "All 12 companies with stage, score, tier, confidence, qualification and Foundry / Design-IP / Packaging fit; "
     "the brief's shortlist with Cerebras as deep-dive candidate; the score-based ranking for reference."],
    ["/assessment/[company]", "One company's full assessment: every rating, Q1-Q3 answer and Intel mapping linked to its records."],
    ["Competitive Radar", "Module 2: overview charts, event register, foundry & packaging tracker, shortlist for review."],
    ["Intel Portfolio", "The 49 Intel offerings, each with its official intel.com passage."],
    ["Settings", "Change weights and thresholds; each save is a new version; earlier versions can be restored."],
    ["Ask Intelligence (button)", "Chat drawer that answers only from verified records and shows its sources."],
    ["Record pages", "Click any card to see the exact sentence and the original link."],
], [48, 122]))

s.append(Paragraph("Suggested 10-minute demo", H2))
demo = [
    ["#", "Show", "Say"],
    ["1", "Home, 'All five'", "These are the five companies the brief shortlisted. Every number is a count of verified records since 1 Nov 2025."],
    ["2", "Click Cerebras, then a development card", "Here is the exact sentence and the original source - nothing is from AI memory."],
    ["3", "Hiring and Partners tabs", "Who they hire (verification, physical design...) and who supplies them (TSMC...)."],
    ["4", "Scoring & shortlist", "The research framework applied to all 12: stage, score, tier, qualification, Intel fit. Not by score alone."],
    ["5", "Open Cerebras assessment", "Why Cerebras is Conditional: Intel fit still needs validation. Each rating links to its evidence."],
    ["6", "Intel Portfolio", "What each mapping points to - Intel's own offerings from intel.com."],
    ["7", "Settings", "The scoring is configurable, as requested: change a weight and every company re-scores; versions are kept."],
    ["8", "Competitive Radar", "What NVIDIA, AMD, TSMC and others announced, classified and sourced."],
    ["9", "Ask Intelligence", "Ask e.g. 'Who manufactures Cerebras chips?' - the answer cites its sources."],
    ["10", "Close", "Next: calibration with the research team, the Cerebras deep-dive write-up, and deployment."],
]
s.append(table(demo, [8, 52, 110]))
s.append(Paragraph("Presentation tips", H2))
s += bullets([
    "Lead with the business question (who to approach, why, with what offering), then show the proof - the verbatim excerpt is the strongest moment.",
    "Say clearly that scores are framework v1 and will be calibrated, and that mappings are potential fit, not confirmed deals.",
    "Be upfront about gaps: hiring for 8 companies is a recent sample of about 20 postings, Intel ARK / Resource Library are not yet covered, and Module 2 Intel-implication fields await the rulebook.",
])

s.append(KeepTogether([Paragraph("7. What is left", H1), table([
    ["Item", "Owner", "Needed"],
    ["Calibrate framework v1 (scores run high)", "Shu Qi", "Answers in the calibration workbook; saved as v1.1 in Settings"],
    ["Cerebras deep-dive write-up", "Satish + Shu Qi", "Opportunity, requirements, Intel fit, risks, next steps - from the existing evidence"],
    ["Intel ARK, Resource Library, 3 more Intel pages", "Satish", "Browser capture, then re-assessment"],
    ["Per-project development stage", "Satish", "One more extraction pass and a UI section"],
    ["M2 pre-signal trail and Intel implication fields", "Satish / Shu Qi", "Rulebook for implication, response and priority"],
    ["Full hiring history for 8 companies (optional)", "Satish", "Paid TheirStack plan (from $49/month) if the sample is not enough"],
    ["Deployment", "Satish + manager", "GCP access or a Vercel login; a writable database for Settings"],
], [62, 30, 78])]))

doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm, bottomMargin=18 * mm,
                        title="Intel Chiplet POC - Work Report", author="BridgeAI")
doc.build(s, onFirstPage=footer, onLaterPages=footer)
print(OUT)
