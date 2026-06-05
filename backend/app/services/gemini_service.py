"""
Gemini AI Verdict Synthesis Service
Sends all gathered evidence to the Gemini API and receives an AI-synthesized
verdict with explanation and per-source analysis.
Falls back gracefully if the API is unavailable.
"""

import os
import json
import time
import httpx
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-2.5-flash-lite"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


def _build_evidence_prompt(
    claim_text: str,
    factcheck_result: dict,
    corroboration_result: dict,
    wikipedia_result: dict,
    ai_detection: dict | None = None,
    source_info: dict | None = None,
) -> str:
    """
    Build a structured prompt that presents all evidence to Gemini.
    """

    # Format fact-check claims
    fc_section = "No existing fact-checker verdicts found."
    if factcheck_result.get("has_results"):
        claims = factcheck_result.get("claims", [])
        fc_lines = []
        for c in claims:
            fc_lines.append(
                f'  - Claim: "{c.get("text", "")}" | '
                f'Rating: {c.get("rating", "N/A")} | '
                f'Publisher: {c.get("publisher", "Unknown")} | '
                f'Relevance: {c.get("relevance", "N/A")}'
            )
        fc_section = "\n".join(fc_lines)

    # Format news corroboration
    corr_section = "No news corroboration data found."
    top_sources = corroboration_result.get("top_sources", [])
    if top_sources:
        corr_lines = [
            f"  Found {corroboration_result.get('credible_count', 0)} credible "
            f"source(s) out of {corroboration_result.get('total_count', 0)} results. "
            f"Corroboration score: {corroboration_result.get('score', 0.5)}"
        ]
        for s in top_sources[:5]:
            corr_lines.append(
                f'  - {s.get("name", "Unknown")} (trust: {s.get("trust", 0.5)}) — '
                f'"{s.get("title", "")}"'
            )
        corr_section = "\n".join(corr_lines)

    # Format Wikipedia results
    wiki_section = "No relevant Wikipedia articles found."
    if wikipedia_result.get("has_results"):
        wiki_lines = []
        for a in wikipedia_result.get("articles", [])[:3]:
            wiki_lines.append(
                f'  - "{a.get("title", "")}" — {a.get("snippet", "")}'
            )
        wiki_section = "\n".join(wiki_lines)

    # Format AI detection
    ai_section = "AI detection not available."
    if ai_detection:
        prediction = ai_detection.get("prediction", "N/A")
        confidence = ai_detection.get("confidence", 0)
        ai_section = f"Prediction: {prediction} (confidence: {confidence:.2f})"

    # Format source credibility
    source_section = "No source URL provided (raw text input)."
    if source_info:
        source_section = (
            f"Source: {source_info.get('title', 'Unknown')} | "
            f"URL: {source_info.get('source_url', 'N/A')}"
        )

    prompt = f"""You are a professional fact-checking verdict engine. Analyze the claim below against all the gathered evidence and return a structured JSON verdict.

CLAIM TO VERIFY:
"{claim_text[:1000]}"

EVIDENCE GATHERED FROM MULTIPLE SOURCES:

1. PROFESSIONAL FACT-CHECKER VERDICTS (from Google Fact Check API):
{fc_section}

2. NEWS CORROBORATION (from DuckDuckGo News Search):
{corr_section}

3. WIKIPEDIA REFERENCE (cross-checking facts and entities):
{wiki_section}

4. AI-GENERATED TEXT DETECTION (informational only):
{ai_section}

5. SOURCE INFORMATION:
{source_section}

ANALYSIS INSTRUCTIONS:
- Weigh professional fact-checker verdicts (source 1) MOST heavily — they are the gold standard
- Multiple credible news outlets reporting the same story significantly increases confidence
- Use Wikipedia to verify specific entities, dates, and statistics mentioned in the claim
- AI detection (source 4) is INFORMATIONAL ONLY — do NOT factor it into the verdict score
- If evidence conflicts across sources, explain the conflict clearly
- Be conservative: only mark as VERIFIED if strong evidence explicitly supports it
- If no substantial evidence is found, mark as UNVERIFIED (not FALSE)

RESPOND WITH ONLY THIS JSON (no markdown fences, no extra text):
{{
  "verdict": "VERIFIED" or "LIKELY TRUE" or "UNVERIFIED" or "LIKELY FALSE" or "FALSE",
  "confidence_score": 0.0 to 1.0,
  "explanation": "2-3 sentence explanation of the verdict based on the evidence.",
  "evidence_analysis": [
    {{
      "source": "Fact-Checkers",
      "finding": "Brief description of what this source found",
      "impact": "positive" or "negative" or "neutral" or "unavailable"
    }},
    {{
      "source": "News Corroboration",
      "finding": "Brief description of what this source found",
      "impact": "positive" or "negative" or "neutral" or "unavailable"
    }},
    {{
      "source": "Wikipedia",
      "finding": "Brief description of what this source found",
      "impact": "positive" or "negative" or "neutral" or "unavailable"
    }},
    {{
      "source": "AI Detection",
      "finding": "Brief description of what this source found",
      "impact": "neutral"
    }}
  ]
}}"""
    return prompt


