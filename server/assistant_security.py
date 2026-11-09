# ABOUTME: Validates the assistant's request boundary and filters model output before publication.
# ABOUTME: Keeps credentials, provider internals and unapproved navigation out of the UI stream.
import logging
import math
import os
import re
import time
import unicodedata
from collections.abc import AsyncIterator
from ipaddress import ip_address
from threading import Lock
from typing import Literal, get_args
from urllib.parse import urlsplit

from fastapi import HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from pydantic_ai.ui.vercel_ai.response_types import (
    AbortChunk,
    BaseChunk,
    DataChunk,
    DoneChunk,
    ErrorChunk,
    FinishChunk,
    StartChunk,
    TextDeltaChunk,
    TextEndChunk,
    TextStartChunk,
)

Language = Literal["es", "en"]
Destination = Literal["profile", "work", "experience", "skills", "contact", "cv", "glio"]
DESTINATIONS = frozenset(get_args(Destination))
MAX_REQUEST_BYTES = 24_000
MAX_HISTORY_MESSAGES = 9
MAX_MESSAGE_CHARS = 1_200
MAX_REPLY_BYTES = 8_000
POLICY_MARKER = "[portfolio-assistant-internal-policy]"
PUBLIC_EMAIL = "miraabad.alejandro@gmail.com"

