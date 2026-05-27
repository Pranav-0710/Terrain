"""Wipe all live-synced events (keep seed events), then re-sync with improved clustering."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from dotenv import load_dotenv
load_dotenv()
from main import get_connection

conn = get_connection()
cur = conn.cursor()

# 1. Delete ALL events and stories (full reset)
cur.execute("DELETE FROM stories")
cur.execute("DELETE FROM events")
print("Wiped all events and stories.")

# 2. Re-insert the 3 seed events with multiple sources
cur.execute("""
INSERT INTO events (id, title, lat, lng, created_at) VALUES
('e1111111-1111-1111-1111-111111111111', 'Global Climate Accord Signed in Geneva', 46.2044, 6.1432, NOW() - INTERVAL '1 day'),
('e2222222-2222-2222-2222-222222222222', 'Tech Innovation Expo & AI Safety Forum in Tokyo', 35.6762, 139.6503, NOW() - INTERVAL '2 days'),
('e3333333-3333-3333-3333-333333333333', 'Major Energy Infrastructure Agreement', -34.6037, -58.3816, NOW() - INTERVAL '3 hours')
""")

cur.execute("""
INSERT INTO sources (id, name, country, lat, lng, funding_type) VALUES
('b1111111-1111-1111-1111-111111111111', 'Swissinfo', 'Switzerland', 46.2044, 6.1432, 'Public/State-funded'),
('b2222222-2222-2222-2222-222222222222', 'BBC News', 'United Kingdom', 51.5074, -0.1278, 'Public/State-funded'),
('b3333333-3333-3333-3333-333333333333', 'Al Jazeera', 'Qatar', 25.2854, 51.5310, 'State-owned/Monarchy'),
('b4444444-4444-4444-4444-444444444444', 'NHK World', 'Japan', 35.6762, 139.6503, 'Public/State-funded'),
('b5555555-5555-5555-5555-555555555555', 'The New York Times', 'United States', 40.7128, -74.0060, 'Private/Subscription'),
('b6666666-6666-6666-6666-666666666666', 'La Nacion', 'Argentina', -34.6037, -58.3816, 'Private/Commercial')
ON CONFLICT (id) DO NOTHING
""")

cur.execute("""
INSERT INTO stories (id, event_id, source_id, content, url, proximity_score, created_at) VALUES
('a1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111',
 'Swiss federal representatives today signed a landmark treaty on emission limits. The host nation Swissinfo reports local support is high but activists demand faster implementation.',
 'https://www.swissinfo.ch/climate-geneva-signing-2026', 1.0, NOW() - INTERVAL '23 hours'),
('a1111111-1111-1111-1111-222222222222', 'e1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222',
 'World leaders have agreed to a major climate deal in Geneva. While Europe welcomes the framework, debate continues in London and Washington over enforcement and financial penalties.',
 'https://www.bbc.co.uk/news/world-climate-treaty-geneva', 0.88, NOW() - INTERVAL '20 hours'),
('a1111111-1111-1111-1111-333333333333', 'e1111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333',
 'Developing nations highlight missing funding guarantees in the newly signed Geneva climate accord, expressing deep concern over structural inequities in execution timelines.',
 'https://www.aljazeera.com/news/geneva-climate-deal-inequity', 0.52, NOW() - INTERVAL '18 hours'),
('a2222222-2222-2222-2222-111111111111', 'e2222222-2222-2222-2222-222222222222', 'b4444444-4444-4444-4444-444444444444',
 'Tokyo tech expo showcases next-gen autonomous systems. NHK World reports the government plan to subsidize domestic semiconductor fabrications is drawing massive local investment.',
 'https://www3.nhk.or.jp/news/tokyo-tech-safety-expo-2026', 1.0, NOW() - INTERVAL '1 day'),
('a2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'b5555555-5555-5555-5555-555555555555',
 'At Tokyos tech forum, global tech giants raise concern over Japans hardware-first security policy, noting a critical divergence in software alignment compared to Silicon Valley standards.',
 'https://www.nytimes.com/tech/tokyo-expo-safety-rules', 0.35, NOW() - INTERVAL '18 hours'),
('a3333333-3333-3333-3333-111111111111', 'e3333333-3333-3333-3333-333333333333', 'b6666666-6666-6666-6666-666666666666',
 'Argentina formalizes the energy integration agreement in Buenos Aires for the construction of the new Patagonian gas pipeline, securing regional co-development funds.',
 'https://www.lanacion.com.ar/economia/acuerdo-energetico-buenos-aires', 1.0, NOW() - INTERVAL '2 hours'),
('a3333333-3333-3333-3333-222222222222', 'e3333333-3333-3333-3333-333333333333', 'b5555555-5555-5555-5555-555555555555',
 'Argentina enters a new energy partnership in Buenos Aires amidst severe inflationary pressures. Wall street analysts debate whether capital guarantees will hold over the five-year build.',
 'https://www.nytimes.com/business/argentina-energy-deal-inflation', 0.42, NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING
""")

conn.commit()

# 3. Now trigger a live sync
print("Seed data restored. Now syncing live articles with new clustering...")
conn.close()

from models import ExternalSyncRequest
from main import get_connection as gc, ingest_article
from ingestion import sync_external_news

req = ExternalSyncRequest(limit=40, gdelt_timespan_minutes=120, gdelt_maxrows=500)
result = sync_external_news(req, ingest_article, get_db_connection=gc)
print(f"\nSync complete: attempted={result.attempted} inserted={result.inserted} updated={result.updated}")
print(f"GDELT matches: {result.gdelt_matches}")
if result.failed_feeds:
    print(f"Failed feeds: {', '.join(result.failed_feeds)}")

# 4. Show final state
conn2 = gc()
cur2 = conn2.cursor()
cur2.execute("""
    SELECT e.title, COUNT(st.id)::int AS sc
    FROM events e LEFT JOIN stories st ON st.event_id = e.id
    GROUP BY e.id, e.title ORDER BY sc DESC LIMIT 20
""")
print("\n=== EVENTS AFTER CLUSTERING ===")
for r in cur2.fetchall():
    print(f"  {r['sc']} SRC | {r['title'][:80]}")
conn2.close()
print("\nDone!")
