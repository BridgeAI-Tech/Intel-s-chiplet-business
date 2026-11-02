"""Structured-output schemas for LLM extraction. Enum values come from data/seed/taxonomy.json.

The model reports *what the source says and who says it*; evidence classes are assigned afterwards by
deterministic rules (see evidence.py), never chosen freely by the model.
"""
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field

from chiplet.db import load_seed

_TAXONOMY = load_seed("taxonomy.json")


def _enum(name, *dimensions):
    codes = []
    for dim in dimensions:
        codes += [t["code"] for t in _TAXONOMY[dim] if t["code"] not in codes]
    return Enum(name, {c: c for c in codes}, type=str)


SignalCategory = _enum("SignalCategory", "m2_event_type", "m1_signal_type")
Technology = _enum("Technology", "technology")
CommercialStage = _enum("CommercialStage", "commercial_stage")
RoleCategory = _enum("RoleCategory", "hiring_role_category")
Seniority = _enum("Seniority", "seniority")


class PageType(str, Enum):
    press_release = "press_release"
    news_article = "news_article"
    product_or_technical_page = "product_or_technical_page"
    blog = "blog"
    regulatory_filing = "regulatory_filing"
    investor_material = "investor_material"
    job_posting = "job_posting"
    other = "other"


class Attribution(str, Enum):
    company_official = "company_official"                      # the subject company's own statement / page
    partner_official = "partner_official"                      # named partner / customer / supplier's own statement
    regulatory_filing = "regulatory_filing"                    # filing or exchange disclosure
    third_party_citing_company = "third_party_citing_company"  # press quoting or citing an official statement
    third_party_unattributed = "third_party_unattributed"      # "reportedly", "sources say", supply-chain reports
    analyst_opinion = "analyst_opinion"                        # analyst / commentator view, forecast or speculation


class StatementStatus(str, Enum):
    completed_or_current = "completed_or_current"   # happened / is shipping / is in place
    planned_or_intended = "planned_or_intended"     # announced plan, target, roadmap, intention, MoU


class CounterpartyRole(str, Enum):
    customer = "customer"
    foundry = "foundry"
    packaging_partner = "packaging_partner"
    supplier = "supplier"
    ip_provider = "ip_provider"
    eda_vendor = "eda_vendor"
    design_partner = "design_partner"
    investor = "investor"
    investee = "investee"
    acquirer = "acquirer"
    acquired = "acquired"
    ecosystem_partner = "ecosystem_partner"
    other = "other"


class Counterparty(BaseModel):
    name: str = Field(description="Name exactly as written in the source.")
    role: CounterpartyRole


class ExtractedRecord(BaseModel):
    subject_company: str = Field(description="Company the development is about, as named in the source.")
    business_unit: Optional[str] = Field(description="Business unit if the source names one, else null.")
    programme_or_product: Optional[str] = Field(description="Chip, product or programme name as written, else null.")
    category: SignalCategory
    title: str = Field(description="Short factual title, no adjectives the source does not use.")
    summary: str = Field(description="1-3 sentences restating only what the source states.")
    technologies: List[Technology]
    architecture_or_node: Optional[str] = Field(description="Only if disclosed in the source, else null.")
    packaging_or_interconnect: Optional[str] = Field(description="Only if disclosed in the source, else null.")
    counterparties: List[Counterparty] = Field(description="Only parties the source names explicitly.")
    commercial_stage: CommercialStage
    statement_status: StatementStatus
    attribution: Attribution
    event_date_text: Optional[str] = Field(
        description="Date of the development exactly as stated in the source text (e.g. 'March 12, 2026', "
                    "'Q3 2026'); null if the source gives no date for the event itself.")
    excerpt: str = Field(description="Verbatim quote from the source (max ~400 characters) that supports this "
                                     "record. Copy characters exactly; do not paraphrase or join distant sentences.")


class DocumentExtraction(BaseModel):
    relevant: bool = Field(description="False if the document has no information within scope.")
    page_type: PageType
    publication_date_text: Optional[str] = Field(
        description="Publication date exactly as printed in the document, else null.")
    records: List[ExtractedRecord]


class JobClassification(BaseModel):
    is_silicon_relevant: bool = Field(
        description="True only if the role itself does silicon / chip / packaging / semiconductor-manufacturing or "
                    "silicon-supply work.")
    role_category: RoleCategory
    normalised_title: str
    job_function: str
    seniority: Seniority
    department: Optional[str] = Field(description="Team / department / business unit as stated, else null.")
    programme_keywords: List[str] = Field(description="Programme or product names stated in the posting.")
    technologies: List[Technology]
    excerpt: str = Field(description="Verbatim sentence from the posting that best shows the role's silicon scope "
                                     "(or its main duty if not silicon-relevant).")
