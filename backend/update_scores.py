import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
db_url = os.getenv("SUPABASE_DB_URL")

scores = {
    'BBC News': ('Center-left', 82),
    'The Guardian': ('Left-leaning', 82),
    'NPR': ('Center-left', 83),
    'Al Jazeera': ('State-owned/Pro-Qatar', 30),
    'Deutsche Welle': ('Centrist', 84),
    'CBC News': ('Center-left', 81),
    'NHK World': ('Centrist', 71),
    'France 24': ('Centrist', 79)
}

with psycopg2.connect(db_url) as conn:
    with conn.cursor() as cur:
        for name, (lean, score) in scores.items():
            cur.execute("""
                UPDATE rss_sources
                SET political_lean = %s, press_freedom_score = %s
                WHERE name = %s
            """, (lean, score, name))
            cur.execute("""
                UPDATE sources
                SET political_lean = %s, press_freedom_score = %s
                WHERE name = %s
            """, (lean, score, name))
    conn.commit()

print("Scores updated.")
