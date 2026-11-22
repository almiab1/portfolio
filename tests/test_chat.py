# ABOUTME: Exercises the preview chat endpoint with a deterministic Pydantic AI model.
# ABOUTME: Checks both locales, Vercel stream chunks and the preview deployment boundary.
import json

import httpx2
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from contextlib import asynccontextmanager

from pydantic_ai.messages import ModelResponse, TextPart
from pydantic_ai.models.function import FunctionModel

from api.chat import app, fixture_replies
from server.assistant_security import RequestLimiter

client = TestClient(app)
DEPLOYMENT_HOST = "project-deployment.vercel.app"
PUBLIC_HOST = "www.alejandromira.com"
CHALLENGE_TOKEN = "test-challenge-token"


@pytest.fixture(params=["preview", "production"])
def hosted_live(monkeypatch, request):
    environment = request.param
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_MODE", "live")
    monkeypatch.setenv("VERCEL_ENV", environment)
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_PUBLIC_LIVE", "1")
    monkeypatch.setenv("VERCEL_URL", DEPLOYMENT_HOST)
    monkeypatch.setenv("NVIDIA_API_KEY", "preview-nvidia-key")
    monkeypatch.delenv("PORTFOLIO_TURNSTILE_SECRET_KEY", raising=False)
    monkeypatch.setattr("api.chat.limiter", RequestLimiter())
    return PUBLIC_HOST if environment == "production" else DEPLOYMENT_HOST


def post_hosted_chat(host, payload, token=CHALLENGE_TOKEN):
    origin = f"https://{host}"
    headers = {"Origin": origin, "Sec-Fetch-Site": "same-origin"}
    if token is not None:
        headers["X-Portfolio-Challenge"] = token
    return client.post(f"{origin}/api/chat", json=payload, headers=headers)



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
    assert client.post("/api/chat", json=message("Compare GLIO-IA and Cookobot", "en")).status_code == 503
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_MODE", "fixture")
    assert client.post("/api/chat", json=message("CV", "fr")).status_code == 400
    assert client.post("/api/chat", json=message("")).status_code == 400
    assert client.post(
        "/api/chat", content=b"x" * 25_000, headers={"Content-Type": "application/json"}
    ).status_code == 413


def test_hosted_comparison_uses_one_model_turn_after_challenge(hosted_live, monkeypatch):
    order = []

    async def verify(token, hostname):
        assert (token, hostname) == (CHALLENGE_TOKEN, hosted_live)
        order.append("challenge")

    async def reserve(client):
        assert client == "testclient"
        order.append("quota")

    @asynccontextmanager
    async def provider(reserve_attempt):
        async def respond(messages, info):
            await reserve_attempt()
            assert not info.function_tools
            material = repr(messages)
            assert "Cookobot" in material and "GLIO-IA" in material
            assert "visitor@example.test" not in material
            order.append("model")
            return ModelResponse(parts=[TextPart("Two published projects.")], finish_reason="stop")
        yield FunctionModel(respond)

    monkeypatch.setattr("api.chat.verify_challenge", verify)
    monkeypatch.setattr("api.chat.reserve_inference_budget", reserve)
    monkeypatch.setattr("api.chat.open_model", provider)
    payload = message("Compare Alex's contributions to GLIO-IA and Cookobot", "en")
    payload["messages"].insert(0, {"id": "previous", "role": "assistant",
        "parts": [{"type": "text", "text": "visitor@example.test"}]})
    response = post_hosted_chat(hosted_live, payload)
    assert order == ["challenge", "quota", "model"]
    assert response.status_code == 200
    assert "Two published projects." in response.text
    assert response.text.strip().endswith("data: [DONE]")


def test_verified_preset_uses_no_inference_or_quota(hosted_live, monkeypatch):
    async def verify(token, hostname):
        assert token == CHALLENGE_TOKEN and hostname == hosted_live

    def unexpected(*args, **kwargs):
        pytest.fail("An editorial reply must stay local")
    monkeypatch.setattr("api.chat.verify_challenge", verify)
    monkeypatch.setattr("api.chat.open_model", unexpected)
    monkeypatch.setattr("api.chat.reserve_inference_budget", unexpected)
    response = post_hosted_chat(hosted_live, {**message("¿Puedo ver su CV?"), "preset": "cv"})
    assert response.status_code == 200
    assert "PDF" in response.text


def test_preview_and_demo_share_replies():
    for messages in fixture_replies().values():
        assert "GuruSup" in messages["desktop.replyProfile"]
    assert "proyectos destacados" not in fixture_replies()["es"]["desktop.replyProfile"]


