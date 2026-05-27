import os, time, socket, psycopg2
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv('SUPABASE_DB_URL') or os.getenv('DATABASE_URL')
parsed = urlparse(db_url)
hostname = parsed.hostname
infos = socket.getaddrinfo(hostname, parsed.port or 5432, socket.AF_INET)
resolved_ip = infos[0][4][0]

netloc_host = resolved_ip
userinfo = f"{parsed.username}:{parsed.password}@"
new_netloc = f"{userinfo}{netloc_host}:{parsed.port or 5432}"
resolved_url = urlparse(db_url)._replace(netloc=new_netloc).geturl()

start = time.time()
print("Connecting to", resolved_ip)
try:
    conn = psycopg2.connect(resolved_url)
    print("Connected in", time.time() - start)
    conn.close()
except Exception as e:
    print("Failed in", time.time() - start, "Error:", e)
