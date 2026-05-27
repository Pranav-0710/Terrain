"""
Terrain analyst agent helpers.
"""

import json
import math
import os
import re
from typing import Any

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

ANALYST_SYSTEM_PROMPT = """You are Terrain Analyst Agent. Extract structured perspective data from real news article text.

Return ONLY valid JSON with this exact schema:
{
  "source": {
    "name": "<string>",
    "country": "<string>",
    "funding_type": "<Independent|Corporate|State-backed|NGO-funded|Mixed>",
    "proximity_score": <integer 0-100>
  },
  "article": {
    "headline": "<string>",
    "summary_ai": "<string>",
    "editorial_frame": "<3-5 word label>",
    "omitted_context": "<string>"
  }
}

Rules:
1. Input may be messy raw article text, excerpt, syndication copy, transcript fragments, or copied web text.
2. Use article text first. If metadata appears in input, use it. If missing, infer minimally and conservatively.
3. Keep `summary_ai` neutral, concrete, 1-2 sentences.
4. Keep `editorial_frame` short, not sentence.
5. `omitted_context` must name meaningful missing context, not repeat article.
6. Use one funding type from allowed enum only.
7. If source geography missing, keep `proximity_score` at 0. Caller may overwrite it.
8. No markdown. No commentary."""

FUNDING_TYPES = {"Independent", "Corporate", "State-backed", "NGO-funded", "Mixed"}


def clean_article_text(article_text: str) -> str:
    text = re.sub(r"\s+", " ", article_text or "").strip()
    return text[:12000]


def calculate_distance_km(
    event_lat: float,
    event_lng: float,
    source_lat: float,
    source_lng: float,
) -> float:
    earth_radius_km = 6371.0

    lat1 = math.radians(event_lat)
    lat2 = math.radians(source_lat)
    delta_lat = math.radians(source_lat - event_lat)
    delta_lng = math.radians(source_lng - event_lng)

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return earth_radius_km * c


def calculate_proximity_score(
    event_lat: float,
    event_lng: float,
    source_lat: float,
    source_lng: float,
) -> int:
    distance_km = calculate_distance_km(event_lat, event_lng, source_lat, source_lng)
    score = 100.0 * math.exp(-distance_km / 5000.0)
    return round(score)


def build_alignment_data(
    event_lat: float,
    event_lng: float,
    source_lat: float,
    source_lng: float,
) -> dict[str, Any]:
    distance_km = calculate_distance_km(event_lat, event_lng, source_lat, source_lng)
    proximity_score = calculate_proximity_score(
        event_lat, event_lng, source_lat, source_lng
    )

    if distance_km <= 1500:
        relative_position = "local"
    elif distance_km <= 6000:
      relative_position = "regional"
    else:
      relative_position = "global"

    return {
        "distance_km": round(distance_km, 2),
        "proximity_score": proximity_score,
        "relative_position": relative_position,
    }


def _fallback_headline(text: str) -> str:
    if not text:
        return "Untitled perspective"

    first_chunk = re.split(r"(?<=[.!?])\s+", text, maxsplit=1)[0]
    return first_chunk[:140].strip(" -:")


def _fallback_summary(text: str) -> str:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    summary = " ".join(sentence for sentence in sentences[:2] if sentence).strip()
    return summary[:320] or "Article text available but summary extraction failed."


def _fallback_omitted_context(text: str) -> str:
    lower_text = text.lower()

    if "history" not in lower_text:
        return "Historical context behind this dispute is not explained."
    if "government" not in lower_text:
        return "Official government rationale is not clearly represented."
    if "opposition" not in lower_text:
        return "Opposing political voices are missing from this account."

    return "Broader counterarguments and comparative context remain underexplored."


def fallback_article_analysis(
    article_text: str,
    source_name: str,
    source_country: str,
    funding_type: str,
) -> dict[str, Any]:
    text = clean_article_text(article_text)
    return {
        "source": {
            "name": source_name or "Unknown source",
            "country": source_country or "Unknown",
            "funding_type": funding_type if funding_type in FUNDING_TYPES else "Mixed",
            "proximity_score": 0,
        },
        "article": {
            "headline": _fallback_headline(text),
            "summary_ai": _fallback_summary(text),
            "editorial_frame": "Context-driven coverage",
            "omitted_context": _fallback_omitted_context(text),
        },
    }


def analyze_article(
    article_text: str,
    *,
    source_name: str,
    source_country: str,
    funding_type: str,
) -> dict[str, Any]:
    text = clean_article_text(article_text)

    if not text:
        return fallback_article_analysis("", source_name, source_country, funding_type)

    if client is None:
        return fallback_article_analysis(text, source_name, source_country, funding_type)

    user_payload = {
        "source_name": source_name,
        "source_country": source_country,
        "funding_type": funding_type,
        "article_text": text,
    }

    try:
        chat_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": ANALYST_SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(user_payload)},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=900,
        )

        raw_json = chat_completion.choices[0].message.content
        parsed = json.loads(raw_json)
        parsed_source = parsed.get("source", {})
        parsed_article = parsed.get("article", {})

        return {
            "source": {
                "name": parsed_source.get("name") or source_name or "Unknown source",
                "country": parsed_source.get("country") or source_country or "Unknown",
                "funding_type": (
                    parsed_source.get("funding_type")
                    if parsed_source.get("funding_type") in FUNDING_TYPES
                    else funding_type if funding_type in FUNDING_TYPES else "Mixed"
                ),
                "proximity_score": parsed_source.get("proximity_score", 0) or 0,
            },
            "article": {
                "headline": parsed_article.get("headline") or _fallback_headline(text),
                "summary_ai": parsed_article.get("summary_ai") or _fallback_summary(text),
                "editorial_frame": parsed_article.get("editorial_frame")
                or "Context-driven coverage",
                "omitted_context": parsed_article.get("omitted_context")
                or _fallback_omitted_context(text),
            },
        }
    except Exception:
        return fallback_article_analysis(text, source_name, source_country, funding_type)
