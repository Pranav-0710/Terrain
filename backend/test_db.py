import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def check_health():
    url = os.getenv("DATABASE_URL")
    try:
        conn = psycopg2.connect(url)
        cur = conn.cursor()
        cur.execute("SELECT postgis_version();")
        version = cur.fetchone()
        print(f"Conn OK. PostGIS: {version[0]}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Conn FAIL: {e}")

if __name__ == "__main__":
    check_health()
