import os
from dotenv import load_dotenv
from main import get_connection

load_dotenv()

def run():
    print("Reading seed.sql...")
    try:
        with open("seed.sql", "r", encoding="utf-8") as f:
            sql = f.read()
    except FileNotFoundError:
        print("seed.sql not found in the current directory.")
        return

    print("Connecting to Supabase database...")
    try:
        conn = get_connection()
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        return

    try:
        with conn.cursor() as cur:
            print("Executing seed SQL script...")
            cur.execute(sql)
            conn.commit()
            print("Database successfully seeded!")
    except Exception as e:
        conn.rollback()
        print(f"Error executing SQL: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    run()
