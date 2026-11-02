"""Deterministic helpers: URL canonicalisation, hashing, date parsing, company matching, job dedup keys.

Nothing here guesses. Unparseable dates return None; ambiguous company mentions return no match.
"""
import hashlib
import json
import re
import unicodedata
from dataclasses import dataclass
from datetime import date, datetime
from email.utils import parsedate_to_datetime
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

TRACKING_PARAMS = re.compile(r"^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|ref$|ref_src$|cmpid$|_hs|mkt_tok$)", re.I)


# ---------------------------------------------------------------------------
# URLs and content
# ---------------------------------------------------------------------------
def canonical_url(url):
    """Lower-case scheme/host, drop www., fragments, tracking params and trailing slash; sort remaining params."""
    parts = urlsplit(url.strip())
    host = (parts.hostname or "").lower()
    if host.startswith("www."):
        host = host[4:]
    if parts.port and parts.port not in (80, 443):
        host = f"{host}:{parts.port}"
    query = urlencode(sorted((k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True)
                             if not TRACKING_PARAMS.match(k)))
    path = re.sub(r"/{2,}", "/", parts.path or "/")
    if len(path) > 1:
        path = path.rstrip("/")
    return urlunsplit(("https", host, path, query, ""))


def url_host(url):
    host = (urlsplit(url).hostname or "").lower()
    return host[4:] if host.startswith("www.") else host


def normalize_text(text):
    """Whitespace-, quote- and dash-insensitive form used for hashing and excerpt verification."""
    text = unicodedata.normalize("NFKC", text or "")
    text = (text.replace("‘", "'").replace("’", "'").replace("“", '"').replace("”", '"')
                .replace("–", "-").replace("—", "-").replace(" ", " "))
    return re.sub(r"\s+", " ", text).strip().lower()


def content_hash(text):
    return hashlib.sha256(normalize_text(text).encode("utf-8")).hexdigest()


def stable_id(prefix, *parts):
    blob = json.dumps(parts, sort_keys=True, default=str)
    return f"{prefix}_{hashlib.sha256(blob.encode()).hexdigest()[:20]}"


def excerpt_in_source(excerpt, source_text):
    """True when the excerpt appears verbatim in the source (ignoring whitespace, quote and case differences)."""
    needle = normalize_text(excerpt)
    return bool(needle) and needle in normalize_text(source_text)


# ---------------------------------------------------------------------------
# Dates
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class ParsedDate:
    value: str          # ISO prefix: YYYY-MM-DD, YYYY-MM or YYYY
    precision: str      # day | month | quarter | year


MONTHS = {m.lower(): i for i, m in enumerate(
    ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October",
     "November", "December"], start=1)}
MONTHS.update({k[:3]: v for k, v in list(MONTHS.items())})
MONTHS["sept"] = 9


