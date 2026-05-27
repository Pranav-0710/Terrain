"""Quick connection test for both project refs."""
import psycopg2

password = "Openai_jey%4007"  # %40 = @

refs = [
    "uxwhuzsvzxlmhocqdhma",
    "ilaxwfnyarhbcokuptsz",
]

for ref in refs:
    url = f"postgresql://postgres.{ref}:{password}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
    print(f"\nTesting ref: {ref}")
    try:
        conn = psycopg2.connect(url, connect_timeout=10)
        cur = conn.cursor()
        cur.execute("SELECT 1 AS ok")
        print(f"  RESULT: {cur.fetchone()}")
        conn.close()
        print(f"  >> SUCCESS with ref: {ref}")
    except Exception as e:
        print(f"  >> FAILED: {e}")
