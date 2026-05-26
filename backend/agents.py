"""
Terrain MVP — Analyst Agent
============================
Uses Groq (Llama 3.3 70B) to extract structured perspective analysis
from raw news article text.  Returns JSON matching the Perspective
schema defined in models.py.

Also provides calculate_proximity_score() — Codex's Haversine-based
geographic proximity scorer (0–100 scale).
"""

import json
import math
import os

from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# ── Groq Client ─────────────────────────────────────────────────

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── System Prompt (Codex Analyst Agent) ─────────────────────────
# This is the Analyst Agent system prompt for structured extraction.
# It instructs the LLM to decompose a news article into the exact
# JSON shape our API contract requires.

ANALYST_SYSTEM_PROMPT = """You are the Terrain Analyst Agent — a media intelligence system that deconstructs news articles to expose editorial framing, geographic bias, and omitted context.

## YOUR TASK
Given a raw news article or excerpt, extract a structured JSON analysis.

## OUTPUT SCHEMA (return ONLY this JSON, no markdown, no commentary)
{
  "source": {
    "name": "<string: name of the news outlet>",
    "country": "<string: country or region of the outlet, e.g. 'India (South)', 'United Kingdom'>",
    "funding_type": "<string: one of 'Independent', 'Corporate', 'State-backed', 'NGO-funded', 'Mixed'>",
    "proximity_score": <integer 0-100: how geographically/culturally close the source is to the event. 100 = epicenter, 0 = distant observer>
  },
  "article": {
    "headline": "<string: the article's headline or a faithful reconstruction if not explicit>",
    "summary_ai": "<string: 1-2 sentence neutral summary of the article's core claim>",
    "editorial_frame": "<string: 3-5 word label describing the editorial lens, e.g. 'Penalty for demographic success', 'Democratic equality'>",
    "omitted_context": "<string: 1 sentence identifying a key fact or perspective the article does NOT mention but a well-informed reader would need>"
  }
}

## RULES
1. Be precise. Do not invent facts not present in the text.
2. The editorial_frame must be a SHORT label (3-5 words), not a sentence.
3. The omitted_context must identify what is MISSING — do not repeat what the article says.
4. The proximity_score should reflect the outlet's geographic/cultural distance from the event location, not the article's quality.
5. The funding_type must be exactly one of: Independent, Corporate, State-backed, NGO-funded, Mixed.
6. Return ONLY valid JSON. No markdown fences, no explanation."""


# ── Proximity Scorer (Codex — Haversine Formula) ───────────────

def calculate_proximity_score(
    event_lat: float,
    event_lng: float,
    source_lat: float,
    source_lng: float,
) -> int:
    """
    Calculate a 0–100 proximity score representing how geographically
    close a source is to the event's location.

    Uses the Haversine formula to compute great-circle distance (km),
    then maps that distance to a 0–100 score via exponential decay:
        score = 100 * e^(-distance / SCALE_KM)

    A source at the exact event location scores 100.
    A source ~5,000 km away scores ~37.
    A source ~12,000+ km away approaches 0.
    """
    EARTH_RADIUS_KM = 6371.0
    SCALE_KM = 5000.0  # Distance at which score = 100/e ≈ 37

    lat1 = math.radians(event_lat)
    lat2 = math.radians(source_lat)
    delta_lat = math.radians(source_lat - event_lat)
    delta_lng = math.radians(source_lng - event_lng)

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance_km = EARTH_RADIUS_KM * c

    score = 100.0 * math.exp(-distance_km / SCALE_KM)
    return round(score)


# ── Analysis Function ───────────────────────────────────────────

def analyze_article(article_text: str) -> dict:
    """
    Send a raw article to Groq (Llama 3 70B) and get back structured
    perspective JSON matching the Terrain API contract.
    """
    chat_completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": ANALYST_SYSTEM_PROMPT},
            {"role": "user", "content": article_text},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,  # Low temp for consistent structured output
        max_tokens=1024,
    )

    raw_json = chat_completion.choices[0].message.content
    return json.loads(raw_json)
