"""Thin provider clients. Each method returns (http_status, payload, from_cache) and stores the raw payload.

No parsing or classification happens here; normalisation belongs to the individual pipelines.
"""
import xml.etree.ElementTree as ET
from urllib.parse import quote

import requests

from chiplet.sources.store import env

TIMEOUT = 60
BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")


def _json_call(method, url, **kwargs):
    def call():
        try:
            resp = requests.request(method, url, timeout=TIMEOUT, **kwargs)
        except requests.RequestException as e:
            return 599, {"error": f"{type(e).__name__}: {e}"}
        try:
            return resp.status_code, resp.json()
        except ValueError:
            return resp.status_code, {"non_json_body": resp.text[:5000]}
    return call


class Explorium:
    BASE = "https://api.explorium.ai/v1/businesses"

    def __init__(self, store):
        self.store = store
        self.headers = {"api_key": env("EXPLORIUM_API_KEY"), "Content-Type": "application/json",
                        "accept": "application/json"}

    def match(self, company_id, name, domain):
        body = {"businesses_to_match": [{"name": name, "domain": domain}]}
        return self.store.fetch("explorium", "match", body, company_id,
                                _json_call("POST", f"{self.BASE}/match", headers=self.headers, json=body))

    def enrich(self, company_id, enrichment, business_id):
        body = {"business_id": business_id}
        return self.store.fetch("explorium", f"{enrichment}/enrich", body, company_id,
                                _json_call("POST", f"{self.BASE}/{enrichment}/enrich", headers=self.headers, json=body))


class PredictLeads:
    BASE = "https://predictleads.com/api/v3/companies"

    def __init__(self, store):
        self.store = store
        self.headers = {"X-Api-Key": env("PREDICTLEADS_API_KEY"), "X-Api-Token": env("PREDICTLEADS_USER_TOKEN")}

    def dataset(self, company_id, domain, dataset, params=None):
        params = params or {}
        return self.store.fetch("predictleads", f"{dataset}:{domain}", params, company_id,
                                _json_call("GET", f"{self.BASE}/{domain}/{dataset}", headers=self.headers,
                                           params=params))


class Exa:
    URL = "https://api.exa.ai/search"

    def __init__(self, store):
        self.store = store
        self.headers = {"x-api-key": env("EXA_API_KEY"), "Content-Type": "application/json"}

    def search(self, company_id, query, start_published_date, num_results=10, include_domains=None,
               max_characters=2000):
        body = {"query": query, "type": "auto", "numResults": num_results,
                "startPublishedDate": start_published_date,
                "contents": {"text": {"maxCharacters": max_characters}}}
        if include_domains:
            body["includeDomains"] = include_domains
        return self.store.fetch("exa", "search", body, company_id,
                                _json_call("POST", self.URL, headers=self.headers, json=body))


class GoogleNews:
    def __init__(self, store):
        self.store = store

    def search(self, company_id, query, when="1y"):
        # Google reads "12m" as 12 minutes; use 1y / 30d / 7d. Feeds stop at 100 items, so callers that
        # need full coverage should window the query with after:YYYY-MM-DD before:YYYY-MM-DD and when=None.
        if when is None:
            return self._fetch(company_id, query)
        return self._fetch(company_id, f"{query} when:{when}")

    def _fetch(self, company_id, q):
        url =f"https://news.google.com/rss/search?q={quote(q)}&hl=en-US&gl=US&ceid=US:en"

        def call():
            try:
                resp = requests.get(url, headers={"User-Agent": BROWSER_UA}, timeout=TIMEOUT)
            except requests.RequestException as e:
                return 599, {"error": str(e)}
            if resp.status_code != 200:
                return resp.status_code, {"body": resp.text[:2000]}
            items = []
            for item in ET.fromstring(resp.content).iter("item"):
                source = item.find("source")
                items.append({
                    "title": item.findtext("title"),
                    "link": item.findtext("link"),
                    "pubDate": item.findtext("pubDate"),
                    "source": source.text if source is not None else None,
                    "source_url": source.get("url") if source is not None else None,
                })
            return 200, {"query": q, "items": items}

        return self.store.fetch("google_news", "rss_search", {"q": q}, company_id, call)


class SecEdgar:
    """SEC asks for a descriptive User-Agent with contact details on every request."""
    HEADERS = {"User-Agent": "BridgeAI Chiplet POC research@bridgeaitech.com", "Accept-Encoding": "gzip, deflate"}

    def __init__(self, store):
        self.store = store

    def company_tickers(self):
        return self.store.fetch("sec_edgar", "company_tickers", {}, None,
                                _json_call("GET", "https://www.sec.gov/files/company_tickers.json",
                                           headers=self.HEADERS))

    def submissions(self, company_id, cik):
        cik10 = str(cik).zfill(10)
        return self.store.fetch("sec_edgar", "submissions", {"cik": cik10}, company_id,
                                _json_call("GET", f"https://data.sec.gov/submissions/CIK{cik10}.json",
                                           headers=self.HEADERS))


class TheirStack:
    """Job postings (title, description, posting date, original URL). 1 API credit per job returned."""
    URL = "https://api.theirstack.com/v1/jobs/search"
    # Role-level silicon terms only (company boilerplate words such as "AI" are left to the description check).
    # TheirStack regexes are case-insensitive and have no , so terms are written to avoid accidental substrings.
    SILICON_TITLES = [
        r"asic|rtl |rtl$|soc |soc$|silicon|semiconductor|chiplet|tape-?out",
        r"physical design|design verification|dft |design for test|microarchitect|cpu architect|gpu architect",
        r"hardware design|hardware architect|packaging engineer|advanced packaging|signal integrity|power integrity|serdes",
        r"analog design|analog ic|mixed-signal|mixed signal|mtia|maia|tpu |axion|trainium|graviton",
    ]

    def __init__(self, store):
        self.store = store
        self.headers = {"Authorization": f"Bearer {env('THEIRSTACK_API_KEY')}", "Content-Type": "application/json"}

    @classmethod
    def body(cls, domain, posted_from, limit, page=0, count=False):
        return {"company_domain_or": [domain], "posted_at_gte": posted_from, "job_title_pattern_or": cls.SILICON_TITLES,
                "limit": limit, "page": page, "include_total_results": count}

    def jobs(self, company_id, domain, posted_from, limit, page=0, count=False):
        body = self.body(domain, posted_from, limit, page, count)
        return self.store.fetch("theirstack", f"jobs:{domain}", body, company_id,
                                _json_call("POST", self.URL, headers=self.headers, json=body))

    def credit_balance(self):
        return _json_call("GET", "https://api.theirstack.com/v0/billing/credit-balance", headers=self.headers)()
