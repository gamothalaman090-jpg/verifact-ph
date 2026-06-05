"""
News Search & Source Credibility Service
Two modes:
1. URL mode: score credibility based on the source domain itself
2. Text mode: search Bing for corroborating articles
"""

import re
import httpx
from urllib.parse import urlparse
from duckduckgo_search import DDGS

# ─── Source Credibility Database ────────────────────────────────────
CREDIBLE_SOURCES = {
    # International wire services
    "reuters.com": {"name": "Reuters", "trust": 1.0, "type": "wire"},
    "apnews.com": {"name": "Associated Press", "trust": 1.0, "type": "wire"},
    "afp.com": {"name": "AFP", "trust": 1.0, "type": "wire"},
    # Major international outlets
    "bbc.com": {"name": "BBC", "trust": 0.95, "type": "news"},
    "bbc.co.uk": {"name": "BBC", "trust": 0.95, "type": "news"},
    "nytimes.com": {"name": "New York Times", "trust": 0.9, "type": "news"},
    "washingtonpost.com": {"name": "Washington Post", "trust": 0.9, "type": "news"},
    "theguardian.com": {"name": "The Guardian", "trust": 0.9, "type": "news"},
    "aljazeera.com": {"name": "Al Jazeera", "trust": 0.85, "type": "news"},
    "cnn.com": {"name": "CNN", "trust": 0.85, "type": "news"},
    "nbcnews.com": {"name": "NBC News", "trust": 0.85, "type": "news"},
    "cbsnews.com": {"name": "CBS News", "trust": 0.85, "type": "news"},
    "abcnews.go.com": {"name": "ABC News", "trust": 0.85, "type": "news"},
    "france24.com": {"name": "France 24", "trust": 0.85, "type": "news"},
    "dw.com": {"name": "DW", "trust": 0.85, "type": "news"},
    # Philippine news outlets
    "abs-cbn.com": {"name": "ABS-CBN", "trust": 0.85, "type": "news"},
    "gma.com": {"name": "GMA", "trust": 0.85, "type": "news"},
    "gmanetwork.com": {"name": "GMA Network", "trust": 0.85, "type": "news"},
    "inquirer.net": {"name": "Philippine Daily Inquirer", "trust": 0.85, "type": "news"},
    "philstar.com": {"name": "PhilStar", "trust": 0.8, "type": "news"},
    "rappler.com": {"name": "Rappler", "trust": 0.85, "type": "news"},
    "mb.com.ph": {"name": "Manila Bulletin", "trust": 0.8, "type": "news"},
    "manilatimes.net": {"name": "Manila Times", "trust": 0.75, "type": "news"},
    "pna.gov.ph": {"name": "PNA", "trust": 0.85, "type": "government"},
    "cnnphilippines.com": {"name": "CNN Philippines", "trust": 0.8, "type": "news"},
    # Fact-checking organizations
    "snopes.com": {"name": "Snopes", "trust": 0.95, "type": "factcheck"},
    "factcheck.org": {"name": "FactCheck.org", "trust": 0.95, "type": "factcheck"},
    "politifact.com": {"name": "PolitiFact", "trust": 0.95, "type": "factcheck"},
    "verafiles.org": {"name": "VERA Files", "trust": 0.9, "type": "factcheck"},
    "fullfact.org": {"name": "Full Fact", "trust": 0.9, "type": "factcheck"},
    # Government / official sources
    "gov.ph": {"name": "Philippine Government", "trust": 0.8, "type": "government"},
    "who.int": {"name": "WHO", "trust": 0.9, "type": "government"},
    "un.org": {"name": "United Nations", "trust": 0.9, "type": "government"},
    "icc-cpi.int": {"name": "ICC", "trust": 0.95, "type": "government"},
}




def _get_source_info(url: str) -> dict:
    """Get credibility info for a URL's domain."""
    try:
        domain = urlparse(url).netloc.lower().replace("www.", "")
        if domain in CREDIBLE_SOURCES:
            return CREDIBLE_SOURCES[domain]
        for known_domain, info in CREDIBLE_SOURCES.items():
            if domain.endswith(known_domain):
                return info
        return {"name": domain, "trust": 0.5, "type": "unknown"}
    except Exception:
        return {"name": "Unknown", "trust": 0.3, "type": "unknown"}


