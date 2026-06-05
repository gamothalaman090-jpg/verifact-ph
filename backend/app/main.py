from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import asyncio

from app.services.nlp_service import nlp_service
from app.services.fact_checker import verify_claims_with_google
from app.services.news_search import search_news, compute_corroboration_score, get_url_credibility
from app.services.verdict_engine import compute_verdict
from app.services.url_scraper import is_url, scrape_article
from app.services.wikipedia_service import search_wikipedia

@asynccontextmanager
async def lifespan(app: FastAPI):
    await asyncio.to_thread(nlp_service.load_model)
    yield

app = FastAPI(title="VeriFact API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    import os
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    google_key = os.getenv("GOOGLE_FACT_CHECK_API_KEY", "")
    return {
        "status": "ok",
        "gemini_key_loaded": bool(gemini_key),
        "gemini_key_preview": gemini_key[:6] + "..." if gemini_key else "NOT SET",
        "google_key_loaded": bool(google_key),
    }

@app.get("/test-gemini")
async def test_gemini():
    """Quick diagnostic: send a trivial prompt to Gemini and report what happens."""
    import os, httpx
    key = os.getenv("GEMINI_API_KEY", "")
    if not key:
        return {"error": "GEMINI_API_KEY not set"}
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    payload = {"contents": [{"parts": [{"text": "Reply with the single word: hello"}]}]}
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(f"{url}?key={key}", json=payload)
        return {"status_code": resp.status_code, "body": resp.json()}
    except Exception as e:
        return {"error": str(e)}

class ArticleRequest(BaseModel):
    text: str

@app.post("/analyze")
async def analyze_article(payload: ArticleRequest):
    input_text = payload.text.strip()
    source_info = None
    source_url = None

    # ── Step 1: If URL, scrape article content ──
    if is_url(input_text):
        source_url = input_text
        scrape_result = await scrape_article(input_text)
        if not scrape_result["success"]:
            return {"error": scrape_result["error"]}

        analysis_text = scrape_result["text"]
        source_info = {
            "type": "url",
            "source_url": scrape_result["source_url"],
            "title": scrape_result["title"],
            "extracted_length": len(analysis_text),
            "partial": scrape_result.get("partial", False),
            "from_slug": scrape_result.get("from_slug", False),
        }
    else:
        analysis_text = input_text

    # ── Step 2: Build search query ──
    search_query = (
        source_info["title"] if source_info and source_info["title"]
        else analysis_text[:200]
    )

    # ── Step 3: Run ALL verification tools in parallel ──
    factcheck_task = verify_claims_with_google(search_query)
    ai_task = asyncio.to_thread(nlp_service.analyze_text, analysis_text)
    news_task = asyncio.to_thread(search_news, search_query)
    wiki_task = search_wikipedia(search_query)

    factcheck_result, ai_result, web_results, wiki_result = await asyncio.gather(
        factcheck_task, ai_task, news_task, wiki_task
    )

    # ── Step 4: Compute corroboration ──
    if source_url:
        url_cred = get_url_credibility(source_url)
        web_corr = compute_corroboration_score(web_results)

        if web_corr["total_count"] > 0:
            merged_score = max(url_cred["score"], web_corr["score"])
            merged_sources = url_cred["top_sources"] + web_corr["top_sources"]
            corroboration = {
                "score": merged_score,
                "credible_count": url_cred["credible_count"] + web_corr["credible_count"],
                "total_count": url_cred["total_count"] + web_corr["total_count"],
                "top_sources": merged_sources[:5],
                "has_factcheck": url_cred["has_factcheck"] or web_corr["has_factcheck"],
            }
        else:
            corroboration = url_cred
    else:
        corroboration = compute_corroboration_score(web_results)

    # ── Step 5: Compute composite verdict (Gemini AI → fallback rules) ──
    verdict = await compute_verdict(
        claim_text=analysis_text,
        factcheck_result=factcheck_result,
        corroboration_result=corroboration,
        ai_detection=ai_result,
        wikipedia_result=wiki_result,
        source_info=source_info,
    )

    # ── Step 6: Build response ──
    response = {
        "verdict": verdict["verdict"],
        "verdict_score": verdict["verdict_score"],
        "verdict_color": verdict["verdict_color"],
        "evidence": verdict["evidence"],
        "explanation": verdict.get("explanation", ""),
        "evidence_analysis": verdict.get("evidence_analysis", []),
        "engine": verdict.get("engine", "fallback"),
        "web_sources": verdict.get("web_sources", []),
    }

    if source_info:
        response["source"] = source_info

    return response


