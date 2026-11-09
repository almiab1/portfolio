# ABOUTME: Exercises the preview chat endpoint with a deterministic Pydantic AI model.
# ABOUTME: Checks both locales, Vercel stream chunks and the preview deployment boundary.
import json

import pytest
from fastapi.testclient import TestClient

from api.chat import app, fixture_replies, portfolio_context

client = TestClient(app)


def message(text, lang="es"):
    return {
        "id": "conversation",
        "trigger": "submit-message",
        "lang": lang,
        "messages": [{"id": "question", "role": "user", "parts": [{"type": "text", "text": text}]}],
    }


@pytest.mark.parametrize(
    ("lang", "question", "destination", "excerpt"),
    [
        ("es", "¿Qué ha hecho en IA médica?", "glio", "En AIJU"),
        ("en", "What are Alex's technical skills?", "skills", "PyTorch"),
        ("en", "Can I see the CV?", "cv", "preview and download"),
    ],
)
def test_streams_answer_with_validated_destination(monkeypatch, lang, question, destination, excerpt):
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_MODE", "fixture")
    monkeypatch.delenv("VERCEL_ENV", raising=False)
    response = client.post("/api/chat", json=message(question, lang))

    assert response.status_code == 200
    assert response.headers["x-vercel-ai-ui-message-stream"] == "v1"
    assert response.headers["cache-control"] == "no-store"
    events = [
        json.loads(line[6:])
        for line in response.text.splitlines()
        if line.startswith("data: ") and line != "data: [DONE]"
    ]
    assert [event["data"] for event in events if event["type"] == "data-destination"] == [destination]
    assert excerpt in "".join(event["delta"] for event in events if event["type"] == "text-delta")
    assert response.text.strip().endswith("data: [DONE]")


def test_disabled_in_production_and_by_default(monkeypatch):
    monkeypatch.delenv("PORTFOLIO_ASSISTANT_MODE", raising=False)
    assert client.post("/api/chat", json=message("CV")).status_code == 404
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_MODE", "fixture")
    monkeypatch.setenv("VERCEL_ENV", "production")
    assert client.post("/api/chat", json=message("CV")).status_code == 404


def test_missing_key_and_invalid_input(monkeypatch):
    monkeypatch.delenv("VERCEL_ENV", raising=False)
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_MODE", "live")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    assert client.post("/api/chat", json=message("CV")).status_code == 503
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_MODE", "fixture")
    assert client.post("/api/chat", json=message("CV", "fr")).status_code == 400
    assert client.post("/api/chat", json=message("")).status_code == 400
    assert client.post("/api/chat", content=b"x" * 25_000).status_code == 413


def test_public_project_context_is_localized():
    assert "medicina de precisión" in portfolio_context("es")
    assert "precision medicine" in portfolio_context("en").lower()
    assert "Cookobot" in portfolio_context("en")


@pytest.mark.parametrize(
    ("lang", "role", "work"),
    [
        ("es", "Desarrollador Full Stack y Robótica", "control remoto del robot"),
        ("en", "Full Stack and Robotics Developer", "remote robot control"),
    ],
)
def test_context_contains_cookobot_contribution(lang, role, work):
    cookobot = next(line for line in portfolio_context(lang).splitlines() if line.startswith("- Cookobot."))
    assert role in cookobot
    assert work in cookobot


def test_preview_and_demo_share_replies():
    for messages in fixture_replies().values():
        assert "GuruSup" in messages["desktop.replyProfile"]
    assert "proyectos destacados" not in fixture_replies()["es"]["desktop.replyProfile"]
