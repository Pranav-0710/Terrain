"""
Terrain API.
"""

import asyncio
import json
import logging
import os
import socket
from contextlib import contextmanager
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from urllib.parse import urlparse, urlunparse

import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from agents import (
    analyze_article,
    build_alignment_data,
    calculate_distance_km,
    evaluate_event_match,
    generate_contradiction_report,
)
from ingestion import sync_external_news
from models import (
    Article,
    BatchIngestRequest,
    BatchIngestResponse,
    ContradictionReport,
    EventMarker,
    EventPerspectiveResponse,
    ExternalSyncRequest,
    ExternalSyncResponse,
    IngestArticleInput,
    IngestResult,
    Perspective,
    Source,
)

app = FastAPI(
    title="Terrain API",
    version="0.3.0",
    description="Geo-anchored, source-transparent news intelligence API.",
)

logger = logging.getLogger("terrain.api")

cors_origins_str = os.getenv("CORS_ALLOWED_ORIGINS", "*")
allowed_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
allow_credentials = "*" not in allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

_executor = ThreadPoolExecutor(max_workers=4)
_sync_task: asyncio.Task | None = None


def get_db_url() -> str:
    db_url = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
    if not db_url:
        raise HTTPException(
            status_code=500,
            detail="Database URL missing. Set SUPABASE_DB_URL or DATABASE_URL.",
        )
    return db_url


def get_auto_sync_enabled() -> bool:
    return os.getenv("AUTO_SYNC_ENABLED", "false").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


def build_auto_sync_request() -> ExternalSyncRequest:
    return ExternalSyncRequest(
        limit=int(os.getenv("AUTO_SYNC_LIMIT", "25")),
        gdelt_timespan_minutes=int(os.getenv("AUTO_SYNC_GDELT_TIMESPAN_MINUTES", "120")),
        gdelt_maxrows=int(os.getenv("AUTO_SYNC_GDELT_MAXROWS", "500")),
    )


def get_auto_sync_interval_seconds() -> int:
    minutes = int(os.getenv("AUTO_SYNC_INTERVAL_MINUTES", "20"))
    return max(15, minutes) * 60


@contextmanager
def get_connection():
    """Connect to the database, resolving IPv6 if no IPv4 record exists."""
    db_url = get_db_url()
    parsed = urlparse(db_url)
    hostname = parsed.hostname

    # Try to resolve the host — prefer IPv6 since Supabase direct hosts
    # often only have AAAA records and no A records.
    try:
        # Try IPv4 first
        infos = socket.getaddrinfo(hostname, parsed.port or 5432, socket.AF_INET)
        resolved_ip = infos[0][4][0]
    except socket.gaierror:
        # Fall back to IPv6
        infos = socket.getaddrinfo(hostname, parsed.port or 5432, socket.AF_INET6)
        resolved_ip = infos[0][4][0]

    # Rebuild the URL with the resolved IP (bracket IPv6 addresses)
    if ":" in resolved_ip:
        netloc_host = f"[{resolved_ip}]"
    else:
        netloc_host = resolved_ip

    # Reconstruct netloc: user:pass@host:port
    userinfo = ""
    if parsed.username:
        userinfo = parsed.username
        if parsed.password:
            userinfo += f":{parsed.password}"
        userinfo += "@"

    port = parsed.port or 5432
    new_netloc = f"{userinfo}{netloc_host}:{port}"
    resolved_url = urlunparse(parsed._replace(netloc=new_netloc))

    conn = psycopg2.connect(resolved_url, cursor_factory=RealDictCursor)
    try:
        yield conn
    finally:
        conn.close()


