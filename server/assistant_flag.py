# ABOUTME: Evaluates the global PostHog flag for the portfolio assistant.
# ABOUTME: Caches availability briefly without using visitor or conversation data.
import asyncio
import os
from time import monotonic

from httpx2 import AsyncClient, HTTPError

FLAG_KEY = "portfolio-assistant-enabled"
FLAGS_URL = "https://eu.i.posthog.com/flags/?v=2"
FLAG_DISTINCT_ID = "portfolio-assistant-server"
FLAG_TIMEOUT = 1
FLAG_CACHE_SECONDS = 30
_cached_flag: tuple[str, float, bool] | None = None
_refreshes: dict[tuple[asyncio.AbstractEventLoop, str], asyncio.Task[bool]] = {}


async def _fetch_flag(token: str) -> bool:
    try:
        async with asyncio.timeout(FLAG_TIMEOUT), AsyncClient(trust_env=False) as client:
            response = await client.post(FLAGS_URL, json={
                "api_key": token,
                "distinct_id": FLAG_DISTINCT_ID,
                "flag_keys_to_evaluate": [FLAG_KEY],
                "geoip_disable": True,
            })
            response.raise_for_status()
            result = response.json()
    except (HTTPError, TimeoutError, ValueError):
        return False

    if not isinstance(result, dict) or result.get("errorsWhileComputingFlags"):
        return False
    quota_limited = result.get("quotaLimited", [])
    if not isinstance(quota_limited, list) or "feature_flags" in quota_limited:
        return False
    flags = result.get("flags")
    flag = flags.get(FLAG_KEY) if isinstance(flags, dict) else None
    return (
        isinstance(flag, dict)
        and flag.get("enabled") is True
        and flag.get("failed", False) is False
        and flag.get("variant") is None
    )


async def _refresh_flag(key: tuple[asyncio.AbstractEventLoop, str]) -> bool:
    global _cached_flag

    try:
        _, token = key
        enabled = await _fetch_flag(token)
        _cached_flag = (token, monotonic() + FLAG_CACHE_SECONDS, enabled)
        return enabled
    finally:
        _refreshes.pop(key, None)


async def assistant_enabled(hosted: bool) -> bool:
    token = os.environ.get("PORTFOLIO_ASSISTANT_FLAG_TOKEN", "").strip()
    if not token and hosted:
        token = os.environ.get("PUBLIC_POSTHOG_PROJECT_TOKEN", "").strip()
    if not token:
        return not hosted

    cached = _cached_flag
    if cached is not None and cached[0] == token and monotonic() < cached[1]:
        return cached[2]

    key = (asyncio.get_running_loop(), token)
    refresh = _refreshes.get(key)
    if refresh is None:
        refresh = asyncio.create_task(_refresh_flag(key))
        _refreshes[key] = refresh
    return await asyncio.shield(refresh)
