# ABOUTME: Exercises configured inference providers using their real SDKs and fake HTTP transports.
# ABOUTME: Verifies each outbound attempt is counted and budget failures stop inference.
import asyncio
import json

import httpx2
import pytest
from fastapi import HTTPException
from pydantic_ai.exceptions import ModelAPIError, ModelHTTPError
from pydantic_ai.messages import ModelRequest, TextPart, UserPromptPart
from pydantic_ai.models import ModelRequestParameters

from server import assistant_inference as inference

MESSAGES = [ModelRequest(parts=[UserPromptPart(content="Hi")])]


@pytest.fixture(autouse=True)
def clear_provider_environment(monkeypatch):
    for name in ("PORTFOLIO_ASSISTANT_PROVIDER", "PORTFOLIO_ASSISTANT_MODEL"):
        monkeypatch.delenv(name, raising=False)
    for name, _, _ in inference.PROVIDERS.values():
        monkeypatch.delenv(name, raising=False)


def configure(monkeypatch, provider, model="test-model"):
    if provider != "nvidia":
        monkeypatch.setenv("PORTFOLIO_ASSISTANT_PROVIDER", provider)
        monkeypatch.setenv("PORTFOLIO_ASSISTANT_MODEL", model)
    monkeypatch.setenv(inference.PROVIDERS[provider][0], "test-key")


@pytest.mark.parametrize("provider,model,credential", [
    ("nvidia", None, " "),
    ("unknown", "gpt-test", "key"),
    ("openai", None, "key"),
    ("anthropic", "https://example.net/path?x=1", "key"),
    ("openrouter", "org/model", None),
    ("openrouter", "unqualified-model", "key"),
])
def test_rejects_invalid_provider_configuration(monkeypatch, provider, model, credential):
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_PROVIDER", provider)
    if model is not None:
        monkeypatch.setenv("PORTFOLIO_ASSISTANT_MODEL", model)
    if credential is not None and provider in inference.PROVIDERS:
        monkeypatch.setenv(inference.PROVIDERS[provider][0], credential)
    with pytest.raises(inference.InferenceConfigurationError, match="Assistant provider is unavailable"):
        inference.provider_settings()


def install_transport(monkeypatch, handler):
    mock = httpx2.MockTransport(handler)
    monkeypatch.setattr(inference.httpx2, "AsyncHTTPTransport", lambda **_: mock)


def openai_chunk(delta, finish_reason=None):
    return {
        "id": "response-id", "object": "chat.completion.chunk", "created": 0,
        "model": "test-model", "choices": [{"index": 0, "delta": delta, "finish_reason": finish_reason}],
    }


def openai_stream(*chunks):
    content = "".join(f"data: {json.dumps(chunk)}\n\n" for chunk in chunks)
    return httpx2.Response(200, headers={"Content-Type": "text/event-stream"}, text=content + "data: [DONE]\n\n")


def anthropic_stream():
    events = [
        {"type": "message_start", "message": {
            "id": "message-id", "type": "message", "role": "assistant", "content": [],
            "model": "test-model", "stop_reason": None, "stop_sequence": None,
            "usage": {"input_tokens": 8, "output_tokens": 1},
        }},
        {"type": "content_block_start", "index": 0, "content_block": {"type": "text", "text": ""}},
        {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "Hello"}},
        {"type": "content_block_stop", "index": 0},
        {"type": "message_delta", "delta": {"stop_reason": "end_turn", "stop_sequence": None},
         "usage": {"output_tokens": 2}},
        {"type": "message_stop"},
    ]
    content = "".join(f"event: {event['type']}\ndata: {json.dumps(event)}\n\n" for event in events)
    return httpx2.Response(200, headers={"Content-Type": "text/event-stream"}, text=content)


