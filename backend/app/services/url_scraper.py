"""
URL Scraper Service
Detects URLs in user input and fetches actual article content for analysis.
Handles JavaScript-rendered sites and bot-blocking with multiple strategies.
"""

import re
import httpx
from bs4 import BeautifulSoup

# Regex to detect if input is a URL
URL_PATTERN = re.compile(
    r'^https?://'                # http:// or https://
    r'(?:[a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}'  # domain
    r'(?:/[^\s]*)?$',           # optional path
    re.IGNORECASE
)

# Realistic browser headers to avoid bot-blocking
BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
}


def is_url(text: str) -> bool:
    """Check if the input text is a URL."""
    stripped = text.strip()
    return bool(URL_PATTERN.match(stripped))


def _extract_meta_content(soup: BeautifulSoup) -> dict:
    """
    Extract article info from meta tags (OpenGraph, Twitter Cards, etc.)
    Works even on JS-rendered pages that include meta tags in initial HTML.
    """
    title = ""
    description = ""
    
    # Try multiple meta tag sources for title
    for attr_pair in [
        ("property", "og:title"),
        ("name", "twitter:title"),
        ("name", "title"),
    ]:
        tag = soup.find("meta", attrs={attr_pair[0]: attr_pair[1]})
        if tag and tag.get("content"):
            title = tag["content"].strip()
            break
    
    if not title and soup.title and soup.title.string:
        title = soup.title.string.strip()

    # Try multiple meta tag sources for description/content
    for attr_pair in [
        ("property", "og:description"),
        ("name", "twitter:description"),
        ("name", "description"),
    ]:
        tag = soup.find("meta", attrs={attr_pair[0]: attr_pair[1]})
        if tag and tag.get("content"):
            description = tag["content"].strip()
            break

    return {"title": title, "description": description}


def _extract_body_text(soup: BeautifulSoup) -> str:
    """Extract main article text from the page body."""
    # Remove noise elements
    for tag in soup(["script", "style", "nav", "footer", "header",
                     "aside", "form", "iframe", "noscript", "svg",
                     "figure", "figcaption", "button", "input",
                     "menu", "dialog"]):
        tag.decompose()

    # Strategy 1: Look for <article> tag
    article_text = ""
    article_tag = soup.find("article")
    if article_tag:
        paragraphs = article_tag.find_all("p")
        article_text = "\n".join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))

    # Strategy 2: Look for common article containers
    if not article_text or len(article_text) < 100:
        for selector in [
            {"class_": re.compile(r"article[-_]?(body|content|text)", re.I)},
            {"class_": re.compile(r"(story|post)[-_]?(body|content|text)", re.I)},
            {"class_": re.compile(r"entry[-_]?content", re.I)},
            {"class_": re.compile(r"(news|main)[-_]?content", re.I)},
            {"id": re.compile(r"article[-_]?(body|content)", re.I)},
            {"id": re.compile(r"(story|news)[-_]?(body|content)", re.I)},
        ]:
            container = soup.find("div", **selector)
            if container:
                paragraphs = container.find_all("p")
                candidate = "\n".join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))
                if len(candidate) > len(article_text):
                    article_text = candidate

    # Strategy 3: Fallback — collect all <p> tags from body
    if not article_text or len(article_text) < 100:
        body = soup.find("body")
        if body:
            paragraphs = body.find_all("p")
            article_text = "\n".join(
                p.get_text(strip=True) for p in paragraphs
                if len(p.get_text(strip=True)) > 40
            )

    return article_text


async def scrape_article(url: str) -> dict:
    """
    Fetch a URL and extract the main article text.
    Returns dict with 'text', 'title', 'source_url', and 'success' keys.
    Uses meta tag extraction as fallback for JS-heavy or bot-blocking sites.
    """
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=20.0) as client:
            response = await client.get(url.strip(), headers=BROWSER_HEADERS)
            response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # Always extract meta information (works on almost all sites)
        meta = _extract_meta_content(soup)
        title = meta["title"]

        # Try to get full body text
        body_text = _extract_body_text(soup)

        # If body extraction failed, use meta description as content
        if not body_text or len(body_text) < 50:
            if meta["description"] and len(meta["description"]) > 30:
                body_text = meta["description"]
                # If we only have meta description, note it
                return {
                    "success": True,
                    "text": body_text,
                    "title": title,
                    "source_url": url,
                    "partial": True,
                }

        if not body_text or len(body_text) < 30:
            return {
                "success": False,
                "text": "",
                "title": title,
                "source_url": url,
                "error": "Could not extract meaningful article content. The site may require JavaScript or block automated access."
            }

        return {
            "success": True,
            "text": body_text,
            "title": title,
            "source_url": url,
        }

    except httpx.TimeoutException:
        return {"success": False, "text": "", "title": "", "source_url": url,
                "error": "Request timed out while fetching the article."}
    except httpx.HTTPStatusError as e:
        # For 403/captcha pages, try extracting from the slug
        if e.response.status_code in (403, 429):
            slug_text = _extract_from_slug(url)
            if slug_text:
                return {
                    "success": True,
                    "text": slug_text,
                    "title": slug_text,
                    "source_url": url,
                    "partial": True,
                    "from_slug": True,
                }
        return {"success": False, "text": "", "title": "", "source_url": url,
                "error": f"The website returned HTTP {e.response.status_code}. It may be blocking automated access."}
    except Exception as e:
        return {"success": False, "text": "", "title": "", "source_url": url,
                "error": f"Failed to fetch article: {str(e)}"}


def _extract_from_slug(url: str) -> str:
    """
    Extract a human-readable claim from the URL slug as a last resort.
    e.g. 'icc-appeals-chamber-to-issue-decision-on-duterte-jurisdiction' -> readable text
    """
    from urllib.parse import urlparse
    path = urlparse(url).path
    # Get the last meaningful segment
    segments = [s for s in path.strip("/").split("/") if s and not s.isdigit() and len(s) > 5]
    if segments:
        slug = segments[-1]
        # Convert slug to readable text
        text = slug.replace("-", " ").replace("_", " ")
        # Capitalize first letter
        text = text[0].upper() + text[1:] if text else text
        return text
    return ""
