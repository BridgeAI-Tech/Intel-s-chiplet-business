import pytest

from chiplet.extract.normalize import (CompanyIndex, ParsedDate, canonical_url, content_hash, excerpt_in_source,
                                       in_window, job_dedup_key, job_may_be_silicon, parse_date)


@pytest.mark.parametrize("raw, expected", [
    ("https://WWW.Broadcom.com/news/a/?utm_source=x&b=2&a=1#top", "https://broadcom.com/news/a?a=1&b=2"),
    ("http://investors.broadcom.com//news-releases/", "https://investors.broadcom.com/news-releases"),
    ("https://www.tsmc.com/", "https://tsmc.com/"),
])
def test_canonical_url(raw, expected):
    assert canonical_url(raw) == expected


@pytest.mark.parametrize("raw, expected", [
    ("2026-10-28T23:00:00Z", ParsedDate("2026-10-28", "day")),
    ("2026-10-28", ParsedDate("2026-10-28", "day")),
    ("Sat, 31 Oct 2026 07:00:00 GMT", ParsedDate("2026-10-31", "day")),
    ("November  1, 2026", ParsedDate("2026-11-01", "day")),
    ("Sept. 4, 2026", ParsedDate("2026-09-04", "day")),
    ("12 March 2026", ParsedDate("2026-03-12", "day")),
    ("March 2026", ParsedDate("2026-03", "month")),
    ("Q3 2026", ParsedDate("2026-07", "quarter")),
    ("2027", ParsedDate("2027", "year")),
    ("2026-02-30", None),
    ("later this year", None),
    ("", None),
])
def test_parse_date_never_invents(raw, expected):
    assert parse_date(raw) == expected


def test_in_window_respects_precision():
    assert in_window("2025-11", "2025-11-01")
    assert in_window("2026-03-12", "2025-11-01", "2026-11-01")
    assert not in_window("2025-10-31", "2025-11-01")
    assert not in_window(None, "2025-11-01")


def test_excerpt_verification_tolerates_typography_only():
    source = "Broadcom’s new  Tomahawk 6 switch — shipping now."
    assert excerpt_in_source("Broadcom's new Tomahawk 6 switch - shipping now", source)
    assert not excerpt_in_source("Broadcom's Tomahawk 7 switch", source)
    assert not excerpt_in_source("", source)


def test_content_hash_ignores_whitespace():
    assert content_hash("a  b\nc") == content_hash("A b c")


def test_company_for_url_matches_subdomains_only(conn):
    idx = CompanyIndex.load(conn)
    assert idx.company_for_url("https://investors.broadcom.com/news") == "cmp_broadcom"
    assert idx.company_for_url("https://aws.amazon.com/silicon") == "cmp_aws"
    assert idx.company_for_url("https://www.amazon.com/dp/123") == "cmp_amazon"
    assert idx.company_for_url("https://semiconductor.samsung.com/foundry") == "cmp_samsung_foundry"
    assert idx.company_for_url("https://www.samsung.com/in/") == "cmp_samsung_electronics"
    assert idx.company_for_url("https://notbroadcom.com/") is None


def test_alias_matching_is_word_bounded_and_case_aware(conn):
    idx = CompanyIndex.load(conn)
    hits = idx.companies_in_text("Samsung Foundry and TSMC compete; Arm licenses Neoverse.")
    assert set(hits) == {"cmp_samsung_foundry", "cmp_tsmc", "cmp_arm"}
    assert "cmp_samsung_electronics" not in hits          # longer alias wins over overlapping "Samsung"
    assert "cmp_arm" not in idx.companies_in_text("the robot arm and firearm market")
    assert "cmp_amd" not in idx.companies_in_text("amd64 builds")
    assert idx.resolve_name("Annapurna Labs") == "cmp_aws"
    assert idx.resolve_name("Some Startup Inc") is None


def test_job_dedup_and_prefilter():
    k1 = job_dedup_key("cmp_x", "Senior RTL Engineer", "Austin, TX", "Design RTL for SoCs")
    k2 = job_dedup_key("cmp_x", "senior  rtl engineer", "Austin,  TX", "Design RTL  for SoCs")
    assert k1 == k2
    assert job_may_be_silicon("Staff Design Verification Engineer")
    assert job_may_be_silicon("Engineer", "You will own UVM testbenches and emulation for our accelerator")
    assert not job_may_be_silicon("Store Sales Advisor", "Help customers choose a vehicle")
    boilerplate = "Cerebras builds the world's largest AI chip, a wafer-scale accelerator."
    assert not job_may_be_silicon("Staff Software Engineer, Observability", boilerplate)


@pytest.mark.parametrize("raw, expected", [
    ("Amazon Web Services", "AWS"),
    ("Taiwan Semiconductor Manufacturing Company Limited (\"TSMC\")", "TSMC"),
    ("Taiwan Semiconductor Manufacturing Company Limited", "TSMC"),
    ("Sony Semiconductor Solutions Corporation", "Sony Semiconductor Solutions"),
    ("Sony", "Sony"),
    ("@Supermicro", "Supermicro"),
    ("OpenAI OpCo, LLC", "OpenAI"),
    ("Tongfu Microelectronics Co., Ltd.", "Tongfu Microelectronics"),
    ("Aston Martin Aramco Formula One™ Team", "Aston Martin Aramco Formula One™ Team"),
])
def test_canonical_party(raw, expected):
    from chiplet.extract.normalize import canonical_party
    assert canonical_party(raw) == expected


def test_sentence_naming_is_verbatim():
    from chiplet.extract.normalize import party_variants, sentence_naming
    text = "Intro line here. Global AI labs planning to adopt Vera include Anthropic, OpenAI and SpaceXAI. End."
    s = sentence_naming(text, party_variants("Anthropic"))
    assert s and s in text and "Anthropic" in s
    assert sentence_naming(text, party_variants("Meta")) is None