@pytest.mark.parametrize(
    ("token", "remote_result", "status"),
    [
        (None, None, 403),
        ("x" * 2049, None, 403),
        (CHALLENGE_TOKEN, {"success": False}, 403),
        (CHALLENGE_TOKEN, None, 503),
    ],
    ids=["missing-challenge", "oversized-challenge", "invalid-challenge", "challenge-unavailable"],
)
def test_hosted_without_valid_challenge_does_not_use_quota_or_respond(
    hosted_live, monkeypatch, token, remote_result, status
):
    if remote_result is not None:
        monkeypatch.setenv("PORTFOLIO_TURNSTILE_SECRET_KEY", "test-turnstile-secret")

        def challenge_client(**kwargs):
            transport = httpx2.MockTransport(lambda _: httpx2.Response(200, json=remote_result))
            return httpx2.AsyncClient(transport=transport, **kwargs)

        monkeypatch.setattr("server.assistant_challenge.AsyncClient", challenge_client)

    async def reserve(client_id):
        pytest.fail("The shared quota must only run after challenge verification")

    def provider(*args, **kwargs):
        pytest.fail("NVIDIA must only run after challenge verification")

    monkeypatch.setattr("api.chat.reserve_inference_budget", reserve)
    monkeypatch.setattr("api.chat.open_model", provider)

    for question in ("What work has Alex done?", "My email is visitor@example.test."):
        response = post_hosted_chat(hosted_live, message(question), token)
        assert response.status_code == status
        assert "x-vercel-ai-ui-message-stream" not in response.headers


@pytest.mark.parametrize("status", [429, 503])
def test_hosted_denial_preserves_http_status(hosted_live, monkeypatch, status):
    async def verify(token, hostname):
        return None

    async def reserve(client_id):
        raise HTTPException(status_code=status, detail="Assistant budget unavailable")

    monkeypatch.setattr("api.chat.verify_challenge", verify)
    monkeypatch.setattr("api.chat.reserve_inference_budget", reserve)
    response = post_hosted_chat(hosted_live, message("Compare GLIO-IA and Cookobot", "en"))
    assert response.status_code == status
    assert "x-vercel-ai-ui-message-stream" not in response.headers


@pytest.mark.parametrize(
    ("mode", "opt_in"),
    [("live", None), ("live", "true"), ("fixture", "1")],
    ids=["missing-opt-in", "wrong-opt-in", "fixture"],
)
def test_production_requires_an_explicit_live_opt_in(monkeypatch, mode, opt_in):
    monkeypatch.setenv("VERCEL_ENV", "production")
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_MODE", mode)
    if opt_in is None:
        monkeypatch.delenv("PORTFOLIO_ASSISTANT_PUBLIC_LIVE", raising=False)
    else:
        monkeypatch.setenv("PORTFOLIO_ASSISTANT_PUBLIC_LIVE", opt_in)

    assert post_hosted_chat(PUBLIC_HOST, message("CV")).status_code == 404


@pytest.mark.parametrize(
    ("host", "origin"),
    [
        (DEPLOYMENT_HOST, f"https://{DEPLOYMENT_HOST}"),
        ("alejandromira.com", "https://alejandromira.com"),
        (PUBLIC_HOST, None),
        (PUBLIC_HOST, f"http://{PUBLIC_HOST}"),
        (PUBLIC_HOST, f"https://{DEPLOYMENT_HOST}"),
    ],
    ids=["deployment-url", "apex", "missing-origin", "http-origin", "other-origin"],
)
def test_production_requires_the_public_hostname_and_https_origin(monkeypatch, host, origin):
    monkeypatch.setenv("VERCEL_ENV", "production")
    monkeypatch.setenv("VERCEL_URL", DEPLOYMENT_HOST)
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_MODE", "live")
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_PUBLIC_LIVE", "1")
    monkeypatch.setattr("api.chat.limiter", RequestLimiter())

    headers = {"Origin": origin} if origin else {}
    response = client.post(f"https://{host}/api/chat", json=message("CV"), headers=headers)

    assert response.status_code == 403


def test_public_live_flag_does_not_enable_other_hosted_environments(monkeypatch):
    monkeypatch.setenv("VERCEL_ENV", "staging")
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_MODE", "live")
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_PUBLIC_LIVE", "1")

    assert post_hosted_chat(PUBLIC_HOST, message("CV")).status_code == 404


def test_hosted_live_fails_closed_without_budget_configuration(hosted_live, monkeypatch):
    monkeypatch.delenv("PORTFOLIO_ASSISTANT_REDIS_URL", raising=False)
    monkeypatch.delenv("PORTFOLIO_ASSISTANT_REDIS_TOKEN", raising=False)

    async def verify(token, hostname):
        assert (token, hostname) == (CHALLENGE_TOKEN, hosted_live)

    monkeypatch.setattr("api.chat.verify_challenge", verify)
    response = post_hosted_chat(hosted_live, message("Compare GLIO-IA and Cookobot", "en"))
    assert response.status_code == 503
    assert "x-vercel-ai-ui-message-stream" not in response.headers
