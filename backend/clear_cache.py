import os, psycopg2
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.getenv('SUPABASE_DB_URL'))
conn.autocommit = True
cur = conn.cursor()

# Clear cached contradiction reports so they regenerate
cur.execute("UPDATE events SET ai_contradiction_report = NULL, report_story_count = 0;")

# Also, if there are any cached stories that failed, we could clear them, but the error shown is for the contradiction report.
cur.execute("UPDATE stories SET ai_analysis = NULL WHERE ai_analysis::text LIKE '%Error%';")

print("Cleared cached errors from database.")
