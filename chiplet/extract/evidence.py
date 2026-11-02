"""Deterministic post-processing of LLM extractions: excerpt verification, date resolution, evidence class.

Evidence classes (brief §6.4) are assigned by rule from what the model reported, so the same source
always yields the same class and every class is explainable:

  attribution (who says it)                         completed_or_current   planned_or_intended
  company_official / partner_official /
  regulatory_filing / third_party_citing_company    confirmed_fact         press_released_intent
  third_party_unattributed / analyst_opinion        None (unconfirmed)     None (unconfirmed)

Unconfirmed single-source records can only become corroborated_inference later, when independent
sources agree (that step needs several records, so it is not done here).
"""
from dataclasses import dataclass, field
from typing import List, Optional

from chiplet.extract.normalize import ParsedDate, excerpt_in_source, parse_date
from chiplet.extract.schemas import Attribution, ExtractedRecord, StatementStatus

OFFICIAL = {Attribution.company_official, Attribution.partner_official, Attribution.regulatory_filing,
            Attribution.third_party_citing_company}


def evidence_class_for(record: ExtractedRecord) -> Optional[str]:
    if record.attribution not in OFFICIAL:
        return None
    if record.statement_status == StatementStatus.completed_or_current:
        return "confirmed_fact"
    return "press_released_intent"


@dataclass
class CheckedRecord:
    record: ExtractedRecord
    evidence_class: Optional[str]
    event_date: Optional[ParsedDate]
    excerpt_verified: bool
    issues: List[str] = field(default_factory=list)

    @property
    def status(self):
        """accepted -> may feed signal tables; needs_review -> human check; rejected -> never shown."""
        if not self.excerpt_verified:
            return "rejected"
        if self.issues or self.evidence_class is None:
            return "needs_review"
        return "accepted"


def check_record(record: ExtractedRecord, source_text: str) -> CheckedRecord:
    issues = []
    verified = excerpt_in_source(record.excerpt, source_text)
    if not verified:
        issues.append("excerpt not found verbatim in source")

    event_date = parse_date(record.event_date_text) if record.event_date_text else None
    if record.event_date_text and event_date is None:
        issues.append(f"event date not parseable: {record.event_date_text!r}")
    if record.event_date_text and not excerpt_in_source(record.event_date_text, source_text):
        issues.append("event date text not found in source")

    for cp in record.counterparties:
        if not excerpt_in_source(cp.name, source_text):
            issues.append(f"counterparty not named in source: {cp.name!r}")
    if record.programme_or_product and not excerpt_in_source(record.programme_or_product, source_text):
        issues.append(f"programme/product not named in source: {record.programme_or_product!r}")

    cls = evidence_class_for(record)
    if cls is None:
        issues.append(f"unconfirmed single-source claim ({record.attribution.value})")
    return CheckedRecord(record, cls, event_date, verified, issues)
