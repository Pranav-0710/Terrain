import os
import sys
from unittest.mock import MagicMock, patch
import pytest

# Ensure the backend directory is in the import path
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

class MockCursor:
    def __init__(self):
        self.description = None
        self.rowcount = -1
        self.mock_rows = []
        self.mock_one = None
        self.query_count = 0

    def execute(self, query, params=None):
        self.query_count += 1

    def fetchall(self):
        if self.query_count > 1:
            return []
        return self.mock_rows

    def fetchone(self):
        return self.mock_one

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

class MockConnection:
    def __init__(self):
        self.mock_cursor = MockCursor()

    def cursor(self):
        return self.mock_cursor

    def commit(self):
        pass

    def close(self):
        pass

@pytest.fixture
def mock_db():
    conn = MockConnection()
    with patch("main.get_connection") as mock_get_conn:
        mock_get_conn.return_value.__enter__.return_value = conn
        yield conn

@pytest.fixture
def mock_llm():
    with patch("agents._call_llm_with_retries") as mock_call:
        yield mock_call
