"""
External news collectors for Terrain.

Primary path:
- Fetch recent geocoded article URLs from GDELT.
- Fetch richer article metadata/content snippets from RSS feeds.
- Match RSS articles to GDELT by URL for event coordinates.
- Fall back to source coordinates when no GDELT geo match exists.
"""

from __future__ import annotations

import email.utils
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Callable
from urllib.parse import urlparse
from xml.etree import ElementTree as ET

import requests

from models import ExternalSyncRequest, ExternalSyncResponse, IngestArticleInput, IngestCoordinates, IngestResult

GDELT_GKG_GEOJSON_URL = "https://api.gdeltproject.org/api/v1/gkg_geojson"

DEFAULT_RSS_FEEDS = [
    {
        "name": "BBC News",
        "url": "http://feeds.bbci.co.uk/news/world/rss.xml",
        "country": "United Kingdom",
        "lat": 51.5074,
        "lng": -0.1278,
        "funding_type": "Public/State-funded",
    },
    {
        "name": "The Guardian",
        "url": "https://www.theguardian.com/world/rss",
        "country": "United Kingdom",
        "lat": 51.5074,
        "lng": -0.1278,
        "funding_type": "Private/Reader-funded",
    },
    {
        "name": "NPR",
        "url": "https://feeds.npr.org/1004/rss.xml",
        "country": "United States",
        "lat": 38.9072,
        "lng": -77.0369,
        "funding_type": "Nonprofit/Public media",
    },
]

DOMAIN_OVERRIDES = {
    "bbc.co.uk": {
        "name": "BBC News",
        "country": "United Kingdom",
        "lat": 51.5074,
        "lng": -0.1278,
        "funding_type": "Public/State-funded",
    },
    "bbc.com": {
        "name": "BBC News",
        "country": "United Kingdom",
        "lat": 51.5074,
        "lng": -0.1278,
        "funding_type": "Public/State-funded",
    },
    "theguardian.com": {
        "name": "The Guardian",
        "country": "United Kingdom",
        "lat": 51.5074,
        "lng": -0.1278,
        "funding_type": "Private/Reader-funded",
    },
    "npr.org": {
        "name": "NPR",
        "country": "United States",
        "lat": 38.9072,
        "lng": -77.0369,
        "funding_type": "Nonprofit/Public media",
    },
    "nytimes.com": {
        "name": "The New York Times",
        "country": "United States",
        "lat": 40.7128,
        "lng": -74.0060,
        "funding_type": "Private/Subscription",
    },
    "reuters.com": {
        "name": "Reuters",
        "country": "United Kingdom",
        "lat": 51.5074,
        "lng": -0.1278,
        "funding_type": "Private/Wire service",
    },
    "aljazeera.com": {
        "name": "Al Jazeera",
        "country": "Qatar",
        "lat": 25.2854,
        "lng": 51.5310,
        "funding_type": "State-owned",
    },
}

COUNTRY_TLD_HINTS = {
    ".uk": ("United Kingdom", 51.5074, -0.1278),
    ".us": ("United States", 38.9072, -77.0369),
    ".au": ("Australia", -35.2809, 149.1300),
    ".jp": ("Japan", 35.6762, 139.6503),
    ".fr": ("France", 48.8566, 2.3522),
    ".de": ("Germany", 52.52, 13.4050),
    ".in": ("India", 28.6139, 77.2090),
    ".ca": ("Canada", 45.4215, -75.6972),
}


@dataclass
class GdeltLocationMatch:
    url: str
    lat: float
    lng: float
    location_name: str
    domain: str
    published_at: datetime | None


@dataclass
class RssFeedConfig:
    name: str
    url: str
    country: str
    lat: float
    lng: float
    funding_type: str


@dataclass
class RssArticle:
    title: str
    url: str
    content: str
    published_at: datetime | None
    source: RssFeedConfig


def normalize_url(url: str) -> str:
    parsed = urlparse((url or "").strip())
    path = parsed.path.rstrip("/")
    return f"{parsed.scheme.lower()}://{parsed.netloc.lower()}{path}"


def parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        dt = email.utils.parsedate_to_datetime(value)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except (TypeError, ValueError):
        pass

    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except ValueError:
        return None


def parse_gdelt_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        return datetime.strptime(value, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def load_rss_feeds(get_db_connection=None) -> list[RssFeedConfig]:
    """Load RSS feeds from DB if connection factory provided, else fall back to env/hardcoded."""
    if get_db_connection is not None:
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT name, url, country, lat, lng, funding_type FROM rss_sources WHERE is_active = TRUE ORDER BY name"
                    )
                    rows = cur.fetchall()
                    if rows:
                        return [RssFeedConfig(**dict(row)) for row in rows]
        except Exception:
            pass

    raw = os.getenv("RSS_FEEDS_JSON")
    if raw:
        feeds = json.loads(raw)
        return [RssFeedConfig(**item) for item in feeds]

    return [RssFeedConfig(**item) for item in DEFAULT_RSS_FEEDS]


def infer_source_from_domain(domain: str) -> RssFeedConfig:
    clean_domain = domain.lower().strip()

    if clean_domain in DOMAIN_OVERRIDES:
        return RssFeedConfig(url="", **DOMAIN_OVERRIDES[clean_domain])

    for suffix, (country, lat, lng) in COUNTRY_TLD_HINTS.items():
        if clean_domain.endswith(suffix):
            return RssFeedConfig(
                name=clean_domain,
                url="",
                country=country,
                lat=lat,
                lng=lng,
                funding_type="Unknown",
            )

    return RssFeedConfig(
        name=clean_domain or "Unknown source",
        url="",
        country="Unknown",
        lat=0.0,
        lng=0.0,
        funding_type="Unknown",
    )


def fetch_gdelt_index(timespan_minutes: int, maxrows: int) -> dict[str, GdeltLocationMatch]:
    response = requests.get(
        GDELT_GKG_GEOJSON_URL,
        params={
            "QUERY": "",
            "TIMESPAN": str(timespan_minutes),
            "OUTPUTTYPE": "1",
            "OUTPUTFIELDS": "name,url,domain",
            "MAXROWS": str(maxrows),
        },
        timeout=30,
    )
    response.raise_for_status()

    payload = response.json()
    features = payload.get("features", [])
    index: dict[str, GdeltLocationMatch] = {}

    for feature in features:
        geometry = feature.get("geometry") or {}
        coordinates = geometry.get("coordinates") or []
        properties = feature.get("properties") or {}

        if len(coordinates) < 2:
            continue

        url = properties.get("url")
        if not url:
            continue

        normalized = normalize_url(url)
        if normalized in index:
            continue

        index[normalized] = GdeltLocationMatch(
            url=url,
            lat=float(coordinates[1]),
            lng=float(coordinates[0]),
            location_name=str(properties.get("name") or "").strip(),
            domain=str(properties.get("domain") or urlparse(url).netloc).lower(),
            published_at=parse_gdelt_timestamp(properties.get("urlpubtimedate")),
        )

    return index


def extract_text(element: ET.Element | None) -> str:
    if element is None:
        return ""
    return "".join(element.itertext()).strip()


def parse_rss_feed(xml_text: str, source: RssFeedConfig) -> list[RssArticle]:
    root = ET.fromstring(xml_text)
    channel = root.find("channel")
    items: list[RssArticle] = []

    if channel is not None:
        for item in channel.findall("item"):
            title = extract_text(item.find("title"))
            link = extract_text(item.find("link"))
            description = extract_text(item.find("description"))
            encoded = extract_text(item.find("{http://purl.org/rss/1.0/modules/content/}encoded"))
            pub_date = extract_text(item.find("pubDate"))

            if not title or not link:
                continue

            content = "\n\n".join(part for part in [title, description, encoded] if part).strip()
            items.append(
                RssArticle(
                    title=title,
                    url=link,
                    content=content or title,
                    published_at=parse_datetime(pub_date),
                    source=source,
                )
            )

        return items

    atom_entries = root.findall("{http://www.w3.org/2005/Atom}entry")
    for entry in atom_entries:
        title = extract_text(entry.find("{http://www.w3.org/2005/Atom}title"))
        link_el = entry.find("{http://www.w3.org/2005/Atom}link")
        link = (link_el.attrib.get("href") if link_el is not None else "") or ""
        summary = extract_text(entry.find("{http://www.w3.org/2005/Atom}summary"))
        content = extract_text(entry.find("{http://www.w3.org/2005/Atom}content"))
        updated = extract_text(entry.find("{http://www.w3.org/2005/Atom}updated"))

        if not title or not link:
            continue

        full_content = "\n\n".join(part for part in [title, summary, content] if part).strip()
        items.append(
            RssArticle(
                title=title,
                url=link,
                content=full_content or title,
                published_at=parse_datetime(updated),
                source=source,
            )
        )

    return items


