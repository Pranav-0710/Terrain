"""Quick health check for Terrain."""
import sys, io, json, urllib.request
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# 1. Backend API
try:
    data = json.loads(urllib.request.urlopen('http://localhost:8000/api/events').read())
    print(f"Backend API: OK ({len(data)} events)")
    for e in data[:10]:
        print(f"  {e['story_count']} SRC | {e['title'][:75]}")
    
    # Test perspectives for first multi-source event
    multi = [e for e in data if e['story_count'] > 1]
    if multi:
        eid = multi[0]['id']
        persp = json.loads(urllib.request.urlopen(f'http://localhost:8000/api/events/{eid}/perspectives').read())
        print(f"\nPerspectives for '{multi[0]['title'][:50]}': {len(persp['perspectives'])} perspectives loaded OK")
    else:
        print("\nWARNING: No multi-source events found!")
except Exception as ex:
    print(f"Backend API: FAILED - {ex}")

# 2. Frontend
try:
    resp = urllib.request.urlopen('http://localhost:3000')
    print(f"\nFrontend: OK (HTTP {resp.status})")
except Exception as ex:
    print(f"\nFrontend: FAILED - {ex}")

# 3. Health endpoint
try:
    health = json.loads(urllib.request.urlopen('http://localhost:8000/health').read())
    print(f"Health: {health['status']} (v{health['version']})")
except Exception as ex:
    print(f"Health: FAILED - {ex}")
