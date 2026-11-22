# ABOUTME: Tests Turnstile responses and configuration without external network calls.
# ABOUTME: Ensures hosted chat only accepts a valid result for its own host and action.
import asyncio
import json

import httpx2
import pytest
from fastapi import HTTPException

from server.assistant_challenge import SITEVERIFY_URL, verify_challenge

HOSTNAME = "project-deployment.vercel.app"
SECRET = "test-secret"
TOKEN = "test-token"
VALID_RESULT = {"success": True, "hostname": HOSTNAME, "action": "portfolio_chat"}


def verify_with_remote(monkeypatch, remote):
    monkeypatch.setenv("PORTFOLIO_TURNSTILE_SECRET_KEY", SECRET)

    def mock_client(**kwargs):
        return httpx2.AsyncClient(transport=httpx2.MockTransport(remote), **kwargs)

    monkeypatch.setattr("server.assistant_challenge.AsyncClient", mock_client)
    asyncio.run(verify_challenge(TOKEN, HOSTNAME))


def test_accepts_a_verified_token_for_the_deployment(monkeypatch):
    def remote(request):
        assert request.method == "POST"
        assert str(request.url) == SITEVERIFY_URL
        assert json.loads(request.content) == {"secret": SECRET, "response": TOKEN}
        return httpx2.Response(200, json=VALID_RESULT)

    verify_with_remote(monkeypatch, remote)


@pytest.mark.parametrize(
    "result",
    [
        [],
        {},
        {**VALID_RESULT, "success": 1},
        {**VALID_RESULT, "success": False, "error-codes": ["timeout-or-duplicate"]},
        {**VALID_RESULT, "hostname": "other.example.test"},
        {**VALID_RESULT, "action": "other_action"},
    ],
)
def test_rejects_anything_other_than_the_expected_result(monkeypatch, result):
    with pytest.raises(HTTPException) as error:
        verify_with_remote(monkeypatch, lambda _: httpx2.Response(200, json=result))
    assert error.value.status_code == 403


@pytest.mark.parametrize("failure", ["status", "invalid-json", "timeout"])
def test_remote_failure_is_generic_and_does_not_retry(monkeypatch, failure):
    calls = []

    def remote(request):
        calls.append(request)
        if failure == "status":
            return httpx2.Response(500, text="private response")
        if failure == "invalid-json":
            return httpx2.Response(200, text="private response")
        raise httpx2.ReadTimeout("private response", request=request)

    with pytest.raises(HTTPException) as error:
        verify_with_remote(monkeypatch, remote)
    assert error.value.status_code == 503
    assert error.value.detail == "Assistant challenge unavailable"
    assert len(calls) == 1


@pytest.mark.parametrize(
    "secret",
    [
        "",
        "1x0000000000000000000000000000000AA",
        "2x0000000000000000000000000000000AA",
        "3x0000000000000000000000000000000AA",
    ],
)
def test_unusable_credentials_do_not_lead_to_a_remote_call(monkeypatch, secret):
    monkeypatch.setenv("PORTFOLIO_TURNSTILE_SECRET_KEY", secret)

    def remote(**kwargs):
        pytest.fail("Siteverify only accepts a configured real secret")

    monkeypatch.setattr("server.assistant_challenge.AsyncClient", remote)
    with pytest.raises(HTTPException) as error:
        asyncio.run(verify_challenge(TOKEN, HOSTNAME))
    assert error.value.status_code == 503
