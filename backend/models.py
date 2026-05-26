"""
Pydantic models for the Terrain MVP API.

These models define the exact contract between the FastAPI backend
and the Next.js frontend, matching the schema in API_CONTRACT.md.
"""

from pydantic import BaseModel, Field


# ── Request Models ──────────────────────────────────────────────

class Coordinates(BaseModel):
    lat: float
    lng: float


class AnalyzeEventRequest(BaseModel):
    event_topic: str
    coordinates: Coordinates


# ── Response Models ─────────────────────────────────────────────

class Source(BaseModel):
    name: str
    country: str
    funding_type: str
    proximity_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="0 = far from event, 100 = epicenter",
    )


class Article(BaseModel):
    headline: str
    summary_ai: str
    editorial_frame: str
    omitted_context: str


class Perspective(BaseModel):
    source: Source
    article: Article


class AnalyzeEventResponse(BaseModel):
    event_id: str
    event_title: str
    perspectives: list[Perspective]
