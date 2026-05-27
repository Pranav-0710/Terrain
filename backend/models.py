"""
Pydantic models for Terrain API.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Coordinates(BaseModel):
    lat: float
    lng: float


class EventMarker(BaseModel):
    id: str
    title: str
    lat: float
    lng: float
    created_at: datetime
    story_count: int = Field(default=0, ge=0)


class AlignmentData(BaseModel):
    distance_km: float = Field(..., ge=0)
    proximity_score: int = Field(..., ge=0, le=100)
    relative_position: Literal["local", "regional", "global"]


class Source(BaseModel):
    id: str
    name: str
    country: str
    funding_type: str
    proximity_score: int = Field(..., ge=0, le=100)
    distance_km: float = Field(..., ge=0)
    lat: float
    lng: float


class Article(BaseModel):
    headline: str
    summary_ai: str
    editorial_frame: str
    omitted_context: str
    content: str


class Perspective(BaseModel):
    story_id: str
    created_at: datetime
    url: str | None = None
    alignment: AlignmentData
    source: Source
    article: Article


class EventPerspectiveResponse(BaseModel):
    event_id: str
    event_title: str
    event_coordinates: Coordinates
    perspectives: list[Perspective]


class IngestCoordinates(BaseModel):
    lat: float
    lng: float


class IngestSourceInput(BaseModel):
    name: str
    country: str = "Unknown"
    funding_type: str = "Unknown"
    coordinates: IngestCoordinates


class IngestEventInput(BaseModel):
    id: str | None = None
    title: str
    coordinates: IngestCoordinates


class IngestArticleInput(BaseModel):
    event: IngestEventInput
    source: IngestSourceInput
    url: str | None = None
    content: str = Field(min_length=1)
    published_at: datetime | None = None


class IngestResult(BaseModel):
    event_id: str
    story_id: str
    source_id: str
    created_event: bool
    created_source: bool
    created_story: bool
    alignment: AlignmentData


class BatchIngestRequest(BaseModel):
    articles: list[IngestArticleInput] = Field(min_length=1)


class BatchIngestResponse(BaseModel):
    inserted: int = Field(ge=0)
    updated: int = Field(ge=0)
    results: list[IngestResult]


class ExternalSyncRequest(BaseModel):
    limit: int = Field(default=25, ge=1, le=100)
    gdelt_timespan_minutes: int = Field(default=120, ge=15, le=1440)
    gdelt_maxrows: int = Field(default=500, ge=1, le=5000)


class ExternalSyncResponse(BaseModel):
    attempted: int = Field(ge=0)
    inserted: int = Field(ge=0)
    updated: int = Field(ge=0)
    gdelt_matches: int = Field(ge=0)
    rss_only: int = Field(ge=0)
    failed_feeds: list[str]
    results: list[IngestResult]
