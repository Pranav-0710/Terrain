import time, psycopg2, os
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv('SUPABASE_DB_URL') or os.getenv('DATABASE_URL')

conn = psycopg2.connect(db_url)
cur = conn.cursor()

start = time.time()
cur.execute("""
    WITH ranked_events AS (
        SELECT e.id, e.title, e.lat, e.lng, e.created_at, COUNT(st.id)::int AS story_count
        FROM events e
        LEFT JOIN stories st ON st.event_id = e.id
        GROUP BY e.id
        ORDER BY COUNT(st.id) DESC, e.created_at DESC
        LIMIT 100
    )
    SELECT id::text, title, lat, lng, created_at, story_count
    FROM ranked_events
    ORDER BY story_count DESC, created_at DESC
""")
print("Query 1:", time.time() - start)

start = time.time()
cur.execute("""
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
""")
print("Query 2:", time.time() - start)
conn.close()