def get_url_credibility(source_url: str) -> dict:
    """
    When the user submits a URL, score the source domain itself.
    A URL from Reuters or ABS-CBN is inherently more credible than an unknown blog.
    """
    source_info = _get_source_info(source_url)
    is_known = source_info["trust"] > 0.5

    return {
        "score": source_info["trust"] if is_known else 0.4,
        "credible_count": 1 if is_known else 0,
        "total_count": 1,
        "top_sources": [{
            "name": source_info["name"],
            "url": source_url,
            "title": f"Original source: {source_info['name']}",
            "snippet": f"Article published by {source_info['name']}, a {'recognized' if is_known else 'unknown'} news source.",
            "trust": source_info["trust"],
            "type": source_info["type"],
        }],
        "has_factcheck": source_info["type"] == "factcheck",
        "source_is_credible": is_known,
    }


def search_news(query: str, max_results: int = 8) -> list[dict]:
    """
    Search DuckDuckGo for corroborating news articles.
    Uses the dedicated news() endpoint first, then falls back to text() for broader coverage.
    """
    results = []
    seen_urls = set()

    try:
        ddgs = DDGS(timeout=12)

        # Strategy 1: DuckDuckGo News search (best for recent articles)
        try:
            news_results = ddgs.news(
                keywords=query,
                region="wt-wt",
                safesearch="moderate",
                max_results=max_results,
            )
            for item in news_results or []:
                url = item.get("url", "")
                if not url or url in seen_urls:
                    continue
                seen_urls.add(url)

                source_info = _get_source_info(url)
                results.append({
                    "title": item.get("title", ""),
                    "url": url,
                    "snippet": (item.get("body", "") or "")[:200],
                    "source_name": source_info["name"],
                    "source_trust": source_info["trust"],
                    "source_type": source_info["type"],
                })
        except Exception as e:
            print(f"[WARN] DuckDuckGo news search error: {e}")

        # Strategy 2: DuckDuckGo Text search for broader web coverage (if news returned few results)
        if len(results) < 3:
            try:
                text_results = ddgs.text(
                    keywords=f"{query} news",
                    region="wt-wt",
                    safesearch="moderate",
                    max_results=max_results - len(results),
                )
                for item in text_results or []:
                    url = item.get("href", "")
                    if not url or url in seen_urls:
                        continue
                    if "duckduckgo.com" in url:
                        continue
                    seen_urls.add(url)

                    source_info = _get_source_info(url)
                    results.append({
                        "title": item.get("title", ""),
                        "url": url,
                        "snippet": (item.get("body", "") or "")[:200],
                        "source_name": source_info["name"],
                        "source_trust": source_info["trust"],
                        "source_type": source_info["type"],
                    })
            except Exception as e:
                print(f"[WARN] DuckDuckGo text search error: {e}")

    except Exception as e:
        print(f"[WARN] DuckDuckGo initialization error: {e}")

    return results[:max_results]


def compute_corroboration_score(search_results: list[dict]) -> dict:
    """Analyze search results to compute a corroboration score."""
    if not search_results:
        return {
            "score": 0.5,
            "credible_count": 0,
            "total_count": 0,
            "top_sources": [],
            "has_factcheck": False,
        }

    credible_results = [r for r in search_results if r["source_trust"] >= 0.75]
    factcheck_results = [r for r in search_results if r["source_type"] == "factcheck"]

    credible_count = len(credible_results)
    total_count = len(search_results)

    if credible_count == 0:
        base_score = 0.4
    elif credible_count == 1:
        base_score = 0.55
    elif credible_count == 2:
        base_score = 0.65
    elif credible_count <= 4:
        base_score = 0.75
    else:
        base_score = 0.85

    if factcheck_results:
        base_score = min(1.0, base_score + 0.1)

    top_sources = sorted(credible_results, key=lambda x: x["source_trust"], reverse=True)[:5]

    return {
        "score": round(base_score, 2),
        "credible_count": credible_count,
        "total_count": total_count,
        "top_sources": [
            {
                "name": s["source_name"],
                "url": s["url"],
                "title": s["title"],
                "snippet": s["snippet"],
                "trust": s["source_trust"],
                "type": s["source_type"],
            }
            for s in top_sources
        ],
        "has_factcheck": len(factcheck_results) > 0,
    }
