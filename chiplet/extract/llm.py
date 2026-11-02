"""Claude-based extraction for documents (brief §8.5) and job postings (separate variant).

Each call is cached in raw_provider_record (provider 'anthropic'), keyed by model, prompt version and the
exact input, so re-running a pipeline never pays twice for the same source.
"""
import json

import anthropic

from chiplet.extract.evidence import CheckedRecord, check_record
from chiplet.extract.normalize import content_hash, excerpt_in_source
from chiplet.extract.prompts import DOCUMENT_SYSTEM_PROMPT, JOB_SYSTEM_PROMPT, PROMPT_VERSION
from chiplet.extract.schemas import DocumentExtraction, JobClassification

MODEL = "claude-opus-5-5"
EFFORT = "high"                      # accuracy over cost: output goes to client review
MAX_SOURCE_CHARS = 400_000           # well inside the context window; longer documents must be split by the caller


class ExtractionError(RuntimeError):
    pass


class Extractor:
    def __init__(self, store, client=None, model=MODEL, effort=EFFORT):
        self.store = store
        self.client = client or anthropic.Anthropic()
        self.model = model
        self.effort = effort

    def _call(self, kind, system_prompt, output_model, user_content, cache_params, company_id):
        params = {"model": self.model, "effort": self.effort, "prompt_version": PROMPT_VERSION, **cache_params}

        def call():
            try:
                resp = self.client.beta.messages.parse(
                    model=self.model,
                    max_tokens=16000,
                    system=[{"type": "text", "text": system_prompt, "cache_control": {"type": "ephemeral"}}],
                    messages=[{"role": "user", "content": user_content}],
                    output_format=output_model,
                    output_config={"effort": self.effort},
                    betas=["server-side-fallback-2026-07-01"],
                    fallbacks="default",
                )
            except anthropic.APIStatusError as e:
                return e.status_code, {"error": e.message, "request_id": e.request_id}
            except anthropic.APIConnectionError as e:
                return 599, {"error": f"connection: {e}"}
            payload = {
                "stop_reason": resp.stop_reason,
                "model": resp.model,
                "request_id": resp._request_id,
                "usage": resp.usage.to_dict(),
                "parsed": resp.parsed_output.model_dump(mode="json") if resp.parsed_output else None,
            }
            if resp.stop_reason == "refusal" and resp.stop_details:
                payload["stop_details"] = resp.stop_details.to_dict()
            return 200, payload

        status, payload, from_cache = self.store.fetch("anthropic", kind, params, company_id, call)
        if status != 200:
            raise ExtractionError(f"{kind}: HTTP {status}: {payload.get('error')}")
        if payload["stop_reason"] != "end_turn" or payload["parsed"] is None:
            raise ExtractionError(f"{kind}: stop_reason={payload['stop_reason']} {payload.get('stop_details', '')}")
        return output_model.model_validate(payload["parsed"]), payload, from_cache

    def extract_document(self, text, *, url, title=None, publisher=None, provider_date=None, company_id=None):
        """Returns (DocumentExtraction, [CheckedRecord], call payload)."""
        if len(text) > MAX_SOURCE_CHARS:
            raise ExtractionError(f"document is {len(text)} chars; split it before extraction (limit {MAX_SOURCE_CHARS})")
        meta = {"url": url, "title": title, "publisher": publisher, "provider_published_date": provider_date}
        user = (
            "Source metadata (from the crawler, not from the document; provider dates can be crawl dates):\n"
            f"{json.dumps(meta, ensure_ascii=False)}\n\n<document>\n{text}\n</document>"
        )
        extraction, payload, _ = self._call(
            "extract_document", DOCUMENT_SYSTEM_PROMPT, DocumentExtraction, user,
            {"url": url, "content_hash": content_hash(text), "meta": meta}, company_id)
        checked = [check_record(r, text) for r in extraction.records]
        return extraction, checked, payload

    def classify_job(self, *, title, description, location=None, company_name=None, company_id=None):
        """Returns (JobClassification, excerpt_verified, call payload). Dates/location/IDs stay provider-sourced."""
        posting = f"Title: {title}\nCompany: {company_name or ''}\nLocation: {location or ''}\n\n{description or ''}"
        if len(posting) > MAX_SOURCE_CHARS:
            posting = posting[:MAX_SOURCE_CHARS]
        user = f"<job_posting>\n{posting}\n</job_posting>"
        result, payload, _ = self._call(
            "classify_job", JOB_SYSTEM_PROMPT, JobClassification, user,
            {"content_hash": content_hash(posting)}, company_id)
        return result, excerpt_in_source(result.excerpt, posting), payload


def summarize_checked(checked: list[CheckedRecord]):
    counts = {"accepted": 0, "needs_review": 0, "rejected": 0}
    for c in checked:
        counts[c.status] += 1
    return counts
