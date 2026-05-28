import asyncio
import logging
import sys
from functools import partial
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Configure logging to stdout
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("terrain.scheduler")

from main import (
    get_connection,
    get_auto_sync_interval_seconds,
    build_auto_sync_request,
    ingest_article
)
from ingestion import sync_external_news

async def run_scheduler():
    interval_seconds = get_auto_sync_interval_seconds()
    logger.info("Standalone auto-sync scheduler started. Interval = %s seconds.", interval_seconds)
    
    # Create thread pool executor for blocking ingestion calls
    from concurrent.futures import ThreadPoolExecutor
    executor = ThreadPoolExecutor(max_workers=4)
    loop = asyncio.get_running_loop()
    
    while True:
        try:
            logger.info("Starting sync cycle...")
            result = await loop.run_in_executor(
                executor,
                partial(
                    sync_external_news,
                    build_auto_sync_request(),
                    ingest_article,
                    get_db_connection=get_connection,
                )
            )
            logger.info(
                "Sync cycle complete: attempted=%s, inserted=%s, updated=%s, gdelt_matches=%s, failed_feeds=%s",
                result.attempted,
                result.inserted,
                result.updated,
                result.gdelt_matches,
                ",".join(result.failed_feeds) if result.failed_feeds else "none",
            )
        except Exception:
            logger.exception("Scheduler sync cycle encountered error")
            
        logger.info("Sleeping for %s seconds until next cycle...", interval_seconds)
        await asyncio.sleep(interval_seconds)

if __name__ == "__main__":
    try:
        asyncio.run(run_scheduler())
    except KeyboardInterrupt:
        logger.info("Scheduler stopped by user.")
