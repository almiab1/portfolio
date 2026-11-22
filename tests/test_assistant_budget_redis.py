# ABOUTME: Executes the production reservation Lua script against isolated local Redis.
# ABOUTME: Verifies concurrent admission limits and the rolling-window expiry boundaries.
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
from uuid import uuid4

import pytest

from server.assistant_budget import RESERVE


@pytest.fixture
def redis():
    server = shutil.which("redis-server")
    client = shutil.which("redis-cli")
    if not server or not client:
        pytest.skip("Local Redis integration requires redis-server and redis-cli")

    with tempfile.TemporaryDirectory(prefix="budget-redis-") as directory:
        socket = Path(directory) / "redis.sock"
        process = subprocess.Popen(
            [
                server, "--port", "0", "--unixsocket", str(socket),
                "--dir", directory, "--save", "", "--appendonly", "no",
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        def command(*arguments):
            return subprocess.check_output(
                [client, "-e", "--raw", "-s", str(socket), *map(str, arguments)],
                text=True,
                timeout=5,
            ).strip()

        try:
            deadline = time.monotonic() + 5
            while not socket.exists():
                if process.poll() is not None or time.monotonic() >= deadline:
                    pytest.fail("The isolated Redis process did not start")
                time.sleep(0.01)
            assert command("PING") == "PONG"
            yield command
        finally:
            process.terminate()
            process.wait(timeout=5)


def reserve(redis, client, limits):
    keys = (f"client:{client}", "shared:minute", "shared:day")
    return int(redis("EVAL", RESERVE, 3, *keys, uuid4().hex, *limits))


@pytest.mark.parametrize(
    ("clients", "limits", "granted"),
    [
        (["same"] * 15, (3, 15, 15), 3),
        ([str(index) for index in range(15)], (15, 4, 15), 4),
        ([str(index) for index in range(15)], (15, 15, 5), 5),
    ],
)
def test_concurrent_requests_obey_each_ceiling(redis, clients, limits, granted):
    with ThreadPoolExecutor(max_workers=len(clients)) as pool:
        results = list(pool.map(lambda client: reserve(redis, client, limits), clients))

    assert results.count(1) == granted
    assert results.count(0) == len(clients) - granted
    assert int(redis("ZCARD", "shared:minute")) == granted
    assert int(redis("ZCARD", "shared:day")) == granted


@pytest.mark.parametrize(
    ("key", "window_ms", "limits"),
    [
        ("client:sample", 60_000, (1, 5, 5)),
        ("shared:minute", 60_000, (5, 1, 5)),
        ("shared:day", 86_400_000, (5, 5, 1)),
    ],
)
def test_expired_reservations_stop_counting(redis, key, window_ms, limits):
    seconds, microseconds = map(int, redis("TIME").splitlines())
    now_ms = seconds * 1_000 + microseconds // 1_000
    redis("ZADD", key, now_ms - window_ms + 10_000, "last-reservation")
    assert reserve(redis, "sample", limits) == 0

    redis("ZADD", key, now_ms - window_ms, "last-reservation")
    assert reserve(redis, "sample", limits) == 1
    assert int(redis("ZCARD", key)) == 1
