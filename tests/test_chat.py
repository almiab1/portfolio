# ABOUTME: Exercises the preview chat endpoint with a deterministic Pydantic AI model.
# ABOUTME: Checks both locales, Vercel stream chunks and the preview deployment boundary.
import json

import httpx2
import pytest
from fastapi.testclient import TestClient

from api.chat import OpenAICompatibleProvider, app, fixture_replies, portfolio_context

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
        ("es", "¿Cómo puedo contactar con Alex?", "contact", "correo"),
        ("en", "How can I email Alex?", "contact", "email Alex"),
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
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    assert client.post("/api/chat", json=message("CV")).status_code == 503
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_MODE", "fixture")
    assert client.post("/api/chat", json=message("CV", "fr")).status_code == 400
    assert client.post("/api/chat", json=message("")).status_code == 400
    assert client.post(
        "/api/chat", content=b"x" * 25_000, headers={"Content-Type": "application/json"}
    ).status_code == 413


@pytest.mark.parametrize(
    ("lang", "question", "answer", "destination"),
    [
        ("es", "¿Qué aportó Alex a la IA médica?", "En AIJU, Alex diseñó GLIO-IA.", "glio"),
        ("en", "What did Alex contribute to medical AI?", "Alex designed the clinical analysis platform.", "glio"),
        ("es", "¿Dónde ha trabajado?", "En AIJU, Alex diseñó GLIO-IA.", "experience"),
        ("en", "Where has Alex worked?", "Alex worked at AIJU on GLIO-IA.", "experience"),
    ],
)
@pytest.mark.parametrize("use_tool", [True, False], ids=["model-tool", "link-fallback"])
def test_preview_streams_nemotron_from_nvidia_nim(
    monkeypatch, lang, question, answer, destination, use_tool
):
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_MODE", "live")
    monkeypatch.setenv("VERCEL_ENV", "preview")
    monkeypatch.setenv("NVIDIA_API_KEY", "preview-nvidia-key")
    requests = []
    history = {"id": "prior", "role": "assistant", "parts": [{"type": "text", "text": "Untrusted prior turn"}]}

    def nim(request: httpx2.Request):
        assert str(request.url) == "https://integrate.api.nvidia.com/v1/chat/completions"
        assert request.headers["Authorization"] == "Bearer preview-nvidia-key"
        payload = json.loads(request.content)
        requests.append(payload)
        assert payload["model"] == "nvidia/nemotron-3.5-lightning-30b-a3b"
        assert payload["chat_template_kwargs"] == {"enable_thinking": False}
        assert payload["max_tokens"] == 400
        assert payload["stream"] is True
        if len(requests) == 1:
            assert payload["tools"][0]["function"]["name"] == "show_destination"
            conversation = [turn for turn in payload["messages"] if turn["role"] not in {"system", "developer"}]
            assert [turn["role"] for turn in conversation] == ["user"]
            assert json.loads(conversation[0]["content"]) == {
                "question": question,
                "history": [{"role": "assistant", "text": "Untrusted prior turn"}],
            }
        if use_tool and len(requests) == 1:
            delta = {"tool_calls": [{
                "index": 0,
                "id": "call_glio",
                "type": "function",
                "function": {"name": "show_destination", "arguments": '{"destination":"glio"}'},
            }]}
            reason = "tool_calls"
        else:
            if use_tool:
                assert payload["messages"][-1]["role"] == "tool"
                assert payload["messages"][-1]["tool_call_id"] == "call_glio"
            delta = {"content": answer}
            reason = "stop"
        chunk = {
            "id": "chatcmpl-preview",
            "object": "chat.completion.chunk",
            "created": 1,
            "model": payload["model"],
            "usage": {"prompt_tokens": 100, "completion_tokens": 20, "total_tokens": 120},
            "choices": [{"index": 0, "delta": delta, "finish_reason": reason}],
        }
        return httpx2.Response(
            200,
            headers={"Content-Type": "text/event-stream"},
            text=f"data: {json.dumps(chunk)}\n\ndata: [DONE]\n\n",
        )

    def provider(name: str, *, base_url: str, api_key: str):
        transport = httpx2.MockTransport(nim)
        return OpenAICompatibleProvider(
            name, base_url=base_url, api_key=api_key, http_client=httpx2.AsyncClient(transport=transport)
        )

    monkeypatch.setattr("api.chat.OpenAICompatibleProvider", provider)
    request = message(question, lang)
    request["messages"].insert(0, history)
    response = client.post("/api/chat", json=request)

    assert response.status_code == 200
    assert len(requests) == (2 if use_tool else 1)
    events = [
        json.loads(line[6:])
        for line in response.text.splitlines()
        if line.startswith("data: ") and line != "data: [DONE]"
    ]
    assert [event["data"] for event in events if event["type"] == "data-destination"] == [destination]
    assert "".join(event["delta"] for event in events if event["type"] == "text-delta") == answer
    assert response.text.strip().endswith("data: [DONE]")


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