def fetch_event_markers_from_db():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                WITH ranked_events AS (
                    SELECT
                        e.id,
                        e.title,
                        e.lat,
                        e.lng,
                        e.created_at,
                        COUNT(st.id)::int AS story_count
                    FROM events e
                    LEFT JOIN stories st ON st.event_id = e.id
                    GROUP BY e.id
                    ORDER BY COUNT(st.id) DESC, e.created_at DESC
                    LIMIT 100
                )
                SELECT
                    id::text,
                    title,
                    lat,
                    lng,
                    created_at,
                    story_count
                FROM ranked_events
                ORDER BY story_count DESC, created_at DESC
                """
            )
            events = cur.fetchall()

            cur.execute(
                """
                WITH ranked_events AS (
                    SELECT e.id
                    FROM events e
                    LEFT JOIN stories st ON st.event_id = e.id
                    GROUP BY e.id
                    ORDER BY COUNT(st.id) DESC, e.created_at DESC
                    LIMIT 100
                )
                SELECT
                    re.id::text AS event_id,
                    CASE
                        WHEN src.lat IS NULL OR src.lng IS NULL THEN 'Unknown'
                        WHEN src.lng <= -30 THEN 'Americas'
                        WHEN src.lng BETWEEN 30 AND 60 AND src.lat BETWEEN 12 AND 42 THEN 'Middle East'
                        WHEN src.lng BETWEEN -25 AND 45 AND src.lat >= 36 THEN 'Europe'
                        WHEN src.lng BETWEEN -20 AND 50 AND src.lat BETWEEN -35 AND 35 THEN 'Africa'
                        WHEN src.lng BETWEEN 60 AND 150 AND src.lat >= 5 THEN 'Asia'
                        WHEN src.lng BETWEEN 110 AND 180 AND src.lat < 5 THEN 'Oceania'
                        ELSE 'Other'
                    END AS region,
                    COUNT(DISTINCT st.source_id)::int AS source_count
                FROM ranked_events re
                LEFT JOIN stories st ON st.event_id = re.id
                LEFT JOIN sources src ON src.id = st.source_id
                WHERE st.source_id IS NOT NULL
                GROUP BY re.id, region
                """
            )
            diversity_rows = cur.fetchall()

    diversity_by_event: dict[str, list[dict]] = {}
    for row in diversity_rows:
        event_id = row["event_id"]
        diversity_by_event.setdefault(event_id, []).append(
            {"region": row["region"], "count": row["source_count"]}
        )

    for event in events:
        event["source_diversity"] = sorted(
            diversity_by_event.get(event["id"], []),
            key=lambda slice_: slice_["count"],
            reverse=True,
        )

    return events


def fetch_event_with_stories(event_id: str):
    event_query = """
        SELECT
            id::text,
            title,
            lat,
            lng,
            ai_contradiction_report,
            report_story_count
        FROM events
        WHERE id = %s
        LIMIT 1
    """

    stories_query = """
        SELECT
            st.id::text AS story_id,
            st.url,
            st.content,
            st.created_at,
            st.ai_analysis,
            src.id::text AS source_id,
            src.name AS source_name,
            COALESCE(src.country, 'Unknown') AS source_country,
            COALESCE(src.funding_type, 'Mixed') AS funding_type,
            COALESCE(src.political_lean, 'Unknown') AS political_lean,
            COALESCE(src.press_freedom_score, 50) AS press_freedom_score,
            src.lat AS source_lat,
            src.lng AS source_lng
        FROM stories st
        JOIN sources src ON src.id = st.source_id
        WHERE st.event_id = %s
        ORDER BY st.created_at DESC
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(event_query, (event_id,))
            event = cur.fetchone()

            if event is None:
                return None, []

            cur.execute(stories_query, (event_id,))
            stories = cur.fetchall()
            return event, stories


STOP_WORDS = {
    "about", "after", "also", "amid", "back", "been", "being", "could",
    "daily", "days", "does", "down", "during", "even", "ever", "every",
    "first", "five", "from", "gets", "gets", "going", "have", "here",
    "into", "just", "last", "latest", "like", "live", "look", "made",
    "make", "many", "more", "most", "much", "must", "near", "need",
    "news", "next", "only", "open", "over", "says", "show", "some",
    "such", "take", "tell", "tells", "than", "that", "them", "then",
    "they", "this", "told", "very", "want", "were", "what", "when",
    "will", "with", "world", "year", "years", "your",
}


