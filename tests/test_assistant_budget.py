# ABOUTME: Verifies the hosted inference budget REST exchange without a cloud service.
# ABOUTME: Checks that denied or unverifiable reservations always stop before inference.
import asyncio
import json

import httpx2
import pytest
from fastapi import HTTPException

from server import assistant_budget

CLIENT_ID = "mock-client"
REDIS_URL = "https://redis.example.test/"
REDIS_TOKEN = "mock-budget-secret"


@pytest.fixture
def budget_config(monkeypatch):
    for suffix in ("CLIENT_PER_MINUTE", "GLOBAL_PER_MINUTE", "GLOBAL_PER_DAY"):
        monkeypatch.delenv(f"PORTFOLIO_ASSISTANT_{suffix}", raising=False)
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_REDIS_URL", REDIS_URL)
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_REDIS_TOKEN", REDIS_TOKEN)


def mock_redis(monkeypatch, handler):
    client_class = httpx2.AsyncClient

    def client(**kwargs):
        return client_class(transport=httpx2.MockTransport(handler), **kwargs)

    monkeypatch.setattr(assistant_budget.httpx2, "AsyncClient", client)


def test_reserves_all_windows_in_one_command_without_raw_client_id(monkeypatch, budget_config):
    requests = []

    def accept(request):
        assert request.method == "POST"
        assert str(request.url) == REDIS_URL
        assert request.headers["Authorization"] == f"Bearer {REDIS_TOKEN}"
        assert CLIENT_ID.encode() not in request.content
        assert REDIS_TOKEN.encode() not in request.content
        requests.append(json.loads(request.content))
        return httpx2.Response(200, json={"result": 1})

    mock_redis(monkeypatch, accept)
    asyncio.run(assistant_budget.reserve_inference_budget(CLIENT_ID))
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_GLOBAL_PER_DAY", "25")
    asyncio.run(assistant_budget.reserve_inference_budget(CLIENT_ID))

    first, second = requests
    assert first[:3] == ["EVAL", assistant_budget.RESERVE, 3]
    assert first[3:6] == second[3:6]
    assert len(set(first[3:6])) == 3
    assert first[6] != second[6]
    assert first[7:] == [10, 30, 100]
    assert second[7:] == [10, 30, 25]


@pytest.mark.parametrize(
    ("http_status", "payload", "expected_status"),
    [
        (200, {"result": 0}, 429),
        (200, {"result": True}, 503),
        (200, {"result": "1"}, 503),
        (200, {"result": 1, "error": "private diagnostics"}, 503),
        (200, ["unexpected"], 503),
        (201, {"result": 1}, 503),
        (503, {"result": 1}, 503),
    ],
)
def test_denied_or_unverified_reservations_fail_closed(
    monkeypatch, budget_config, http_status, payload, expected_status,
):
    mock_redis(monkeypatch, lambda request: httpx2.Response(http_status, json=payload))
    with pytest.raises(HTTPException) as rejected:
        asyncio.run(assistant_budget.reserve_inference_budget(CLIENT_ID))
    assert rejected.value.status_code == expected_status
    assert rejected.value.detail in {
        "Assistant request limit reached",
        "Assistant temporarily unavailable",
    }


@pytest.mark.parametrize(
    ("name", "value"),
    [
        ("REDIS_URL", ""),
        ("REDIS_URL", "http://redis.example.test/"),
        ("REDIS_URL", "https://user:secret@redis.example.test/"),
        ("REDIS_URL", "https://redis.example.test/?secret=value"),
        ("REDIS_TOKEN", ""),
        ("GLOBAL_PER_DAY", "0"),
    ],
)
def test_invalid_configuration_fails_without_contacting_redis(
    monkeypatch, budget_config, name, value,
):
    monkeypatch.setenv(f"PORTFOLIO_ASSISTANT_{name}", value)

    def unexpected_request(request):
        pytest.fail("Invalid configuration must stop before the network call")

    mock_redis(monkeypatch, unexpected_request)
    with pytest.raises(HTTPException) as rejected:
        asyncio.run(assistant_budget.reserve_inference_budget(CLIENT_ID))
    assert rejected.value.status_code == 503


def test_timeout_fails_closed(monkeypatch, budget_config):
    async def delayed_response(request):
        await asyncio.sleep(10)
        return httpx2.Response(200, json={"result": 1})

    monkeypatch.setattr(assistant_budget, "REDIS_TIMEOUT_SECONDS", 0.01)
    mock_redis(monkeypatch, delayed_response)
    with pytest.raises(HTTPException) as rejected:
        asyncio.run(assistant_budget.reserve_inference_budget(CLIENT_ID))
    assert rejected.value.status_code == 503
