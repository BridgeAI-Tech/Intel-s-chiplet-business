from types import SimpleNamespace

import pytest

from chiplet.extract.evidence import check_record, evidence_class_for
from chiplet.extract.llm import ExtractionError, Extractor
from chiplet.extract.schemas import DocumentExtraction, ExtractedRecord, JobClassification
from chiplet.extract.store import upsert_source
from chiplet.sources.store import RawStore

SOURCE = ("PALO ALTO, Calif., Feb. 26, 2026 — Broadcom Inc. today announced it is shipping its 3.5D "
          "face-to-face compute SoC to Fujitsu. The company plans to expand production in 2027.")


def record(**over):
    base = dict(subject_company="Broadcom", business_unit=None, programme_or_product="3.5D face-to-face compute SoC",
                category="chiplet_advanced_packaging", title="Broadcom ships 3.5D F2F SoC",
                summary="Broadcom is shipping a 3.5D face-to-face compute SoC to Fujitsu.",
                technologies=["advanced_packaging", "soc"], architecture_or_node=None,
                packaging_or_interconnect="3.5D face-to-face", counterparties=[{"name": "Fujitsu", "role": "customer"}],
                commercial_stage="general_availability", statement_status="completed_or_current",
                attribution="company_official", event_date_text="Feb. 26, 2026",
                excerpt="Broadcom Inc. today announced it is shipping its 3.5D face-to-face compute SoC to Fujitsu.")
    base.update(over)
    return ExtractedRecord.model_validate(base)


def test_evidence_class_rules():
    assert evidence_class_for(record()) == "confirmed_fact"
    assert evidence_class_for(record(statement_status="planned_or_intended")) == "press_released_intent"
    assert evidence_class_for(record(attribution="third_party_citing_company")) == "confirmed_fact"
    assert evidence_class_for(record(attribution="third_party_unattributed")) is None
    assert evidence_class_for(record(attribution="analyst_opinion")) is None


def test_verified_record_is_accepted():
    c = check_record(record(), SOURCE)
    assert c.status == "accepted" and c.event_date.value == "2026-02-26" and not c.issues


def test_paraphrased_excerpt_is_rejected():
    c = check_record(record(excerpt="Broadcom is now shipping 3.5D chips to Fujitsu."), SOURCE)
    assert c.status == "rejected"


def test_invented_counterparty_needs_review():
    c = check_record(record(counterparties=[{"name": "Google", "role": "customer"}]), SOURCE)
    assert c.status == "needs_review" and any("Google" in i for i in c.issues)


def test_unconfirmed_claim_needs_review():
    c = check_record(record(attribution="third_party_unattributed"), SOURCE)
    assert c.status == "needs_review" and c.evidence_class is None


def test_schema_rejects_codes_outside_taxonomy():
    with pytest.raises(Exception):
        record(category="buying_intent")
    with pytest.raises(Exception):
        record(technologies=["quantum_magic"])


class FakeClient:
    """Stands in for anthropic.Anthropic: records calls and returns a fixed parsed output."""

    def __init__(self, parsed, stop_reason="end_turn"):
        self.calls = 0
        outer = self

        class _Messages:
            def parse(self, **kwargs):
                outer.calls += 1
                outer.last_kwargs = kwargs
                return SimpleNamespace(
                    stop_reason=stop_reason, stop_details=None, model=kwargs["model"], _request_id="req_test",
                    usage=SimpleNamespace(to_dict=lambda: {"input_tokens": 10, "output_tokens": 5}),
                    parsed_output=parsed)

        self.beta = SimpleNamespace(messages=_Messages())


def test_extract_document_checks_and_caches(conn):
    parsed = DocumentExtraction(relevant=True, page_type="press_release", publication_date_text="Feb. 26, 2026",
                                records=[record(), record(excerpt="not in the source at all")])
    client = FakeClient(parsed)
    ex = Extractor(RawStore(conn, "test"), client=client)
    extraction, checked, _ = ex.extract_document(SOURCE, url="https://investors.broadcom.com/x")
    assert [c.status for c in checked] == ["accepted", "rejected"]
    assert client.last_kwargs["model"] == "claude-opus-5-5"
    assert client.last_kwargs["output_format"] is DocumentExtraction
    ex.extract_document(SOURCE, url="https://investors.broadcom.com/x")
    assert client.calls == 1                       # second identical request served from raw_provider_record


def test_refusal_raises(conn):
    ex = Extractor(RawStore(conn, "test"), client=FakeClient(None, stop_reason="refusal"))
    with pytest.raises(ExtractionError):
        ex.extract_document(SOURCE, url="https://example.com/a")


def test_classify_job_verifies_excerpt(conn):
    parsed = JobClassification(is_silicon_relevant=True, role_category="rtl_logic_design",
                               normalised_title="ASIC RTL Design Engineer", job_function="Hardware engineering",
                               seniority="senior", department="AI Hardware", programme_keywords=[],
                               technologies=["custom_asic"], excerpt="Own RTL for our next AI accelerator")
    ex = Extractor(RawStore(conn, "test"), client=FakeClient(parsed))
    result, verified, _ = ex.classify_job(title="Senior ASIC RTL Design Engineer",
                                          description="You will own RTL for our next AI accelerator.")
    assert result.role_category.value == "rtl_logic_design" and verified


def test_upsert_source_keeps_first_observed(conn):
    sid = upsert_source(conn, url="https://www.broadcom.com/a?utm_source=x", source_type="company_newsroom",
                        publication_date="Feb. 26, 2026", full_text=SOURCE)
    conn.execute("UPDATE source_evidence SET first_observed_date = '2026-01-01' WHERE source_id = ?", (sid,))
    assert upsert_source(conn, url="https://broadcom.com/a", source_type="company_newsroom") == sid
    row = conn.execute("SELECT first_observed_date, publication_date FROM source_evidence WHERE source_id=?",
                       (sid,)).fetchone()
    assert row["first_observed_date"] == "2026-01-01" and row["publication_date"] == "2026-02-26"