def upsert_event(cur, article: IngestArticleInput):
    event = article.event
    import re

    if event.id:
        cur.execute(
            """
            UPDATE events
            SET title = %s, lat = %s, lng = %s
            WHERE id = %s
            RETURNING id::text, title, lat, lng
            """,
            (
                event.title,
                event.coordinates.lat,
                event.coordinates.lng,
                event.id,
            ),
        )
        existing = cur.fetchone()
        if existing:
            return existing, False

    # Fetch recent events for clustering
    cur.execute(
        """
        SELECT id::text, title, lat, lng
        FROM events
        ORDER BY created_at DESC
        LIMIT 50
        """
    )
    recent_events = cur.fetchall()

    # Semantic Clustering via LLM
    match_result = evaluate_event_match(article.content or event.title, recent_events)
    if match_result["match"] and match_result["event_id"]:
        for ev in recent_events:
            if ev["id"] == match_result["event_id"]:
                return ev, False

    # Fallback: Keyword matching (only if LLM match failed)
    best_match = None
    best_score = 0.0

    def extract_keywords(text: str) -> set[str]:
        words = set(re.findall(r'[a-zA-Z]+', text.lower()))
        return {w for w in words if len(w) > 3 and w not in STOP_WORDS}

    article_kw = extract_keywords(event.title)

    if article_kw:
        for ev in recent_events:
            ev_kw = extract_keywords(ev["title"])
            if not ev_kw:
                continue

            overlap = len(article_kw & ev_kw)
            if overlap < 2:
                continue

            # Jaccard-like: overlap relative to the smaller set
            score = overlap / min(len(article_kw), len(ev_kw))

            if score >= 0.4 and score > best_score:
                best_score = score
                best_match = ev

    if best_match:
        return best_match, False

    cur.execute(
        """
        INSERT INTO events (title, lat, lng)
        VALUES (%s, %s, %s)
        RETURNING id::text, title, lat, lng
        """,
        (event.title, event.coordinates.lat, event.coordinates.lng),
    )

    return cur.fetchone(), True


def upsert_source(cur, article: IngestArticleInput):
    source = article.source

    cur.execute(
        """
        SELECT id::text, name, country, funding_type, political_lean, press_freedom_score, lat, lng
        FROM sources
        WHERE LOWER(name) = LOWER(%s)
          AND LOWER(COALESCE(country, '')) = LOWER(%s)
        LIMIT 1
        """,
        (source.name, source.country),
    )
    existing = cur.fetchone()
    if existing:
        cur.execute(
            """
            UPDATE sources
            SET funding_type = %s, political_lean = %s, press_freedom_score = %s, lat = %s, lng = %s
            WHERE id = %s
            RETURNING id::text, name, country, funding_type, political_lean, press_freedom_score, lat, lng
            """,
            (
                source.funding_type,
                source.political_lean,
                source.press_freedom_score,
                source.coordinates.lat,
                source.coordinates.lng,
                existing["id"],
            ),
        )
        return cur.fetchone(), False

    cur.execute(
        """
        INSERT INTO sources (name, country, funding_type, political_lean, press_freedom_score, lat, lng)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id::text, name, country, funding_type, political_lean, press_freedom_score, lat, lng
        """,
        (
            source.name,
            source.country,
            source.funding_type,
            source.political_lean,
            source.press_freedom_score,
            source.coordinates.lat,
            source.coordinates.lng,
        ),
    )
    return cur.fetchone(), True