CREDENTIAL = re.compile(
    r"-----BEGIN [A-Z ]*PRIVATE KEY-----|"
    r"\b(?:nvapi-|sk-(?:proj-)?|gh[pousr]_|github_pat_|xox[baprs]-|AKIA)[A-Za-z0-9_-]{12,}|"
    r"\b(?:api[_ -]?key|access[_ -]?token|password|secret|contraseña)\s*[:=]\s*['\"]?[A-Za-z0-9_./+-]{12,}",
    re.IGNORECASE,
)
EMAIL = re.compile(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", re.IGNORECASE)
INJECTION = re.compile(
    r"\b(?:ignore|disregard|override|forget|ignora|olvida|omite|anula)\b.{0,70}"
    r"\b(?:instructions?|rules?|instrucciones?|reglas?)\b|"
    r"\b(?:show|reveal|print|dump|expose|give me|repite|revela|muestra|dime|imprime|devuelve)\b.{0,80}"
    r"\b(?:system prompt|hidden instructions|developer message|api key|env(?:ironment)? variables?|"
    r"prompt (?:del|de) sistema|instrucciones (?:internas|ocultas)|variables de entorno|clave (?:de |del )?api)\b|"
    r"<\|(?:system|im_start|im_end|assistant)\|>|\[/?INST\]",
    re.IGNORECASE | re.DOTALL,
)
POLICY_REFERENCE = re.compile(
    r"\b(?:the (?:system prompt|developer instructions) (?:requires?|says?|instructs?)|"
    r"(?:el prompt (?:del|de) sistema|las instrucciones (?:del sistema|internas)) "
    r"(?:exig[ea]n?|dicen?|indican?|requieren?))\b",
    re.IGNORECASE,
)
logger = logging.getLogger(__name__)


class ChatText(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    type: Literal["text"]
    text: str = Field(min_length=1, max_length=MAX_MESSAGE_CHARS)


class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    id: str = Field(min_length=1, max_length=128)
    role: Literal["user", "assistant"]
    parts: list[ChatText] = Field(min_length=1, max_length=1)


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    id: str = Field(min_length=1, max_length=128)
    trigger: Literal["submit-message"]
    messageId: str | None = Field(default=None, max_length=128)
    lang: Language = "es"
    messages: list[ChatMessage] = Field(min_length=1, max_length=MAX_HISTORY_MESSAGES)


def validate_request_source(request: Request, hosted: bool) -> None:
    media_type = request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    if media_type != "application/json":
        raise HTTPException(status_code=415, detail="Expected a JSON request")

    if request.headers.get("sec-fetch-site") not in {None, "same-origin", "none"}:
        raise HTTPException(status_code=403, detail="Cross-origin request")

    if origin := request.headers.get("origin"):
        if not hosted and origin == os.environ.get(
            "PORTFOLIO_ASSISTANT_LOCAL_ORIGIN", "http://127.0.0.1:4328"
        ):
            return
        schemes = {"https"} if hosted else {"http", "https"}
        try:
            parsed = urlsplit(origin)
        except ValueError:
            raise HTTPException(status_code=403, detail="Cross-origin request") from None
        if (
            parsed.scheme not in schemes
            or parsed.netloc.lower() != request.url.netloc.lower()
            or parsed.path or parsed.query or parsed.fragment
        ):
            raise HTTPException(status_code=403, detail="Cross-origin request")


def request_client(request: Request, hosted: bool) -> str:
    if hosted:
        forwarded = request.headers.get("x-vercel-forwarded-for", "").split(",", 1)[0].strip()
        try:
            return str(ip_address(forwarded))
        except ValueError:
            pass
    return request.client.host if request.client else "unknown"


class RequestLimiter:
    """Cap requests per client and per function instance in a bounded window."""

    def __init__(self, per_client: int = 15, total: int = 75, window: int = 60):
        self.per_client = per_client
        self.total = total
        self.window = window
        self.deadline = 0.0
        self.clients: dict[str, int] = {}
        self.count = 0
        self.lock = Lock()

    def check(self, client: str) -> None:
        now = time.monotonic()
        with self.lock:
            if now >= self.deadline:
                self.deadline = now + self.window
                self.clients.clear()
                self.count = 0
            used = self.clients.get(client, 0)
            if used >= self.per_client or self.count >= self.total:
                retry = str(max(1, math.ceil(self.deadline - now)))
                raise HTTPException(status_code=429, detail="Too many requests", headers={"Retry-After": retry})
            self.clients[client] = used + 1
            self.count += 1


def restricted_text(text: str, secret: str | None = None, *, screen_instructions: bool = True) -> bool:
    normalized = "".join(
        char for char in unicodedata.normalize("NFKC", text) if unicodedata.category(char) != "Cf"
    )
    return bool(
        (secret and secret.casefold() in normalized.casefold())
        or POLICY_MARKER in normalized.casefold()
        or CREDENTIAL.search(normalized)
        or (screen_instructions and INJECTION.search(normalized))
        or any(email.casefold() != PUBLIC_EMAIL for email in EMAIL.findall(normalized))
    )


async def reply_events(text: str) -> AsyncIterator[BaseChunk]:
    yield StartChunk()
    yield TextStartChunk(id="reply")
    yield TextDeltaChunk(id="reply", delta=text)
    yield TextEndChunk(id="reply")
    yield FinishChunk(finish_reason="stop")
    yield DoneChunk()


async def guarded_events(
    stream: AsyncIterator[BaseChunk], *, secret: str | None, refusal: str
) -> AsyncIterator[BaseChunk]:
    """Publish only complete, screened text and the first allowlisted destination."""
    yield StartChunk()
    blocks: dict[str, list[str]] = {}
    size = 0
    destination = None
    failed = False
    completed = False

    try:
        async for event in stream:
            if isinstance(event, TextDeltaChunk):
                size += len(event.delta.encode("utf-8"))
                if size <= MAX_REPLY_BYTES:
                    blocks.setdefault(event.id, []).append(event.delta)
            elif isinstance(event, DataChunk) and event.type == "data-destination":
                if destination is None and isinstance(event.data, str) and event.data in DESTINATIONS:
                    destination = event.data
            elif isinstance(event, (ErrorChunk, AbortChunk)):
                failed = True
            elif isinstance(event, FinishChunk):
                completed = event.finish_reason not in {"error", "content-filter"}
    except Exception:
        failed = True

    if failed or not completed:
        logger.warning("assistant_provider_failed")
        yield ErrorChunk(error_text="Assistant request failed.")
        yield FinishChunk(finish_reason="error")
    else:
        paragraphs = ["".join(parts) for parts in blocks.values()]
        text = "\n\n".join(paragraphs).strip()
        if (
            size > MAX_REPLY_BYTES
            or restricted_text(text, secret, screen_instructions=False)
            or (len(paragraphs) > 1 and restricted_text("".join(paragraphs), secret, screen_instructions=False))
        ):
            logger.info("assistant_output_blocked")
            text, destination = refusal, None
        else:
            text = "\n\n".join(
                paragraph for paragraph in text.split("\n\n") if not POLICY_REFERENCE.search(paragraph)
            ).strip()
            if not text:
                text, destination = refusal, None
        if text:
            yield TextStartChunk(id="reply")
            yield TextDeltaChunk(id="reply", delta=text)
            yield TextEndChunk(id="reply")
        if destination:
            yield DataChunk(type="data-destination", data=destination)
        yield FinishChunk(finish_reason="stop")
    yield DoneChunk()
