"""Fix: remove non-English events, disable Japanese feed, add English filter to ingestion."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from dotenv import load_dotenv
load_dotenv()
from main import get_connection

conn = get_connection()
cur = conn.cursor()

# 1. Delete non-ASCII events and their stories (cast to uuid)
cur.execute("DELETE FROM stories WHERE event_id IN (SELECT id FROM events WHERE title !~ '^[[:ascii:]]+$')")
cur.execute("DELETE FROM events WHERE title !~ '^[[:ascii:]]+$'")
deleted = cur.rowcount
print(f"Deleted {deleted} non-English events.")

# 2. Also clean up events with encoding artifacts (the curly quote mojibake)
cur.execute("DELETE FROM stories WHERE event_id IN (SELECT id FROM events WHERE title LIKE '%%�%%')")
cur.execute("DELETE FROM events WHERE title LIKE '%%�%%'")
deleted2 = cur.rowcount
print(f"Deleted {deleted2} mojibake events.")

# 3. Disable NHK (Japanese feed)
cur.execute("UPDATE rss_sources SET is_active = FALSE WHERE name ILIKE '%%nhk%%'")
print("Disabled NHK feed.")

# 4. Show what remains
cur.execute("""
    SELECT e.title, COUNT(st.id)::int AS story_count
    FROM events e LEFT JOIN stories st ON st.event_id = e.id
    GROUP BY e.id, e.title ORDER BY story_count DESC LIMIT 15
""")
print("\n=== REMAINING EVENTS ===")
for r in cur.fetchall():
    print(f"  {r['story_count']} SRC | {r['title'][:90]}")

# 5. Show active feeds
cur.execute("SELECT name, is_active FROM rss_sources ORDER BY name")
print("\n=== RSS FEEDS ===")
for r in cur.fetchall():
    print(f"  [{'ON' if r['is_active'] else 'OFF'}] {r['name']}")

conn.commit()
conn.close()
print("\nDone.")