def upsert_story(
    cur,
    article: IngestArticleInput,
    event_id: str,
    source_id: str,
    proximity_score: int,
    ai_analysis_json: str | None = None,
):
    if article.url:
        cur.execute(
            """
            SELECT id::text
            FROM stories
            WHERE url = %s
            LIMIT 1
            """,
            (article.url,),
        )
        existing = cur.fetchone()
        if existing:
            cur.execute(
                """
                UPDATE stories
                SET
                    event_id = %s,
                    source_id = %s,
                    content = %s,
                    proximity_score = %s,
                    ai_analysis = COALESCE(%s::jsonb, ai_analysis),
                    created_at = COALESCE(%s, created_at)
                WHERE id = %s
                RETURNING id::text
                """,
                (
                    event_id,
                    source_id,
                    article.content,
                    proximity_score,
                    ai_analysis_json,
                    article.published_at,
                    existing["id"],
                ),
            )
            return cur.fetchone()["id"], False

    cur.execute(
        """
        INSERT INTO stories (event_id, source_id, content, url, proximity_score, ai_analysis, created_at)
        VALUES (%s, %s, %s, %s, %s, %s::jsonb, COALESCE(%s, CURRENT_TIMESTAMP))
        RETURNING id::text
        """,
        (
            event_id,
            source_id,
            article.content,
            article.url,
            proximity_score,
            ai_analysis_json,
            article.published_at,
        ),
    )
    return cur.fetchone()["id"], True


def ingest_article(article: IngestArticleInput) -> IngestResult:
    analysis = analyze_article(
        article.content,
        source_name=article.source.name,
        source_country=article.source.country,
        funding_type=article.source.funding_type,
    )
    
    with get_connection() as conn:
        with conn.cursor() as cur:
            event_row, created_event = upsert_event(cur, article)
            source_row, created_source = upsert_source(cur, article)
            alignment = build_alignment_data(
                event_row["lat"],
                event_row["lng"],
                source_row["lat"],
                source_row["lng"],
            )
            story_id, created_story = upsert_story(
                cur,
                article,
                event_row["id"],
                source_row["id"],
                alignment["proximity_score"],
                json.dumps(analysis)
            )
        conn.commit()

    return IngestResult(
        event_id=event_row["id"],
        story_id=story_id,
        source_id=source_row["id"],
        created_event=created_event,
        created_source=created_source,
        created_story=created_story,
        alignment=alignment,
    )


# Note: The background sync scheduler has been refactored into the standalone
# scheduler daemon script (`scheduler.py`) to run independently.