def fetch_rss_articles(feeds: list[RssFeedConfig]) -> tuple[list[RssArticle], list[str]]:
    articles: list[RssArticle] = []
    failed_feeds: list[str] = []

    for feed in feeds:
        try:
            response = requests.get(feed.url, timeout=20, headers={"User-Agent": "TerrainBot/1.0"})
            response.raise_for_status()
            articles.extend(parse_rss_feed(response.text, feed))
        except Exception:
            failed_feeds.append(feed.name)

    deduped: dict[str, RssArticle] = {}
    for article in articles:
        normalized = normalize_url(article.url)
        if normalized and normalized not in deduped:
            deduped[normalized] = article

    return list(deduped.values()), failed_feeds


def build_ingest_payload(article: RssArticle, gdelt_match: GdeltLocationMatch | None) -> IngestArticleInput:
    source = article.source
    event_lat = gdelt_match.lat if gdelt_match else source.lat
    event_lng = gdelt_match.lng if gdelt_match else source.lng

    source_override = gdelt_match.domain if gdelt_match else urlparse(article.url).netloc.lower()
    source_hint = infer_source_from_domain(source_override)
    source_name = source.name or source_hint.name
    source_country = source.country or source_hint.country
    source_funding = source.funding_type or source_hint.funding_type
    source_lat = source.lat if source.lat != 0.0 else source_hint.lat
    source_lng = source.lng if source.lng != 0.0 else source_hint.lng

    return IngestArticleInput(
        event={
            "title": article.title.strip(),
            "coordinates": {"lat": event_lat, "lng": event_lng},
        },
        source={
            "name": source_name,
            "country": source_country,
            "funding_type": source_funding,
            "coordinates": {"lat": source_lat, "lng": source_lng},
        },
        url=article.url,
        content=article.content,
        published_at=article.published_at or gdelt_match.published_at if gdelt_match else None,
    )


def sync_external_news(
    request: ExternalSyncRequest,
    ingest_callback: Callable[[IngestArticleInput], IngestResult],
    get_db_connection=None,
) -> ExternalSyncResponse:
    gdelt_matches = 0
    results: list[IngestResult] = []

    try:
        gdelt_index = fetch_gdelt_index(
            timespan_minutes=request.gdelt_timespan_minutes,
            maxrows=request.gdelt_maxrows,
        )
    except Exception:
        gdelt_index = {}

    rss_articles, failed_feeds = fetch_rss_articles(
        load_rss_feeds(get_db_connection=get_db_connection)
    )
    rss_articles.sort(
        key=lambda article: article.published_at or datetime.now(timezone.utc),
        reverse=True,
    )

    attempted_articles = rss_articles[: request.limit]

    for rss_article in attempted_articles:
        gdelt_match = gdelt_index.get(normalize_url(rss_article.url))
        if gdelt_match:
            gdelt_matches += 1

        payload = build_ingest_payload(rss_article, gdelt_match)
        results.append(ingest_callback(payload))

    inserted = sum(1 for result in results if result.created_story)
    updated = len(results) - inserted

    return ExternalSyncResponse(
        attempted=len(attempted_articles),
        inserted=inserted,
        updated=updated,
        gdelt_matches=gdelt_matches,
        rss_only=max(0, len(attempted_articles) - gdelt_matches),
        failed_feeds=failed_feeds,
        results=results,
    )
