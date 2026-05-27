"""
Terrain analyst agent helpers.
"""

import json
import math
import os
import re
import threading
import time
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

endpoints = []

groq_key = os.getenv("GROQ_API_KEY")
if groq_key:
    endpoints.append({
        "client": OpenAI(api_key=groq_key, base_url="https://api.groq.com/openai/v1", timeout=10.0),
        "model": "llama-3.1-8b-instant"
    })

gemini_key = os.getenv("GEMINI_API_KEY")
if gemini_key:
    endpoints.append({
        "client": OpenAI(api_key=gemini_key, base_url="https://generativelanguage.googleapis.com/v1beta/openai/", timeout=10.0),
        "model": "gemini-2.5-flash"
    })

nvidia_key = os.getenv("NVIDIA_API_KEY")
if nvidia_key:
    endpoints.append({
        "client": OpenAI(api_key=nvidia_key, base_url="https://integrate.api.nvidia.com/v1", timeout=10.0),
        "model": "meta/llama-3.3-70b-instruct"
    })

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
8. No markdown. No commentary.
9. ALL output MUST be in English, regardless of the input language."""

FUNDING_TYPES = {"Independent", "Corporate", "State-backed", "NGO-funded", "Mixed"}


CONTRADICTION_SYSTEM_PROMPT = """You are Terrain Contradiction Engine. Analyze multiple news stories about the same event.
Return ONLY valid JSON with this exact schema:
{
  "consensus": "<short paragraph summarizing agreed-upon facts>",
  "contradictions": ["<string: disagreement 1>", "<string: disagreement 2>"],
  "bias_vectors": "<sentence explaining influence of funding/location>"
}

Rules:
1. Identify common ground (Consensus).
2. Spot factual clashes, numerical discrepancies, or opposing framing (Contradictions).
3. Analyze how source metadata (country, funding) shapes the narrative (Bias Vectors).
4. No markdown. No commentary.
5. ALL output MUST be in English, regardless of the input language."""

# Global lock to serialize LLM calls and prevent 429 Too Many Requests concurrency errors
_llm_lock = threading.Lock()


def _call_llm_with_retries(messages: list[dict], max_tokens: int, temperature: float = 0.2) -> str:
    """Helper to call LLM with automatic fallback to secondary APIs."""
    last_err = None
    with _llm_lock:
        for ep in endpoints:
            try:
                chat_completion = ep["client"].chat.completions.create(
                    model=ep["model"],
                    messages=messages,
                    response_format={"type": "json_object"},
                    temperature=temperature,
                    max_tokens=max_tokens,
                    user="terrain_system",
                )
                time.sleep(0.5)
                message = chat_completion.choices[0].message
                if getattr(message, 'refusal', None):
                    raise Exception(f"Model refused request: {message.refusal}")
                return message.content
            except Exception as e:
                err_str = str(e)
                last_err = e
                if "429" in err_str or "Too Many Requests" in err_str or "404" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    continue
                continue
                
    raise Exception(f"All LLM APIs failed. Last error: {last_err}")


def generate_contradiction_report(stories: list[dict]) -> dict[str, Any]:
    if not stories:
        return {
            "consensus": "No stories available to analyze.",
            "contradictions": [],
            "bias_vectors": "N/A",
        }

    if not endpoints:
        return {
            "consensus": "API client not configured.",
            "contradictions": [],
            "bias_vectors": "N/A",
        }

    # Prepare lightweight payload for LLM
    payload = []
    for s in stories:
        payload.append({
            "source": s.get("source_name"),
            "location": s.get("source_country"),
            "funding": s.get("funding_type"),
            "content": clean_article_text(s.get("content", ""))[:2000] # Trim per story to save context
        })

    try:
        raw_json = _call_llm_with_retries(
            messages=[
                {"role": "system", "content": CONTRADICTION_SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(payload)},
            ],
            temperature=0.1,
            max_tokens=1000,
        )
        return json.loads(raw_json)
    except Exception as exc:
        return {
            "consensus": f"Error generating report: {str(exc)}",
            "contradictions": [],
            "bias_vectors": "N/A",
        }


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
    text: str, source_name: str, source_country: str, funding_type: str
) -> dict[str, Any]:
    return {
        "source": {
            "name": source_name or "Unknown Source",
            "country": source_country or "Unknown",
            "funding_type": funding_type or "Mixed",
            "proximity_score": 0,
        },
        "article": {
            "headline": _fallback_headline(text),
            "summary_ai": _fallback_summary(text),
            "editorial_frame": "Analysis Pending",
            "omitted_context": _fallback_omitted_context(text),
        },
    }


def analyze_article(
    article_text: str,
    source_name: str = "",
    source_country: str = "",
    funding_type: str = "",
) -> dict[str, Any]:
    text = clean_article_text(article_text)
    if not text:
        return fallback_article_analysis(
            "", source_name, source_country, funding_type
        )

    if not endpoints:
        return fallback_article_analysis(
            text, source_name, source_country, funding_type
        )

    user_payload = {
        "source_hints": {
            "name": source_name,
            "country": source_country,
            "funding": funding_type,
        },
        "article_text": text,
    }

    try:
        raw_json = _call_llm_with_retries(
            messages=[
                {"role": "system", "content": ANALYST_SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(user_payload)},
            ],
            temperature=0.2,
            max_tokens=900,
        )

        parsed = json.loads(raw_json)
        parsed_source = parsed.get("source", {})
        parsed_article = parsed.get("article", {})

        final_funding = parsed_source.get("funding_type", "Mixed")
        if final_funding not in FUNDING_TYPES:
            final_funding = "Mixed"

        return {
            "source": {
                "name": parsed_source.get("name") or source_name or "Unknown Source",
                "country": parsed_source.get("country")
                or source_country
                or "Unknown",
                "funding_type": final_funding,
                "proximity_score": 0,
            },
            "article": {
                "headline": parsed_article.get("headline") or _fallback_headline(text),
                "summary_ai": parsed_article.get("summary_ai")
                or _fallback_summary(text),
                "editorial_frame": parsed_article.get("editorial_frame")
                or "Analysis Pending",
                "omitted_context": parsed_article.get("omitted_context")
                or _fallback_omitted_context(text),
            },
        }
    except Exception:
        return fallback_article_analysis(
            text, source_name, source_country, funding_type
        )
