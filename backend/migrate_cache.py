import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")

def migrate():
    print("Connecting to database...")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cur = conn.cursor()

    print("Adding ai_analysis to stories...")
    try:
        cur.execute("ALTER TABLE stories ADD COLUMN IF NOT EXISTS ai_analysis JSONB;")
        print("Success.")
    except Exception as e:
        print(f"Error adding ai_analysis: {e}")

    print("Adding ai_contradiction_report and report_story_count to events...")
    try:
        cur.execute("ALTER TABLE events ADD COLUMN IF NOT EXISTS ai_contradiction_report JSONB;")
        cur.execute("ALTER TABLE events ADD COLUMN IF NOT EXISTS report_story_count INT DEFAULT 0;")
        print("Success.")
    except Exception as e:
        print(f"Error adding columns to events: {e}")

    cur.close()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