def parse_date(value):
    """Parse provider / page date strings. Returns ParsedDate or None; never invents a day or month."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return ParsedDate(value.date().isoformat(), "day")
    if isinstance(value, date):
        return ParsedDate(value.isoformat(), "day")
    s = re.sub(r"\s+", " ", str(value)).strip()
    if not s:
        return None

    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})(?:[T ][\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?$", s)
    if m:
        return _checked(int(m[1]), int(m[2]), int(m[3]))
    m = re.match(r"^(\d{4})-(\d{2})$", s)
    if m and 1 <= int(m[2]) <= 12:
        return ParsedDate(f"{m[1]}-{m[2]}", "month")
    m = re.match(r"^(\d{4})/(\d{1,2})/(\d{1,2})$", s)
    if m:
        return _checked(int(m[1]), int(m[2]), int(m[3]))
    if re.match(r"^[A-Za-z]{3}, \d{1,2} [A-Za-z]{3} \d{4}", s):          # RFC 822 (RSS pubDate)
        try:
            return ParsedDate(parsedate_to_datetime(s).date().isoformat(), "day")
        except (TypeError, ValueError):
            return None
    m = re.match(r"^([A-Za-z]+)\.? (\d{1,2}),? (\d{4})$", s)              # November 1, 2026
    if m and m[1].lower() in MONTHS:
        return _checked(int(m[3]), MONTHS[m[1].lower()], int(m[2]))
    m = re.match(r"^(\d{1,2}) ([A-Za-z]+)\.?,? (\d{4})$", s)               # 1 November 2026
    if m and m[2].lower() in MONTHS:
        return _checked(int(m[3]), MONTHS[m[2].lower()], int(m[1]))
    m = re.match(r"^([A-Za-z]+)\.? (\d{4})$", s)                          # November 2026
    if m and m[1].lower() in MONTHS:
        return ParsedDate(f"{m[2]}-{MONTHS[m[1].lower()]:02d}", "month")
    m = re.match(r"^(?:Q([1-4]) ?(\d{4})|(\d{4}) ?Q([1-4]))$", s, re.I)     # Q3 2026 / 2026 Q3
    if m:
        year, quarter = (m[2], m[1]) if m[1] else (m[3], m[4])
        return ParsedDate(f"{year}-{(int(quarter) - 1) * 3 + 1:02d}", "quarter")
    m = re.match(r"^(\d{4})$", s)
    if m:
        return ParsedDate(m[1], "year")
    return None


def _checked(y, mth, d):
    try:
        return ParsedDate(date(y, mth, d).isoformat(), "day")
    except ValueError:
        return None


def in_window(iso_value, start, end=None):
    """Compare ISO prefixes; a month- or year-precision date counts if its period overlaps the window."""
    if not iso_value:
        return False
    if iso_value < start[:len(iso_value)]:
        return False
    return end is None or iso_value <= end[:len(iso_value)]


# ---------------------------------------------------------------------------
# Company matching (company master is the only authority)
# ---------------------------------------------------------------------------
# Aliases that are ordinary words or acronyms with other meanings; matched case-sensitively only.
CASE_SENSITIVE_ALIASES = {"Arm", "ARM", "AMD", "IBM", "AWS", "Meta", "Apple", "Google", "TSMC", "Intel", "IFS", "GCP",
                          "Azure", "Tesla", "Samsung", "Cisco", "Nokia"}


@dataclass
class CompanyIndex:
    domains: dict          # host -> company_id
    aliases: list          # (compiled regex, alias, company_id), longest alias first

    @classmethod
    def load(cls, conn):
        domains = {}
        for row in conn.execute("SELECT company_id, primary_domain, alt_domains FROM company_master"):
            for d in [row["primary_domain"], *json.loads(row["alt_domains"] or "[]")]:
                domains[d.lower()] = row["company_id"]
        aliases = []
        for row in conn.execute("SELECT alias, company_id FROM company_alias"):
            alias = row["alias"]
            flags = 0 if alias in CASE_SENSITIVE_ALIASES or len(alias) <= 4 else re.I
            aliases.append((re.compile(rf"(?<![\w-]){re.escape(alias)}(?![\w-])", flags), alias, row["company_id"]))
        aliases.sort(key=lambda a: -len(a[1]))
        return cls(domains, aliases)

    def company_for_url(self, url):
        """Exact host or parent-domain match against company master domains (e.g. investors.broadcom.com)."""
        host = url_host(url)
        while host:
            if host in self.domains:
                return self.domains[host]
            host = host.split(".", 1)[1] if "." in host else ""
        return None

    def companies_in_text(self, text):
        """Company IDs whose alias appears as a whole word. Longest aliases win over overlapping shorter ones."""
        found, taken = {}, []
        for pattern, alias, company_id in self.aliases:
            for m in pattern.finditer(text or ""):
                if any(s < m.end() and m.start() < e for s, e in taken):
                    continue
                taken.append((m.start(), m.end()))
                found.setdefault(company_id, set()).add(alias)
        return found

    def resolve_name(self, name):
        """Map an extracted company name to exactly one company_id, or None when absent/ambiguous."""
        if not name:
            return None
        exact = {cid for _, alias, cid in self.aliases if alias.lower() == name.strip().lower()}
        if len(exact) == 1:
            return exact.pop()
        hits = self.companies_in_text(name)
        return next(iter(hits)) if len(hits) == 1 else None


# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------
def job_dedup_key(company_id, title, location, description):
    """Same role reposted or seen via two providers collapses to one key."""
    return stable_id("job", company_id, normalize_text(title), normalize_text(location or ""),
                     content_hash((description or "")[:4000]))


# Recall-oriented gate so the LLM only classifies postings that could be silicon-relevant.
SILICON_JOB_TERMS = re.compile(
    r"\b(asic|rtl|soc|system[- ]on[- ]chip|silicon|chip|semiconductor|physical design|place[- ]and[- ]route|"
    r"timing closure|sta|design verification|uvm|formal verification|emulation|dft|design[- ]for[- ]test|atpg|"
    r"mbist|scan|post[- ]silicon|pre[- ]silicon|bring[- ]?up|tape[- ]?out|packag\w*|chiplet|interposer|"
    r"substrate|2\.5d|3d ic|hbm|si/pi|signal integrity|power integrity|fpga|verilog|systemverilog|vhdl|"
    r"microarchitect\w*|cpu architect\w*|gpu architect\w*|accelerator|foundry|wafer|yield|npi|"
    r"process integration|test engineer|ate|product engineer|eda|analog|mixed[- ]signal|serdes|ucie|pcie|"
    r"hardware engineer|hardware architect|annapurna|trainium|inferentia|graviton|dojo|tpu|mtia|maia|cobalt)\b",
    re.I)


# Terms that chip companies use in every posting's company boilerplate ("we build the largest AI chip"),
# so on their own they say nothing about the role.
BOILERPLATE_TERMS = {"chip", "silicon", "semiconductor", "accelerator", "wafer", "hardware engineer", "yield", "scan",
                     "sta", "ate", "pcie", "eda", "annapurna", "trainium", "inferentia", "graviton", "dojo", "tpu",
                     "mtia", "maia", "cobalt"}


def job_may_be_silicon(title, description=""):
    """Title hit, or at least two distinct role-level terms in the description (boilerplate words excluded)."""
    if SILICON_JOB_TERMS.search(title or ""):
        return True
    terms = {m.group(0).lower() for m in SILICON_JOB_TERMS.finditer((description or "")[:6000])}
    return len(terms - BOILERPLATE_TERMS) >= 2
