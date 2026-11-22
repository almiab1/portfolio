# ABOUTME: Streams the portfolio assistant in the Vercel AI SDK wire format.
# ABOUTME: Restricts context to public facts and actions to known portfolio destinations.
import json
import logging
import os
from contextlib import asynccontextmanager
from dataclasses import replace
from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import ValidationError
from pydantic_ai.messages import ModelResponse, TextPart
from pydantic_ai.models.function import FunctionModel

from server.assistant_budget import reserve_inference_budget
from server.assistant_challenge import CHALLENGE_HEADER, verify_challenge
from server.assistant_harness import run_turn
from server.assistant_inference import InferenceBudgetDenied, open_model, provider_secrets
from server.assistant_security import (
    ChatRequest, MAX_REQUEST_BYTES, RequestLimiter, guarded_events, reply_events,
    request_client, restricted_text, validate_request_source,
)
from server.portfolio_guide import prepare_turn

PUBLIC_ASSISTANT_HOST = "www.alejandromira.com"
REPLIES_PATH = Path(__file__).resolve().parents[1] / "src/i18n/assistant-replies.json"
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
limiter = RequestLimiter()
logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def fixture_replies():
    return json.loads(REPLIES_PATH.read_text(encoding="utf-8"))


@asynccontextmanager
async def fixture_provider(lang, turn):
    keys = {
        "glio": "Glio", "skills": "Skills", "experience": "Career", "cv": "Cv",
        "contact": "Contact", "profile": "Profile", "work": "Projects",
    }
    sources = {item.source.partition("/")[0] for skill in turn.skills for item in skill.evidence}
    key = "Education" if sources == {"education"} else keys.get(turn.destination, "Fallback")
    text = fixture_replies()[lang]["desktop.reply" + key]
    yield FunctionModel(lambda messages, info: ModelResponse(parts=[TextPart(text)]))


async def public_reply(text, destination, secrets, refusal):
    if any(key.casefold() in text.casefold() for key in secrets):
        text, destination = refusal, None
    events = guarded_events(reply_events(text, destination), secret=None, refusal=refusal)
    body = "".join([f"data: {event.encode(7)}\n\n" async for event in events])
    return Response(body, media_type="text/event-stream", headers={
        "x-vercel-ai-ui-message-stream": "v1", "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
    })


@app.post("/api/chat")
async def chat(request: Request):
    mode = os.environ.get("PORTFOLIO_ASSISTANT_MODE")
    environment = os.environ.get("VERCEL_ENV")
    hosted = os.environ.get("VERCEL") == "1" or environment is not None
    live = mode == "live"
    public_live = (
        environment == "production"
        and live
        and os.environ.get("PORTFOLIO_ASSISTANT_PUBLIC_LIVE") == "1"
    )
    if (hosted and environment != "preview" and not public_live) or mode not in {"fixture", "live"}:
        raise HTTPException(status_code=404)

    expected_host = None
    if live and hosted:
        expected_host = PUBLIC_ASSISTANT_HOST if public_live else os.environ.get("VERCEL_URL", "").lower()
        if not expected_host:
            raise HTTPException(status_code=403, detail="Cross-origin request")

    validate_request_source(request, hosted, expected_host)
    if live:
        limiter.check(request_client(request, hosted))
    body = bytearray()
    async for chunk in request.stream():
        if len(body) + len(chunk) > MAX_REQUEST_BYTES:
            raise HTTPException(status_code=413, detail="Chat request is too large")
        body.extend(chunk)

    try:
        payload = ChatRequest.model_validate_json(bytes(body))
    except ValidationError:
        raise HTTPException(status_code=400, detail="Invalid chat request") from None

    last = payload.messages[-1]
    question = last.parts[0].text.strip()
    if last.role != "user" or not question:
        raise HTTPException(status_code=400, detail="A question is required")

    if expected_host:
        await verify_challenge(request.headers.get(CHALLENGE_HEADER), expected_host)

    lang = payload.lang
    refusal = fixture_replies()[lang]["desktop.replyRestricted"]
    secrets = provider_secrets() if live else ()

    def restricted(text):
        return restricted_text(text) or any(key.casefold() in text.casefold() for key in secrets)

    if restricted(question):
        return await public_reply(refusal, None, secrets, refusal)
    history = [
        {"role": message.role, "text": message.parts[0].text}
        for message in payload.messages[:-1] if not restricted(message.parts[0].text)
    ]
    turn = prepare_turn(question, lang, history, preset=payload.preset)
    # The deployed assistant uses one-shot synthesis. Code Mode is for offline evaluation.
    if turn.compound:
        turn = replace(turn, compound=False, tools=())

    async def reserve():
        if expected_host:
            await reserve_inference_budget(request_client(request, hosted))

    try:
        if turn.direct_reply is not None:
            result = await run_turn(turn)
        else:
            provider = open_model(reserve) if live else fixture_provider(lang, turn)
            async with provider as model:
                result = await run_turn(turn, model)
    except InferenceBudgetDenied:
        raise HTTPException(status_code=429, detail="Assistant request limit reached") from None
    except HTTPException as error:
        logger.info("assistant_inference_denied status=%d", error.status_code)
        raise
    except Exception:
        logger.warning("assistant_run_failed")
        raise HTTPException(status_code=503, detail="Assistant temporarily unavailable") from None
    logger.info("assistant_turn revision=%s mode=%s status=%s skills=%s requests=%d",
                os.environ.get("VERCEL_GIT_COMMIT_SHA", "local"),
                result.trace.mode, result.trace.status, ",".join(result.trace.skills),
                result.trace.model_requests)
    if result.text is None:
        raise HTTPException(status_code=503, detail="Assistant temporarily unavailable")
    return await public_reply(result.text, turn.destination, secrets, refusal)
