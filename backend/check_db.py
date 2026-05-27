import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL"))
conn.autocommit = True
cur = conn.cursor()

cur.execute("SELECT pid, state, query FROM pg_stat_activity WHERE state != 'idle'")
for row in cur.fetchall():
    print(row)

# Terminate all connections except ours
cur.execute("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid <> pg_backend_pid() AND datname = current_database()")
print("Terminated other connections.")
