from ingestion import sync_external_news
from main import get_connection, ingest_article
from models import ExternalSyncRequest


def run():
    result = sync_external_news(
        ExternalSyncRequest(),
        ingest_article,
        get_db_connection=get_connection,
    )
    print(result.model_dump_json(indent=2))


if __name__ == "__main__":
    run()
