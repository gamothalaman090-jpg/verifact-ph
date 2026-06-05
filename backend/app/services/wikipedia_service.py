"""
Wikipedia Knowledge Check Service
Uses the free MediaWiki API to cross-reference claims against Wikipedia articles.
Helps verify entities, dates, statistics, and factual statements.
"""

import httpx
import re

WIKI_API_URL = "https://en.wikipedia.org/w/api.php"
WIKI_HEADERS = {
    "User-Agent": "VeriFactChecker/1.0 (contact: info@verifact.org; educational student project)"
}

# Common stop words to exclude when extracting key terms
STOP_WORDS = {
    "the", "and", "for", "was", "has", "been", "with", "from",
    "that", "this", "are", "not", "but", "his", "her", "its",
    "will", "can", "had", "have", "said", "about", "who", "they",
    "were", "what", "when", "where", "how", "does", "did", "than",
    "also", "just", "more", "some", "only", "very", "much", "being",
    "would", "could", "should", "into", "over", "after", "before",
    "between", "under", "during", "because", "each", "which", "their",
    "there", "then", "other", "these", "those", "such", "like",
    "news", "says", "according", "reported", "claimed", "alleged",
}


def _extract_search_terms(text: str) -> str:
    """
    Extract the most important terms from a claim for Wikipedia search.
    Focuses on proper nouns, numbers, and significant keywords.
    """
    # Limit input length
    text = text[:300]

    # Find proper nouns (capitalized words not at sentence start)
    sentences = text.split(". ")
    proper_nouns = set()
    for sentence in sentences:
        words = sentence.split()
        for i, word in enumerate(words):
            clean = re.sub(r'[^a-zA-Z]', '', word)
            if clean and clean[0].isupper() and i > 0 and clean.lower() not in STOP_WORDS:
                proper_nouns.add(clean)

    # Also grab significant non-stop words (3+ chars)
    all_words = re.findall(r'[a-zA-Z]{3,}', text)
    keywords = [w for w in all_words if w.lower() not in STOP_WORDS]

    # Prioritize proper nouns, then keywords
    if proper_nouns:
        search_terms = " ".join(list(proper_nouns)[:5])
    else:
        search_terms = " ".join(keywords[:6])

    return search_terms


async def search_wikipedia(query: str, max_results: int = 3) -> dict:
    """
    Search Wikipedia for articles related to the claim.
    Returns structured results with titles, snippets, and URLs.
    """
    search_terms = _extract_search_terms(query)

    if not search_terms.strip():
        return {
            "has_results": False,
            "articles": [],
            "search_terms": "",
            "note": "Could not extract meaningful search terms from the claim.",
        }

    params = {
        "action": "query",
        "list": "search",
        "srsearch": search_terms,
        "srlimit": max_results,
        "srprop": "snippet|titlesnippet|timestamp",
        "format": "json",
        "utf8": 1,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(WIKI_API_URL, params=params, headers=WIKI_HEADERS)
            response.raise_for_status()
            data = response.json()

        search_results = data.get("query", {}).get("search", [])

        if not search_results:
            return {
                "has_results": False,
                "articles": [],
                "search_terms": search_terms,
                "note": "No Wikipedia articles found for this claim.",
            }

        articles = []
        for result in search_results:
            title = result.get("title", "")
            # Clean HTML from snippet
            snippet = re.sub(r'<[^>]+>', '', result.get("snippet", ""))
            url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"

            articles.append({
                "title": title,
                "snippet": snippet,
                "url": url,
                "timestamp": result.get("timestamp", ""),
            })

        return {
            "has_results": True,
            "articles": articles,
            "search_terms": search_terms,
        }

    except Exception as e:
        print(f"[WARN] Wikipedia search error: {e}")
        return {
            "has_results": False,
            "articles": [],
            "search_terms": search_terms,
            "note": f"Wikipedia search failed: {str(e)}",
        }


async def get_wikipedia_summary(title: str) -> str:
    """
    Get the introductory summary of a specific Wikipedia article.
    Useful for cross-referencing specific facts.
    """
    params = {
        "action": "query",
        "titles": title,
        "prop": "extracts",
        "exintro": True,
        "explaintext": True,
        "exsectionformat": "plain",
        "format": "json",
        "utf8": 1,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(WIKI_API_URL, params=params, headers=WIKI_HEADERS)
            response.raise_for_status()
            data = response.json()

        pages = data.get("query", {}).get("pages", {})
        for page_id, page_data in pages.items():
            if page_id != "-1":
                extract = page_data.get("extract", "")
                # Truncate to ~500 chars to keep things manageable
                return extract[:500] if extract else ""

        return ""

    except Exception:
        return ""