@pytest.mark.parametrize("provider", ["nvidia", "anthropic", "openai", "openrouter"])
def test_streams_via_pinned_sdk_endpoint(monkeypatch, provider):
    configured_model = "openai/test-model" if provider == "openrouter" else "test-model"
    configure(monkeypatch, provider, configured_model)
    monkeypatch.setenv("OPENAI_BASE_URL", "https://example.net")
    monkeypatch.setenv("ANTHROPIC_BASE_URL", "https://example.net")
    monkeypatch.setenv("OPENAI_ORG_ID", "openai-org")
    steps = []

    async def reserve():
        steps.append("reserve")

    async def send(request):
        steps.append("send")
        _, base_url, path = inference.PROVIDERS[provider]
        assert request.method == "POST"
        assert request.url.copy_with(query=None) == httpx2.URL(base_url).copy_with(path=path)
        assert request.headers["authorization"] == "Bearer test-key"
        payload = json.loads(request.content)
        assert payload["model"] == (inference.NVIDIA_MODEL if provider == "nvidia" else configured_model)
        assert payload["stream"] is True
        if provider != "openai":
            assert "openai-organization" not in request.headers
        if provider == "nvidia":
            assert payload["chat_template_kwargs"] == {"enable_thinking": False}
            assert payload["max_tokens"] == 400
        if provider == "openrouter":
            assert payload["provider"]["allow_fallbacks"] is False
        if provider == "anthropic":
            return anthropic_stream()
        return openai_stream(openai_chunk({"content": "Hello"}), openai_chunk({}, "stop"))

    async def run():
        async with inference.open_model(reserve) as model:
            async with model.request_stream(MESSAGES, {"max_tokens": 400}, ModelRequestParameters()) as stream:
                async for _ in stream:
                    pass
                assert stream.get().parts == [TextPart(content="Hello")]

    install_transport(monkeypatch, send)
    asyncio.run(run())
    assert steps == ["reserve", "send"]
    assert inference.provider_secrets() == ("test-key",)


@pytest.mark.parametrize("provider", ["nvidia", "anthropic"])
@pytest.mark.parametrize("status_code", [429, 503])
def test_preserves_budget_failure_across_sdk_wrapping(monkeypatch, provider, status_code):
    configure(monkeypatch, provider)
    denial = HTTPException(status_code, "Unavailable")

    async def reserve():
        raise denial

    async def send(_):
        pytest.fail("A denied reservation was sent upstream")

    async def run():
        async with inference.open_model(reserve) as model:
            try:
                async with model.request_stream(MESSAGES, {"max_tokens": 400}, ModelRequestParameters()):
                    pytest.fail("A denied reservation produced a successful stream")
            except Exception:
                # The UI can consume the wrapped exception before the model scope exits.
                pass

    install_transport(monkeypatch, send)
    with pytest.raises(HTTPException) as caught:
        asyncio.run(run())
    assert caught.value is denial


def test_charges_each_failed_post_without_retrying_and_caps_the_turn(monkeypatch):
    configure(monkeypatch, "nvidia")
    steps = []

    async def reserve():
        steps.append("reserve")

    async def send(_):
        steps.append("send")
        return httpx2.Response(503, json={"error": {"message": "upstream unavailable"}})

    async def run():
        async with inference.open_model(reserve) as model:
            for _ in range(inference.MAX_INFERENCE_ATTEMPTS):
                with pytest.raises(ModelHTTPError) as caught:
                    await model.request(MESSAGES, {"max_tokens": 400}, ModelRequestParameters())
                assert caught.value.status_code == 503
            await model.request(MESSAGES, {"max_tokens": 400}, ModelRequestParameters())

    install_transport(monkeypatch, send)
    with pytest.raises(inference.InferenceBudgetDenied) as caught:
        asyncio.run(run())
    assert caught.value.status_code == 429
    assert steps == ["reserve", "send", "reserve", "send"]


def test_transport_rejects_other_hosts_and_methods_before_reserving(monkeypatch):
    async def unexpected(*_):
        pytest.fail("Unexpected request was admitted")

    async def run():
        endpoint = httpx2.URL("https://example.com/v1/messages")
        async with inference.BudgetedTransport(endpoint, unexpected) as transport:
            for request in (
                httpx2.Request("POST", "https://somewhere-else.example/v1/messages"),
                httpx2.Request("GET", endpoint),
                httpx2.Request("POST", "https://example.com/v1/other"),
            ):
                with pytest.raises(inference.InferenceConfigurationError):
                    await transport.handle_async_request(request)

    install_transport(monkeypatch, unexpected)
    asyncio.run(run())


def test_sdk_does_not_follow_redirects(monkeypatch):
    configure(monkeypatch, "nvidia")
    steps = []

    async def reserve():
        steps.append("reserve")

    async def send(request):
        steps.append(request.url.host)
        return httpx2.Response(307, headers={"Location": "https://elsewhere.example/v1/chat/completions"})

    async def run():
        async with inference.open_model(reserve) as model:
            with pytest.raises(ModelAPIError):
                await model.request(MESSAGES, {"max_tokens": 400}, ModelRequestParameters())

    install_transport(monkeypatch, send)
    asyncio.run(run())
    assert steps == ["reserve", "integrate.api.nvidia.com"]
