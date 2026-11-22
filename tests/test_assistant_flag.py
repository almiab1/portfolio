# ABOUTME: Checks PostHog flag evaluation without making network requests.
# ABOUTME: Covers deployment defaults, outgoing privacy, response parsing and cache expiry.
import asyncio
import json

import httpx2
import pytest

from server import assistant_flag

KEY = "portfolio-assistant-enabled"


@pytest.fixture(autouse=True)
def clean_configuration(monkeypatch):
    monkeypatch.delenv("PORTFOLIO_ASSISTANT_FLAG_TOKEN", raising=False)
    monkeypatch.delenv("PUBLIC_POSTHOG_PROJECT_TOKEN", raising=False)
    monkeypatch.setattr(assistant_flag, "_cached_flag", None)


def mock_flags(monkeypatch, handler):
    def flags_client(**kwargs):
        return httpx2.AsyncClient(transport=httpx2.MockTransport(handler), **kwargs)

    monkeypatch.setattr(assistant_flag, "AsyncClient", flags_client)


def test_missing_flag_config_does_not_make_a_request(monkeypatch):
    def unexpected(request):
        pytest.fail("An unconfigured assistant must not call PostHog")

    mock_flags(monkeypatch, unexpected)
    assert asyncio.run(assistant_flag.assistant_enabled(True)) is False
    assert asyncio.run(assistant_flag.assistant_enabled(False)) is True

    monkeypatch.setenv("PUBLIC_POSTHOG_PROJECT_TOKEN", "analytics-token")
    assert asyncio.run(assistant_flag.assistant_enabled(False)) is True


@pytest.mark.parametrize("enable_first", [True, False])
def test_flag_request_is_anonymous_and_both_results_expire(enable_first, monkeypatch):
    monkeypatch.setenv("PUBLIC_POSTHOG_PROJECT_TOKEN", "analytics-token")
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_FLAG_TOKEN", "assistant-token")
    now = 100.0
    enabled = enable_first
    calls = []

    def handle(request):
        assert request.method == "POST"
        assert str(request.url) == "https://eu.i.posthog.com/flags/?v=2"
        payload = json.loads(request.content)
        assert payload == {
            "api_key": "assistant-token",
            "distinct_id": "portfolio-assistant-server",
            "flag_keys_to_evaluate": [KEY],
            "geoip_disable": True,
        }
        calls.append(payload)
        return httpx2.Response(200, json={"flags": {KEY: {"enabled": enabled}}})

    mock_flags(monkeypatch, handle)
    monkeypatch.setattr(assistant_flag, "monotonic", lambda: now)
    assert asyncio.run(assistant_flag.assistant_enabled(True)) is enable_first
    enabled = not enable_first
    now += 29
    assert asyncio.run(assistant_flag.assistant_enabled(True)) is enable_first
    assert len(calls) == 1
    now += 1
    assert asyncio.run(assistant_flag.assistant_enabled(True)) is enabled
    assert len(calls) == 2


@pytest.mark.parametrize("result", [
    {"flags": {}},
    {"flags": {KEY: {"enabled": "true"}}},
    {"flags": {KEY: {"enabled": True, "variant": "treatment"}}},
    {"errorsWhileComputingFlags": True, "flags": {KEY: {"enabled": True}}},
    {"quotaLimited": ["feature_flags"], "flags": {KEY: {"enabled": True}}},
    {"flags": {KEY: {"enabled": True, "failed": True}}},
], ids=["absent", "not-boolean", "multivariate", "evaluation-error", "quota-limited", "failed"])
def test_invalid_flag_result_is_disabled(monkeypatch, result):
    monkeypatch.setenv("PUBLIC_POSTHOG_PROJECT_TOKEN", "analytics-token")

    def handle(request):
        assert json.loads(request.content)["api_key"] == "analytics-token"
        return httpx2.Response(200, json=result)

    mock_flags(monkeypatch, handle)
    assert asyncio.run(assistant_flag.assistant_enabled(True)) is False


@pytest.mark.parametrize("failure", ["status", "json", "timeout"])
def test_explicit_local_flag_fails_closed_on_remote_failure(monkeypatch, failure):
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_FLAG_TOKEN", "assistant-token")

    def handle(request):
        if failure == "timeout":
            raise httpx2.ReadTimeout("upstream unavailable", request=request)
        return httpx2.Response(503 if failure == "status" else 200, content="unavailable")

    mock_flags(monkeypatch, handle)
    assert asyncio.run(assistant_flag.assistant_enabled(False)) is False



def test_overlapping_callers_share_the_same_refresh(monkeypatch):
    monkeypatch.setenv("PORTFOLIO_ASSISTANT_FLAG_TOKEN", "assistant-token")

    async def scenario():
        started = asyncio.Event()
        finish = asyncio.Event()
        calls = []

        async def handle(request):
            calls.append(request)
            started.set()
            await finish.wait()
            return httpx2.Response(200, json={"flags": {KEY: {"enabled": True}}})

        mock_flags(monkeypatch, handle)
        first = asyncio.create_task(assistant_flag.assistant_enabled(True))
        await started.wait()
        second = asyncio.create_task(assistant_flag.assistant_enabled(True))
        await asyncio.sleep(0)
        first.cancel()
        with pytest.raises(asyncio.CancelledError):
            await first
        finish.set()
        assert await second is True
        assert len(calls) == 1

    asyncio.run(scenario())
