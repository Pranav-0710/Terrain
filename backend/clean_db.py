import os
import re
from dotenv import load_dotenv
import psycopg2

load_dotenv()

db_url = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
if not db_url:
    print("No DB URL")
    exit(1)

from main import get_connection

with get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute("DELETE FROM events WHERE title !~ '^[[:ascii:]]+$';")
    conn.commit()
print("Cleaned up database")