async def synthesize_verdict_with_gemini(
    claim_text: str,
    factcheck_result: dict,
    corroboration_result: dict,
    wikipedia_result: dict,
    ai_detection: dict | None = None,
    source_info: dict | None = None,
) -> dict | None:
    """
    Send all evidence to Gemini and get an AI-synthesized verdict.
    Returns None if the API is unavailable or fails.
    """
    if not GEMINI_API_KEY:
        print("[WARN] No GEMINI_API_KEY configured. Using fallback engine.")
        return None

    prompt = _build_evidence_prompt(
        claim_text=claim_text,
        factcheck_result=factcheck_result,
        corroboration_result=corroboration_result,
        wikipedia_result=wikipedia_result,
        ai_detection=ai_detection,
        source_info=source_info,
    )

    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ],
        "generationConfig": {
            "temperature": 0.2,
            "topP": 0.8,
            "maxOutputTokens": 1024,
            "responseMimeType": "application/json",
        },
    }

    try:
        t_start = time.monotonic()
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{GEMINI_URL}?key={GEMINI_API_KEY}",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

        elapsed = time.monotonic() - t_start
        print(f"[INFO] Gemini API responded in {elapsed:.2f}s (status {response.status_code})")

        if response.status_code == 403:
            print("[WARN] Gemini API returned 403. API may not be enabled in Google Cloud. Using fallback engine.")
            return None

        if response.status_code == 429:
            print("[WARN] Gemini API returned 429 (rate limit / quota exhausted). Using fallback engine.")
            return None

        response.raise_for_status()
        data = response.json()


        # Extract the generated text
        candidates = data.get("candidates", [])
        if not candidates:
            print("[WARN] Gemini returned no candidates. Using fallback engine.")
            return None

        raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")

        if not raw_text.strip():
            print("[WARN] Gemini returned empty response. Using fallback engine.")
            return None

        # Parse the JSON response
        # Strip markdown fences if Gemini adds them despite instructions
        clean_text = raw_text.strip()
        if clean_text.startswith("```"):
            clean_text = clean_text.split("\n", 1)[1] if "\n" in clean_text else clean_text
        if clean_text.endswith("```"):
            clean_text = clean_text.rsplit("```", 1)[0]
        clean_text = clean_text.strip()

        result = json.loads(clean_text)

        # Validate required fields
        verdict = result.get("verdict", "UNVERIFIED")
        valid_verdicts = {"VERIFIED", "LIKELY TRUE", "UNVERIFIED", "LIKELY FALSE", "FALSE"}
        if verdict not in valid_verdicts:
            verdict = "UNVERIFIED"

        confidence = result.get("confidence_score", 0.5)
        if not isinstance(confidence, (int, float)):
            confidence = 0.5
        confidence = max(0.0, min(1.0, float(confidence)))

        return {
            "verdict": verdict,
            "confidence_score": round(confidence, 3),
            "explanation": result.get("explanation", "AI analysis completed but no explanation was provided."),
            "evidence_analysis": result.get("evidence_analysis", []),
            "engine": "gemini",
        }

    except json.JSONDecodeError as e:
        print(f"[WARN] Failed to parse Gemini JSON response: {e}")
        return None
    except httpx.TimeoutException as e:
        print(f"[WARN] Gemini API request timed out after 60s: {type(e).__name__}: {e}")
        return None
    except Exception as e:
        print(f"[WARN] Gemini API error ({type(e).__name__}): {e}")
        return None

