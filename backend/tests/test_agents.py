import pytest
from unittest.mock import MagicMock
import agents

def test_calculate_distance_same_point():
    # Distance from a point to itself should be 0
    dist = agents.calculate_distance_km(10.0, 20.0, 10.0, 20.0)
    assert round(dist) == 0

def test_calculate_distance_known_points():
    # NYC (40.7128, -74.0060) to London (51.5074, -0.1278)
    dist = agents.calculate_distance_km(40.7128, -74.0060, 51.5074, -0.1278)
    assert 5500 < dist < 5650

def test_calculate_proximity_score_same_point():
    score = agents.calculate_proximity_score(10.0, 20.0, 10.0, 20.0)
    assert score == 100

def test_calculate_proximity_score_distant_point():
    score = agents.calculate_proximity_score(0.0, 0.0, 45.0, 45.0)
    assert score < 100

def test_llm_cascade_fallback():
    # Mocking first endpoint to fail with 429
    mock_client_1 = MagicMock()
    mock_client_1.chat.completions.create.side_effect = Exception("429 Too Many Requests")
    
    # Mocking second endpoint to succeed
    mock_client_2 = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = '{"consensus": "agreed data", "contradictions": [], "bias_vectors": "N/A"}'
    mock_choice.message.refusal = None
    mock_client_2.chat.completions.create.return_value.choices = [mock_choice]
    
    orig_endpoints = agents.endpoints
    agents.endpoints = [
        {"client": mock_client_1, "model": "model-1"},
        {"client": mock_client_2, "model": "model-2"}
    ]
    
    try:
        res = agents._call_llm_with_retries([{"role": "user", "content": "hi"}], 100)
        assert "agreed data" in res
        assert mock_client_1.chat.completions.create.call_count == 1
        assert mock_client_2.chat.completions.create.call_count == 1
    finally:
        agents.endpoints = orig_endpoints
