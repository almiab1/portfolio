# ABOUTME: Reserves hosted live assistant requests against a shared Redis inference budget.
# ABOUTME: Keeps client identifiers and failures out of Redis payloads and public error details.
import asyncio
import hmac
import os
import re
from uuid import uuid4

import httpx2
from fastapi import HTTPException

REDIS_TIMEOUT_SECONDS = 2
KEY_PREFIX = "{portfolio-assistant}:budget"
# Redis serializes the cutoff, checks and writes across all Preview instances.
# Each sorted set retains admitted requests within its rolling window.
RESERVE = """
local clock = redis.call('TIME')
local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)
local windows = {60000, 60000, 86400000}
for index, key in ipairs(KEYS) do
    redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windows[index])
    if redis.call('ZCARD', key) >= tonumber(ARGV[index + 1]) then
        return 0
    end
end
for index, key in ipairs(KEYS) do
    redis.call('ZADD', key, now, ARGV[1])
    redis.call('PEXPIRE', key, windows[index])
end
return 1
"""


def _limit(name: str, default: int) -> int:
    value = os.environ.get(f"PORTFOLIO_ASSISTANT_{name}", str(default))
    if re.fullmatch(r"[1-9][0-9]{0,6}", value) is None:
        raise ValueError("Invalid budget limit")
    return int(value)


async def reserve_inference_budget(client_id: str) -> None:
    """Reserve one hosted live request or stop it with a generic HTTP error."""
    try:
        url = httpx2.URL(os.environ.get("PORTFOLIO_ASSISTANT_REDIS_URL", ""))
        token = os.environ.get("PORTFOLIO_ASSISTANT_REDIS_TOKEN", "")
        if (
            url.scheme != "https"
            or not url.host
            or url.userinfo
            or url.raw_path != b"/"
            or url.fragment
            or re.fullmatch(r"[!-~]+", token) is None
        ):
            raise ValueError("Invalid budget configuration")

        client_key = hmac.digest(token.encode(), client_id.encode(), "sha256").hex()
        command = [
            "EVAL",
            RESERVE,
            3,
            f"{KEY_PREFIX}:client:{client_key}",
            f"{KEY_PREFIX}:minute",
            f"{KEY_PREFIX}:day",
            uuid4().hex,
            _limit("CLIENT_PER_MINUTE", 10),
            _limit("GLOBAL_PER_MINUTE", 30),
            _limit("GLOBAL_PER_DAY", 100),
        ]
        async with asyncio.timeout(REDIS_TIMEOUT_SECONDS), httpx2.AsyncClient(
            follow_redirects=False, trust_env=False,
        ) as client:
            response = await client.post(
                url, headers={"Authorization": f"Bearer {token}"}, json=command,
            )
            if response.status_code != 200:
                raise ValueError("Invalid budget status")
            payload = response.json()
        if not isinstance(payload, dict) or payload.keys() != {"result"}:
            raise ValueError("Invalid budget response")
        result = payload["result"]
        if type(result) is not int or result not in (0, 1):
            raise ValueError("Invalid budget result")
    except (httpx2.HTTPError, httpx2.InvalidURL, TimeoutError, ValueError):
        raise HTTPException(status_code=503, detail="Assistant temporarily unavailable") from None

    if result == 0:
        raise HTTPException(status_code=429, detail="Assistant request limit reached")