@app.get("/api/events", response_model=list[EventMarker])
async def get_events():
    try:
        rows = await asyncio.get_running_loop().run_in_executor(
            None, fetch_event_markers_from_db
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Database query failed: {exc}")

    return [EventMarker(**row) for row in rows]


@app.get("/api/events/{event_id}/perspectives", response_model=EventPerspectiveResponse)
async def get_event_perspectives(event_id: str):
    try:
        event, stories = await asyncio.get_running_loop().run_in_executor(
            None, partial(fetch_event_with_stories, event_id)
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Database query failed: {exc}")

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found.")

    loop = asyncio.get_running_loop()

    analyses = []
    tasks = []
    task_indices = []

    for i, story in enumerate(stories):
        if story.get("ai_analysis"):
            analyses.append(story["ai_analysis"])
        else:
            analyses.append(None)
            tasks.append(
                loop.run_in_executor(
                    _executor,
                    partial(
                        analyze_article,
                        story["content"] or "",
                        source_name=story["source_name"],
                        source_country=story["source_country"],
                        funding_type=story["funding_type"],
                    ),
                )
            )
            task_indices.append(i)

    if tasks:
        try:
            results = await asyncio.gather(*tasks)
            with get_connection() as conn:
                with conn.cursor() as cur:
                    for i, res in zip(task_indices, results):
                        analyses[i] = res
                        cur.execute(
                            "UPDATE stories SET ai_analysis = %s::jsonb WHERE id = %s",
                            (json.dumps(res), stories[i]["story_id"])
                        )
                conn.commit()
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Perspective extraction failed: {exc}")

    perspectives: list[Perspective] = []

    for story, analysis in zip(stories, analyses):
        alignment = build_alignment_data(
            event["lat"],
            event["lng"],
            story["source_lat"],
            story["source_lng"],
        )
        source_payload = {
            "id": story["source_id"],
            # DB is source of truth for identity fields; LLM is only a fallback
            "name": story["source_name"] or analysis["source"]["name"],
            "country": story["source_country"] or analysis["source"]["country"],
            "funding_type": story["funding_type"] or analysis["source"]["funding_type"],
            "political_lean": story["political_lean"],
            "press_freedom_score": story["press_freedom_score"],
            "proximity_score": alignment["proximity_score"],
            "distance_km": alignment["distance_km"],
            "lat": story["source_lat"],
            "lng": story["source_lng"],
        }
        article_payload = {
            **analysis["article"],
            "content": (story["content"] or "").strip(),
        }
        perspectives.append(
            Perspective(
                story_id=story["story_id"],
                created_at=story["created_at"],
                url=story["url"],
                alignment=alignment,
                source=Source(**source_payload),
                article=Article(**article_payload),
            )
        )

    return EventPerspectiveResponse(
        event_id=event["id"],
        event_title=event["title"],
        event_coordinates={"lat": event["lat"], "lng": event["lng"]},
        perspectives=perspectives,
    )


@app.get("/api/events/{event_id}/contradiction-report", response_model=ContradictionReport)
async def get_contradiction_report(event_id: str):
    try:
        event, stories = fetch_event_with_stories(event_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Database query failed: {exc}")

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found.")

    if not stories:
        return ContradictionReport(
            consensus="No stories available for this event.",
            contradictions=[],
            bias_vectors="N/A",
        )

    current_count = len(stories)
    cached_report = event.get("ai_contradiction_report")
    cached_count = event.get("report_story_count") or 0

    if cached_report and cached_count == current_count:
        return ContradictionReport(**cached_report)

    try:
        report = await asyncio.get_running_loop().run_in_executor(
            _executor,
            partial(generate_contradiction_report, stories),
        )
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE events SET ai_contradiction_report = %s::jsonb, report_story_count = %s WHERE id = %s",
                    (json.dumps(report), current_count, event_id)
                )
            conn.commit()
            
        return ContradictionReport(**report)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Report generation failed: {exc}")


@app.post("/api/ingest/article", response_model=IngestResult)
async def ingest_single_article(article: IngestArticleInput):
    try:
        return await asyncio.get_running_loop().run_in_executor(
            _executor,
            partial(ingest_article, article),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Ingest failed: {exc}")


@app.post("/api/ingest/articles", response_model=BatchIngestResponse)
async def ingest_articles(payload: BatchIngestRequest):
    loop = asyncio.get_running_loop()

    try:
        results = await asyncio.gather(
            *[
                loop.run_in_executor(_executor, partial(ingest_article, article))
                for article in payload.articles
            ]
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Batch ingest failed: {exc}")

    inserted = sum(1 for result in results if result.created_story)
    updated = len(results) - inserted
    return BatchIngestResponse(inserted=inserted, updated=updated, results=results)


@app.post("/api/ingest/sync", response_model=ExternalSyncResponse)
async def sync_external_ingest(payload: ExternalSyncRequest):
    try:
        return await asyncio.get_running_loop().run_in_executor(
            _executor,
            partial(
                sync_external_news,
                payload,
                ingest_article,
                get_db_connection=get_connection,
            ),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"External sync failed: {exc}")


@app.get("/health")
async def health_check():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 AS ok")
                cur.fetchone()
    except Exception as exc:
        return {"status": "degraded", "version": "0.3.0", "detail": str(exc)}

    return {"status": "ok", "version": "0.3.0"}
