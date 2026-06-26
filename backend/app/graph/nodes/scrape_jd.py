"""Node: scrape the job description from job_url.

Primary path: requests + BeautifulSoup (fast, no browser needed on Render).
A Playwright fallback hook is left marked below for JS-rendered pages.
"""

from __future__ import annotations

import requests
from bs4 import BeautifulSoup

from ..state import JobAgentState

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}

# Tags that never carry job-description prose.
_STRIP_TAGS = ["script", "style", "noscript", "header", "footer", "nav", "svg"]

_MIN_USEFUL_CHARS = 200


def _extract_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(_STRIP_TAGS):
        tag.decompose()
    # Collapse whitespace; keep line breaks between blocks for readability.
    lines = [line.strip() for line in soup.get_text("\n").splitlines()]
    return "\n".join(line for line in lines if line)


def scrape_jd(state: JobAgentState) -> dict:
    url = state.get("job_url", "").strip()
    if not url:
        return {"jd_text": "", "error": "No job URL provided."}

    try:
        resp = requests.get(url, headers=_HEADERS, timeout=20)
        resp.raise_for_status()
    except requests.RequestException as exc:
        return {"jd_text": "", "error": f"Failed to fetch job URL: {exc}"}

    text = _extract_text(resp.text)

    if len(text) < _MIN_USEFUL_CHARS:
        # TODO(playwright): JS-rendered boards (Greenhouse/Lever/Workday) often
        # return near-empty HTML here. Add a Playwright fallback that renders the
        # page and re-runs _extract_text on the rendered DOM.
        return {
            "jd_text": text,
            "error": (
                "Could not extract enough text from the page (it may be "
                "JavaScript-rendered). Try pasting the job description directly."
            ),
        }

    return {"jd_text": text, "error": None}
