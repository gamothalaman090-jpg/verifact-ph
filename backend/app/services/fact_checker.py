"""
Enhanced Fact Checker Service
Queries Google Fact Check API, parses verdicts, and filters by relevance.
"""

import httpx
import os
import re
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_FACT_CHECK_API_KEY", "")

# ─── Rating Normalization ──────────────────────────────────────────
RATING_MAP = {
    "true": 1.0, "correct": 1.0, "accurate": 1.0, "verified": 1.0,
    "mostly true": 0.75, "mostly correct": 0.75, "mostly accurate": 0.75,
    "largely true": 0.75,
    "half true": 0.5, "half-true": 0.5,
    "mixture": 0.25, "mixed": 0.25,
    "partly true": 0.4, "partially true": 0.4,
    "mostly false": -0.5, "mostly incorrect": -0.5,
    "misleading": -0.4, "exaggerated": -0.3,
    "lacks context": -0.2, "missing context": -0.2,
    "unproven": 0.0, "unverified": 0.0, "outdated": -0.1,
    "false": -1.0, "incorrect": -1.0, "wrong": -1.0,
    "pants on fire": -1.0, "pants on fire!": -1.0,
    "four pinocchios": -1.0, "fake": -1.0, "fabricated": -1.0,
    "hoax": -1.0, "satire": -0.8, "scam": -1.0,
}


def _normalize_rating(textual_rating: str) -> float:
    """Convert a textual fact-check rating to a numeric score."""
    if not textual_rating:
        return 0.0
    lower = textual_rating.strip().lower()
    if lower in RATING_MAP:
        return RATING_MAP[lower]
    for key, score in RATING_MAP.items():
        if key in lower:
            return score
    return 0.0


def _compute_relevance(query: str, claim_text: str) -> float:
    """
    Compute how relevant a fact-check claim is to the original query.
    Returns 0.0-1.0. Prevents unrelated claims from being applied.
    """
    if not query or not claim_text:
        return 0.0

    # Tokenize both into significant words (3+ chars, lowercased)
    stop_words = {"the", "and", "for", "was", "has", "been", "with", "from",
                  "that", "this", "are", "not", "but", "his", "her", "its",
                  "will", "can", "had", "have", "said", "about", "who", "they"}

    def tokenize(text):
        words = set(re.findall(r'[a-zA-Z]{3,}', text.lower()))
        return words - stop_words

    query_words = tokenize(query)
    claim_words = tokenize(claim_text)

    if not query_words or not claim_words:
        return 0.0

    # Jaccard-like overlap
    overlap = query_words & claim_words
    union = query_words | claim_words

    return len(overlap) / len(union) if union else 0.0


async def verify_claims_with_google(query_text: str) -> dict:
    """
    Search the Google Fact Check Tools API and return structured results.
    Filters out claims that are not relevant to the query (< 30% word overlap).
    """
    if not GOOGLE_API_KEY:
        return {
            "claims": [],
            "verdict_score": 0.0,
            "has_results": False,
            "note": "Google Fact Check API key not configured.",
        }

    url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
    params = {
        "query": query_text,
        "key": GOOGLE_API_KEY,
        "languageCode": "en-US"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            claims = data.get("claims", [])
            parsed_claims = []
            scores = []

            for claim in claims[:8]:  # Check more, filter by relevance
                claim_text = claim.get("text", "")
                relevance = _compute_relevance(query_text, claim_text)

                # Skip claims that are not sufficiently relevant
                if relevance < 0.30:
                    continue

                reviews = claim.get("claimReview", [])
                for review in reviews[:1]:
                    textual_rating = review.get("textualRating", "")
                    score = _normalize_rating(textual_rating)
                    scores.append(score)

                    parsed_claims.append({
                        "text": claim_text,
                        "claimant": claim.get("claimant", ""),
                        "rating": textual_rating,
                        "rating_score": score,
                        "relevance": round(relevance, 2),
                        "publisher": review.get("publisher", {}).get("name", ""),
                        "url": review.get("url", ""),
                        "title": review.get("title", ""),
                    })

            # Only keep the top 3 most relevant
            parsed_claims.sort(key=lambda c: c["relevance"], reverse=True)
            parsed_claims = parsed_claims[:3]
            scores = [c["rating_score"] for c in parsed_claims]

            avg_score = sum(scores) / len(scores) if scores else 0.0

            return {
                "claims": parsed_claims,
                "verdict_score": round(avg_score, 2),
                "has_results": len(parsed_claims) > 0,
            }

        except Exception as e:
            print(f"[WARN] Error calling Fact Check API: {e}")
            return {
                "claims": [],
                "verdict_score": 0.0,
                "has_results": False,
                "note": f"Error: {str(e)}",
            }
