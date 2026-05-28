from __future__ import annotations

import argparse
import os
import socket
import sys
import time
from urllib.parse import urlparse

import psycopg2
from dotenv import load_dotenv

from ingestion import sync_external_news
from main import get_connection, ingest_article
from models import ExternalSyncRequest
from seed_rss_feeds import seed_default_feeds

load_dotenv()

SCORES = {
    "BBC News": ("Center-left", 82),
    "The Guardian": ("Left-leaning", 82),
    "NPR": ("Center-left", 83),
    "Al Jazeera": ("State-owned/Pro-Qatar", 30),
    "Deutsche Welle": ("Centrist", 84),
    "CBC News": ("Center-left", 81),
    "NHK World": ("Centrist", 71),
    "France 24": ("Centrist", 79),
}


def resolve_db_url() -> str:
    return os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL") or ""


def cmd_check_db(_: argparse.Namespace) -> int:
    db_url = resolve_db_url()
    if not db_url:
        print("DATABASE_URL or SUPABASE_DB_URL missing.")
        return 1

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT postgis_version();")
                version = cur.fetchone()
                print(f"Conn OK. PostGIS: {version[0]}")
        return 0
    except Exception as exc:
        print(f"Conn FAIL: {exc}")
        return 1


def cmd_check_conn(_: argparse.Namespace) -> int:
    db_url = resolve_db_url()
    if not db_url:
        print("DATABASE_URL or SUPABASE_DB_URL missing.")
        return 1

    parsed = urlparse(db_url)
    hostname = parsed.hostname
    if not hostname:
        print("Database hostname missing.")
        return 1

    try:
        infos = socket.getaddrinfo(hostname, parsed.port or 5432, socket.AF_INET)
        resolved_ip = infos[0][4][0]
    except socket.gaierror:
        try:
            infos = socket.getaddrinfo(hostname, parsed.port or 5432, socket.AF_INET6)
            resolved_ip = infos[0][4][0]
        except socket.gaierror as exc:
            print(f"Host resolution failed: {exc}")
            return 1

    userinfo = ""
    if parsed.username:
        userinfo = parsed.username
        if parsed.password:
            userinfo += f":{parsed.password}"
        userinfo += "@"

    port = parsed.port or 5432
    new_netloc = f"{userinfo}{resolved_ip}:{port}"
    resolved_url = parsed._replace(netloc=new_netloc).geturl()

    start = time.time()
    print("Connecting to", resolved_ip)
    try:
        conn = psycopg2.connect(resolved_url)
        conn.close()
        print("Connected in", round(time.time() - start, 3))
        return 0
    except Exception as exc:
        print("Failed in", round(time.time() - start, 3), "Error:", exc)
        return 1


def cmd_update_scores(_: argparse.Namespace) -> int:
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                for name, (lean, score) in SCORES.items():
                    cur.execute(
                        """
                        UPDATE rss_sources
                        SET political_lean = %s, press_freedom_score = %s
                        WHERE name = %s
                        """,
                        (lean, score, name),
                    )
                    cur.execute(
                        """
                        UPDATE sources
                        SET political_lean = %s, press_freedom_score = %s
                        WHERE name = %s
                        """,
                        (lean, score, name),
                    )
            conn.commit()
        print("Scores updated.")
        return 0
    except Exception as exc:
        print(f"Score update failed: {exc}")
        return 1


def cmd_seed_feeds(_: argparse.Namespace) -> int:
    try:
        inserted = seed_default_feeds()
        print(f"Seeded {inserted} RSS feeds.")
        return 0
    except Exception as exc:
        print(f"Seed failed: {exc}")
        return 1


def cmd_seed_sql(_: argparse.Namespace) -> int:
    try:
        with open("seed.sql", "r", encoding="utf-8") as file:
            sql = file.read()
    except FileNotFoundError:
        print("seed.sql not found in backend directory.")
        return 1

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
            conn.commit()
        print("Database seeded from seed.sql.")
        return 0
    except Exception as exc:
        print(f"Seed SQL failed: {exc}")
        return 1


def cmd_migrate_cache(_: argparse.Namespace) -> int:
    try:
        import migrate_cache

        migrate_cache.migrate()
        return 0
    except Exception as exc:
        print(f"Migration failed: {exc}")
        return 1


def cmd_sync(args: argparse.Namespace) -> int:
    try:
        request = ExternalSyncRequest(
            limit=args.limit,
            gdelt_timespan_minutes=args.gdelt_timespan_minutes,
            gdelt_maxrows=args.gdelt_maxrows,
        )
        result = sync_external_news(request, ingest_article, get_db_connection=get_connection)
        print(result.model_dump_json(indent=2))
        return 0
    except Exception as exc:
        print(f"Sync failed: {exc}")
        return 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Terrain developer CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("check-db", help="Check DB connectivity and PostGIS").set_defaults(
        func=cmd_check_db
    )
    subparsers.add_parser("check-conn", help="Check DB host resolution").set_defaults(
        func=cmd_check_conn
    )
    subparsers.add_parser("update-scores", help="Update source lean/score").set_defaults(
        func=cmd_update_scores
    )
    subparsers.add_parser("seed-feeds", help="Seed default RSS feeds").set_defaults(
        func=cmd_seed_feeds
    )
    subparsers.add_parser("seed-sql", help="Run seed.sql").set_defaults(
        func=cmd_seed_sql
    )
    subparsers.add_parser("migrate-cache", help="Run cache migration").set_defaults(
        func=cmd_migrate_cache
    )

    sync_parser = subparsers.add_parser("sync", help="Run external ingest sync")
    sync_parser.add_argument("--limit", type=int, default=25)
    sync_parser.add_argument("--gdelt-timespan-minutes", type=int, default=120)
    sync_parser.add_argument("--gdelt-maxrows", type=int, default=500)
    sync_parser.set_defaults(func=cmd_sync)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
