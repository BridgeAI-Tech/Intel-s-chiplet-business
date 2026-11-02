"""Gemini-based extraction for documents (brief §8.5) and job postings (separate variant).

Each call is cached in raw_provider_record (provider 'gemini'), keyed by model, prompt version and the
exact input, so re-running a pipeline never pays twice for the same source. The JSON returned by the
model is validated against the Pydantic schemas here, and every record then goes through the
deterministic checks in evidence.py; the model is never the last word on a fact.
"""
import json

from google import genai
from google.genai import errors, types
from pydantic import ValidationError

from chiplet.extract.evidence import CheckedRecord, check_record
from chiplet.extract.normalize import content_hash, excerpt_in_source
from chiplet.extract.prompts import DOCUMENT_SYSTEM_PROMPT, JOB_SYSTEM_PROMPT, PROMPT_VERSION
from chiplet.extract.schemas import DocumentExtraction, JobClassification
from chiplet.sources.store import env

MODEL = env("GEMINI_MODEL") or "gemini-4-argon"   # flagship reasoning model: accuracy over cost (client review)
MAX_SOURCE_CHARS = 400_000                        # well inside the context window; split longer documents first


class ExtractionError(RuntimeError):
    pass


class Extractor:
    def __init__(self, store, client=None, model=MODEL):
        self.store = store
        self.client = client or genai.Client(api_key=env("GEMINI_API_KEY"))
        self.model = model

    def _call(self, kind, system_prompt, output_model, user_content, cache_params, company_id):
        params = {"model": self.model, "prompt_version": PROMPT_VERSION, **cache_params}

        def call():
            try:
                resp = self.client.models.generate_content(
                    model=self.model,
                    contents=user_content,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        response_mime_type="application/json",
                        response_json_schema=output_model.model_json_schema(),
                        temperature=0,
                    ),
                )
            except errors.APIError as e:
                return e.code or 599, {"error": str(e)}
            candidate = (resp.candidates or [None])[0]
            finish = getattr(getattr(candidate, "finish_reason", None), "name", None)
            usage = resp.usage_metadata.model_dump(mode="json", exclude_none=True) if resp.usage_metadata else None
            return 200, {"finish_reason": finish, "model": self.model, "usage": usage, "text": resp.text}

        status, payload, _ = self.store.fetch("gemini", kind, params, company_id, call)
        if status != 200:
            raise ExtractionError(f"{kind}: HTTP {status}: {payload.get('error')}")
        if payload["finish_reason"] != "STOP" or not payload.get("text"):
            raise ExtractionError(f"{kind}: finish_reason={payload['finish_reason']}")
        try:
            return output_model.model_validate_json(payload["text"]), payload
        except ValidationError as e:
            raise ExtractionError(f"{kind}: model output does not match schema: {e.errors()[:3]}") from e

    def extract_document(self, text, *, url, title=None, publisher=None, provider_date=None, company_id=None):
        """Returns (DocumentExtraction, [CheckedRecord], call payload)."""
        if len(text) > MAX_SOURCE_CHARS:
            raise ExtractionError(f"document is {len(text)} chars; split it before extraction (limit {MAX_SOURCE_CHARS})")
        meta = {"url": url, "title": title, "publisher": publisher, "provider_published_date": provider_date}
        user = (
            "Source metadata (from the crawler, not from the document; provider dates can be crawl dates):\n"
            f"{json.dumps(meta, ensure_ascii=False)}\n\n<document>\n{text}\n</document>"
        )
        extraction, payload = self._call(
            "extract_document", DOCUMENT_SYSTEM_PROMPT, DocumentExtraction, user,
            {"url": url, "content_hash": content_hash(text), "meta": meta}, company_id)
        checked = [check_record(r, text) for r in extraction.records]
        return extraction, checked, payload

    def classify_job(self, *, title, description, location=None, company_name=None, company_id=None):
        """Returns (JobClassification, excerpt_verified, call payload). Dates/location/IDs stay provider-sourced."""
        posting = f"Title: {title}\nCompany: {company_name or ''}\nLocation: {location or ''}\n\n{description or ''}"
        posting = posting[:MAX_SOURCE_CHARS]
        user = f"<job_posting>\n{posting}\n</job_posting>"
        result, payload = self._call(
            "classify_job", JOB_SYSTEM_PROMPT, JobClassification, user,
            {"content_hash": content_hash(posting)}, company_id)
        return result, excerpt_in_source(result.excerpt, posting), payload


def summarize_checked(checked: list[CheckedRecord]):
    counts = {"accepted": 0, "needs_review": 0, "rejected": 0}
    for c in checked:
        counts[c.status] += 1
    return counts
