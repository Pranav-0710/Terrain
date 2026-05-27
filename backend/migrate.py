import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

def get_connection():
    db_url = os.getenv("SUPABASE_DB_URL")
    return psycopg2.connect(db_url)

with get_connection() as conn:
    with conn.cursor() as cur:
        # Add to sources
        try:
            cur.execute("ALTER TABLE sources ADD COLUMN political_lean TEXT DEFAULT 'Unknown';")
            print("Added political_lean to sources")
        except Exception as e:
            print(f"sources.political_lean: {e}")
            conn.rollback()
        
        try:
            cur.execute("ALTER TABLE sources ADD COLUMN press_freedom_score INT DEFAULT 50;")
            print("Added press_freedom_score to sources")
        except Exception as e:
            print(f"sources.press_freedom_score: {e}")
            conn.rollback()

        # Add to rss_sources
        try:
            cur.execute("ALTER TABLE rss_sources ADD COLUMN political_lean TEXT NOT NULL DEFAULT 'Unknown';")
            print("Added political_lean to rss_sources")
        except Exception as e:
            print(f"rss_sources.political_lean: {e}")
            conn.rollback()
            
        try:
            cur.execute("ALTER TABLE rss_sources ADD COLUMN press_freedom_score INT NOT NULL DEFAULT 50;")
            print("Added press_freedom_score to rss_sources")
        except Exception as e:
            print(f"rss_sources.press_freedom_score: {e}")
            conn.rollback()

    conn.commit()

print("Done updating schema live.")
