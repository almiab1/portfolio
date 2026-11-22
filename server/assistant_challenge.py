# ABOUTME: Verifies the browser challenge for hosted portfolio assistant requests.
# ABOUTME: Allows only successful Turnstile checks for the deployment host and chat action.
import asyncio
import os

from fastapi import HTTPException
from httpx2 import AsyncClient, HTTPError

SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
CHALLENGE_HEADER = "X-Portfolio-Challenge"
CHALLENGE_ACTION = "portfolio_chat"
MAX_TOKEN_LENGTH = 2048
SITEVERIFY_TIMEOUT = 3
DUMMY_SECRETS = frozenset({
    "1x0000000000000000000000000000000AA",
    "2x0000000000000000000000000000000AA",
    "3x0000000000000000000000000000000AA",
})


async def verify_challenge(token: str | None, hostname: str) -> None:
    if not token or len(token) > MAX_TOKEN_LENGTH or not token.strip():
        raise HTTPException(status_code=403, detail="Assistant challenge required")

    secret = os.environ.get("PORTFOLIO_TURNSTILE_SECRET_KEY", "").strip()
    if not hostname or not secret or secret in DUMMY_SECRETS:
        raise HTTPException(status_code=503, detail="Assistant challenge unavailable")

    try:
        async with asyncio.timeout(SITEVERIFY_TIMEOUT), AsyncClient(trust_env=False) as client:
            response = await client.post(SITEVERIFY_URL, json={"secret": secret, "response": token})
            response.raise_for_status()
            result = response.json()
    except (HTTPError, TimeoutError, ValueError):
        raise HTTPException(status_code=503, detail="Assistant challenge unavailable") from None

    if (
        not isinstance(result, dict)
        or result.get("success") is not True
        or result.get("hostname") != hostname
        or result.get("action") != CHALLENGE_ACTION
    ):
        raise HTTPException(status_code=403, detail="Assistant challenge rejected")
