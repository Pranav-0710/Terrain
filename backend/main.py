"""
Terrain MVP — FastAPI Backend
=============================
POST /api/analyze-event  →  Returns multi-perspective analysis for a
geopolitical event, powered by Groq (Llama 3 70B).
"""

import asyncio
import uuid
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import (
    AnalyzeEventRequest,
    AnalyzeEventResponse,
    Perspective,
    Source,
    Article,
)
from agents import analyze_article, calculate_proximity_score

# ── App Setup ───────────────────────────────────────────────────

app = FastAPI(
    title="Terrain API",
    version="0.2.0",
    description="Geo-anchored, source-transparent news intelligence API.",
)

# Allow the Next.js dev server to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Thread pool for running synchronous Groq calls concurrently
_executor = ThreadPoolExecutor(max_workers=3)


# ── Event & Source Coordinates ────────────────────────────────────────
# Provided by Codex. Used with Haversine formula to compute proximity scores.

EVENT_LAT = 28.6139   # New Delhi (Delimitation Act epicentre)
EVENT_LNG = 77.2090

# (source_lat, source_lng) per article, in order: South, North, International
SOURCE_COORDS = [
    (13.0827, 80.2707),   # The Hindu — Chennai
    (26.8467, 80.9462),   # Dainik Jagran — Lucknow
    (51.5074, -0.1278),   # BBC News — London
]


# ── Simulated Raw Article Texts ─────────────────────────────────
# Three brief simulated news excerpts about the Indian Delimitation Act,
# each written from a distinct editorial perspective.

ARTICLE_PRO_SOUTH = """
SOURCE: The Hindu | Chennai, India
HEADLINE: Demographic success shouldn't mean political marginalisation

The southern states of India — Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, 
and Telangana — are staring at a democratic paradox. Having invested decades in 
public health, education, and family planning, these states successfully brought 
their population growth rates well below the national average. Now, the upcoming 
delimitation exercise threatens to punish them for that very success.

Under the proposed reapportionment, parliamentary seats would be redistributed 
based on the 2026 census. This means the south, with its slower population growth, 
stands to lose dozens of Lok Sabha seats to the more populous northern states. 
Chief Ministers from the region have called this "a penalty for good governance."

Southern states already contribute disproportionately to India's GDP and tax 
revenues. Losing political representation while subsidising the north financially 
has ignited fears of a fiscal and democratic double blow. "We followed the nation's 
policy. Now we are being told our reward is irrelevance," said a senior leader 
from Tamil Nadu.
"""

ARTICLE_PRO_NORTH = """
SOURCE: Dainik Jagran | Lucknow, India
HEADLINE: One Citizen, One Vote: The Need for Fair Representation

For over five decades, the people of Uttar Pradesh, Bihar, Madhya Pradesh, and 
Rajasthan have been denied their rightful share of democratic representation. The 
constitutional freeze on seat allocation, in place since 1976, was meant to be 
temporary. It has instead become a permanent injustice.

Today, a single MP in UP represents nearly 2.5 million people, while an MP in 
Kerala represents under 1.8 million. This is not democracy — it is structural 
inequality dressed in constitutional language.

The principle of "one citizen, one vote" demands that representation reflect 
population. Delimitation is not a favour to the north — it is a constitutional 
correction long overdue. The northern states have borne the burden of 
underrepresentation silently while being labelled as "backward" by those who 
benefit from the freeze. The upcoming census and delimitation commission must 
finally deliver equal weight to every Indian citizen's vote.
"""

ARTICLE_INTERNATIONAL = """
SOURCE: BBC News | London, United Kingdom
HEADLINE: India's looming constitutional crisis over political seats

India faces what analysts describe as its most significant constitutional 
challenge in decades. A scheduled delimitation exercise — the redrawing of 
parliamentary constituency boundaries based on updated population data — has 
exposed a deep fault line between the country's prosperous south and its 
populous north.

Southern states, which successfully controlled population growth and now drive 
much of India's economic output, fear losing parliamentary seats to northern 
states with larger populations but lower per-capita income and development 
indicators.

Northern leaders counter that the current allocation, frozen since 1976, 
fundamentally violates the democratic principle of equal representation. 
"You cannot have a democracy where some votes count more than others," 
said a constitutional scholar at Delhi University.

The dispute has reignited debates about Indian federalism, fiscal transfers 
between states, and whether the country's parliamentary system can accommodate 
the vastly different trajectories of its regions. Some analysts warn that 
mishandling this process could fuel secessionist sentiments in the south.
"""


# ── Endpoints ───────────────────────────────────────────────────

@app.post("/api/analyze-event", response_model=AnalyzeEventResponse)
async def analyze_event(request: AnalyzeEventRequest):
    """
    Analyze a geopolitical event through multiple editorial lenses.

    Sends three simulated article texts to Groq (Llama 3 70B) in parallel
    and returns structured multi-perspective analysis.
    """
    loop = asyncio.get_event_loop()

    try:
        # Run all 3 LLM calls concurrently via thread pool
        results = await asyncio.gather(
            loop.run_in_executor(_executor, analyze_article, ARTICLE_PRO_SOUTH),
            loop.run_in_executor(_executor, analyze_article, ARTICLE_PRO_NORTH),
            loop.run_in_executor(_executor, analyze_article, ARTICLE_INTERNATIONAL),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM analysis failed: {str(e)}")

    # Map raw JSON dicts → Pydantic models, overriding proximity_score
    # with the deterministic Haversine value (not the LLM's guess).
    perspectives = []
    for raw, (src_lat, src_lng) in zip(results, SOURCE_COORDS):
        score = calculate_proximity_score(EVENT_LAT, EVENT_LNG, src_lat, src_lng)
        source_data = {**raw["source"], "proximity_score": score}
        perspective = Perspective(
            source=Source(**source_data),
            article=Article(**raw["article"]),
        )
        perspectives.append(perspective)

    return AnalyzeEventResponse(
        event_id=f"evt_{uuid.uuid4().hex[:12]}",
        event_title="India's Delimitation Act Crisis",
        perspectives=perspectives,
    )


# ── Health Check ────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.2.0"}
