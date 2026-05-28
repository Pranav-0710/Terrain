from datetime import datetime, timezone
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
import pytest
from main import app

client = TestClient(app)

def test_health_check_ok(mock_db):
    # Mocking fetchone to return success
    mock_db.mock_cursor.mock_one = {"ok": 1}
    
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "0.3.0"}

def test_health_check_degraded(mock_db):
    # Mocking database error
    mock_db.cursor = MagicMock(side_effect=Exception("DB Error"))
    
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "degraded"

def test_get_events(mock_db):
    # Mock database rows for events
    mock_db.mock_cursor.mock_rows = [
        {
            "id": "event-1",
            "title": "Laos Cave Search",
            "lat": 19.8562,
            "lng": 102.4955,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "story_count": 4
        }
    ]
    
    response = client.get("/api/events")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "event-1"
    assert data[0]["title"] == "Laos Cave Search"

def test_get_event_perspectives_not_found(mock_db):
    # Mocking event is not found (fetch_event_with_stories returns None, [])
    mock_db.mock_cursor.mock_one = None # No event found
    
    response = client.get("/api/events/non-existent-id/perspectives")
    assert response.status_code == 404
    assert response.json()["detail"] == "Event not found."
