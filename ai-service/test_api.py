import io
import os
from unittest.mock import patch

# Provide a dummy fallback key for test environments where GROQ_API_KEY is not set in .env
os.environ.setdefault("GROQ_API_KEY", "gsk_test_dummy_key_for_unit_tests")

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_find_duplicate_match():
    payload = {
        "new_text": "Big pothole near MG Road market area, very dangerous",
        "existing_complaints": [
            {"id": "c1", "text": "There is a huge pothole on MG Road near the market"},
            {"id": "c2", "text": "Streetlight not working on Station Road for a week"},
        ],
    }
    response = client.post("/find-duplicate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "match" in data
    assert data["match"] is not None
    assert data["match"]["id"] == "c1"
    assert "MG Road" in data["match"]["text"]
    assert isinstance(data["match"]["similarity"], float)
    assert data["match"]["similarity"] >= 0.75


def test_find_duplicate_no_match():
    payload = {
        "new_text": "No water supply in our colony since three days",
        "existing_complaints": [
            {"id": "c1", "text": "There is a huge pothole on MG Road near the market"},
            {"id": "c2", "text": "Streetlight not working on Station Road for a week"},
        ],
    }
    response = client.post("/find-duplicate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data == {"match": None}


def test_find_duplicate_empty_existing():
    payload = {
        "new_text": "Broken pipe leaking drinking water",
        "existing_complaints": [],
    }
    response = client.post("/find-duplicate", json=payload)
    assert response.status_code == 200
    assert response.json() == {"match": None}


def test_find_duplicate_empty_text_validation():
    payload = {
        "new_text": "   ",
        "existing_complaints": [{"id": "c1", "text": "Something"}],
    }
    response = client.post("/find-duplicate", json=payload)
    assert response.status_code == 400


def test_transcribe_endpoint_success():
    fake_audio_content = b"RIFF....WAVEfmt ...."
    with patch("main.transcribe_audio", return_value="There is a water leak on Main Street") as mock_transcribe:
        response = client.post(
            "/transcribe",
            files={"file": ("sample.wav", io.BytesIO(fake_audio_content), "audio/wav")},
        )
        assert response.status_code == 200
        assert response.json() == {"text": "There is a water leak on Main Street"}
        assert mock_transcribe.called


def test_transcribe_endpoint_empty_file():
    response = client.post(
        "/transcribe",
        files={"file": ("empty.mp3", io.BytesIO(b""), "audio/mpeg")},
    )
    assert response.status_code == 400


def test_process_complaint_contract_preserved():
    with patch("main.process_complaint", return_value={
        "translated_text": "Sewage overflow in Sector 5",
        "language": "Hindi",
        "category": "Sanitation & Waste Management",
    }) as mock_proc:
        response = client.post(
            "/process-complaint",
            json={"text": "सेक्टर 5 में सीवर का पानी बह रहा है", "language": "hi"},
        )
        assert response.status_code == 200
        assert response.json() == {
            "translated_text": "Sewage overflow in Sector 5",
            "language": "Hindi",
            "category": "Sanitation & Waste Management",
        }
        mock_proc.assert_called_once_with("सेक्टर 5 में सीवर का पानी बह रहा है", "hi")
