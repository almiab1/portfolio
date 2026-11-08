# ABOUTME: Resolves configurable narration models to supported OpenAI audio protocols.
# ABOUTME: Keeps model and voice identifiers open while rejecting ambiguous protocol selection.

from __future__ import annotations

import re
from enum import Enum


class NarrationAPI(str, Enum):
    SPEECH = "speech"
    REALTIME = "realtime"
    LIVE = "live"


_MODEL_APIS = {
    "tts-1": NarrationAPI.SPEECH,
    "tts-1-hd": NarrationAPI.SPEECH,
    "gpt-4o-mini-tts": NarrationAPI.SPEECH,
    "gpt-realtime": NarrationAPI.REALTIME,
    "gpt-realtime-mini": NarrationAPI.REALTIME,
    "gpt-realtime-2": NarrationAPI.REALTIME,
    "gpt-realtime-2.1": NarrationAPI.REALTIME,
    "gpt-realtime-2.1-mini": NarrationAPI.REALTIME,
    "gpt-live-1": NarrationAPI.LIVE,
}


def resolve_api(model: str, override: str | None = None) -> NarrationAPI:
    # Dated snapshots use their documented family's protocol, not an arbitrary name prefix.
    family = re.sub(r"-\d{4}-\d{2}-\d{2}$", "", model)
    known = _MODEL_APIS.get(family)
    if override is None:
        if known is None:
            raise ValueError("Unknown narration model protocol; supply tts.api after verifying API compatibility")
        return known
    try:
        selected = NarrationAPI(override)
    except ValueError as error:
        raise ValueError("tts.api must be speech, realtime or live") from error
    if known is not None and selected != known:
        raise ValueError("tts.api conflicts with the model's supported protocol")
    return selected
