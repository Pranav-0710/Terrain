from dotenv import load_dotenv

from main import get_connection

load_dotenv()

DEFAULT_RSS_FEEDS = [
    {
        "name": "BBC News",
        "url": "http://feeds.bbci.co.uk/news/world/rss.xml",
        "country": "United Kingdom",
        "lat": 51.5074,
        "lng": -0.1278,
        "funding_type": "Public/State-funded",
        "political_lean": "Unknown",
        "press_freedom_score": 50,
    },
    {
        "name": "The Guardian",
        "url": "https://www.theguardian.com/world/rss",
        "country": "United Kingdom",
        "lat": 51.5074,
        "lng": -0.1278,
        "funding_type": "Private/Reader-funded",
        "political_lean": "Unknown",
        "press_freedom_score": 50,
    },
    {
        "name": "NPR",
        "url": "https://feeds.npr.org/1004/rss.xml",
        "country": "United States",
        "lat": 38.9072,
        "lng": -77.0369,
        "funding_type": "Nonprofit/Public media",
        "political_lean": "Unknown",
        "press_freedom_score": 50,
    },
    {
        "name": "Al Jazeera",
        "url": "https://www.aljazeera.com/xml/rss/all.xml",
        "country": "Qatar",
        "lat": 25.2854,
        "lng": 51.5310,
        "funding_type": "State-owned",
        "political_lean": "Unknown",
        "press_freedom_score": 50,
    },
    {
        "name": "Deutsche Welle",
        "url": "https://rss.dw.com/xml/rss-en-world",
        "country": "Germany",
        "lat": 50.7374,
        "lng": 7.0982,
        "funding_type": "Public/State-funded",
        "political_lean": "Unknown",
        "press_freedom_score": 50,
    },
    {
        "name": "Times of India",
        "url": "https://timesofindia.indiatimes.com/rss/4719148.cms",
        "country": "India",
        "lat": 28.6139,
        "lng": 77.2090,
        "funding_type": "Private/Commercial",
        "political_lean": "Unknown",
        "press_freedom_score": 50,
    },
    {
        "name": "NHK World",
        "url": "https://www3.nhk.or.jp/rss/news/cat0.xml",
        "country": "Japan",
        "lat": 35.6762,
        "lng": 139.6503,
        "funding_type": "Public/State-funded",
        "political_lean": "Unknown",
        "press_freedom_score": 50,
    },
]


def seed_default_feeds() -> int:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO rss_sources (
                    name,
                    url,
                    country,
                    lat,
                    lng,
                    funding_type,
                    political_lean,
                    press_freedom_score,
                    is_active
                )
                VALUES (%(name)s, %(url)s, %(country)s, %(lat)s, %(lng)s, %(funding_type)s, %(political_lean)s, %(press_freedom_score)s, TRUE)
                ON CONFLICT (url) DO UPDATE
                SET
                    name = EXCLUDED.name,
                    country = EXCLUDED.country,
                    lat = EXCLUDED.lat,
                    lng = EXCLUDED.lng,
                    funding_type = EXCLUDED.funding_type,
                    political_lean = EXCLUDED.political_lean,
                    press_freedom_score = EXCLUDED.press_freedom_score,
                    is_active = TRUE
                """,
                DEFAULT_RSS_FEEDS,
            )
        conn.commit()
    return len(DEFAULT_RSS_FEEDS)


def run():
    inserted = seed_default_feeds()
    print(f"Seeded {inserted} RSS feeds.")


if __name__ == "__main__":
    run()
