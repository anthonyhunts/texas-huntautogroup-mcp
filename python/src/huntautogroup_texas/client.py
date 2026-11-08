"""Small client for https://texas.huntautogroup.com/api/v1/ (standard library only)."""
import json
import os
import urllib.error
import urllib.parse
import urllib.request

DEFAULT_BASE = "https://texas.huntautogroup.com/api/v1"
USER_AGENT = "huntautogroup-texas-python/1.1.0"


class ApiError(Exception):
    """An RFC 9457 problem returned by the API. `code` is stable (for example `model_not_found`)."""

    def __init__(self, status, code, title, detail=""):
        super().__init__(f"{title}: {detail}".strip(": "))
        self.status, self.code, self.title, self.detail = status, code, title, detail


class Client:
    """Read-only client. Every method returns the decoded JSON from the API."""

    def __init__(self, base_url=None, timeout=20):
        self.base = (base_url or os.environ.get("HUNTAUTO_API_URL") or DEFAULT_BASE).rstrip("/")
        self.timeout = timeout

    def _get(self, path, **query):
        q = {k: v for k, v in query.items() if v is not None}
        url = self.base + path + ("?" + urllib.parse.urlencode(q) if q else "")
        req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            try:
                p = json.loads(e.read().decode("utf-8"))
            except ValueError:
                p = {}
            raise ApiError(e.code, p.get("code", f"http_{e.code}"), p.get("title", "HTTP error"), p.get("detail", "")) from None

    def index(self):
        return self._get("/")

    def models(self, category=None, limit=None, cursor=None):
        """Models with data. category: truck, suv, car or minivan."""
        return self._get("/models/", category=category, limit=limit, cursor=cursor)

    def model(self, slug):
        """All years of one model: recalls, complaints, NHTSA stars, EPA combined MPG."""
        return self._get(f"/models/{urllib.parse.quote(slug)}/")

    def model_year(self, slug, year):
        """One model year in detail: NHTSA, EPA engines and MPG, Transport Canada size."""
        return self._get(f"/models/{urllib.parse.quote(slug)}/years/{int(year)}/")

    def guides(self, lang=None, category=None, q=None, limit=None, cursor=None):
        return self._get("/guides/", lang=lang, category=category, q=q, limit=limit, cursor=cursor)

    def contact(self, channel=None):
        return self._get("/contact/", channel=channel)
