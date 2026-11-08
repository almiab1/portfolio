#!/usr/bin/env python3
# ABOUTME: Loads and validates deterministic manifests for narrated browser-test demos.
# ABOUTME: Resolves artifact paths without depending on third-party Python packages.

from __future__ import annotations

import json
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from narration_config import NarrationAPI, resolve_api


_SEGMENT_ID = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class ManifestError(ValueError):
    pass


@dataclass(frozen=True)
class Segment:
    id: str
    start: float
    end: float
    narration: str


@dataclass(frozen=True)
class DemoManifest:
    path: Path
    title: str
    language: str
    source_video: Path
    output_video: Path
    audio_directory: Path
    tts_model: str
    tts_voice: str
    tts_instructions: str | None
    tts_api: NarrationAPI
    tts_timeout_seconds: float
    width: int
    height: int
    tail_padding_seconds: float
    segments: tuple[Segment, ...]

    def audio_path(self, segment: Segment, index: int) -> Path:
        return self.audio_directory / f"{index + 1:02d}-{segment.id}.wav"


def _mapping(value: Any, field: str) -> dict[str, Any]:
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise ManifestError(f"{field} must be an object")
    return value


def _string(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ManifestError(f"{field} must be a non-empty string")
    return value.strip()


def _number(value: Any, field: str) -> float:
    if isinstance(value, bool) or not isinstance(value, int | float):
        raise ManifestError(f"{field} must be a number")
    number = float(value)
    if not math.isfinite(number):
        raise ManifestError(f"{field} must be finite")
    return number


def _positive_integer(value: Any, field: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise ManifestError(f"{field} must be a positive integer")
    return value


def _path(base: Path, value: Any, field: str) -> Path:
    candidate = Path(_string(value, field)).expanduser()
    return candidate if candidate.is_absolute() else (base / candidate).resolve()


def load_manifest(path: str | Path) -> DemoManifest:
    manifest_path = Path(path).expanduser().resolve()
    try:
        raw = json.loads(manifest_path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise ManifestError(f"manifest does not exist: {manifest_path}") from error
    except json.JSONDecodeError as error:
        raise ManifestError(f"manifest is not valid JSON: {error.msg}") from error
    if not isinstance(raw, dict):
        raise ManifestError("manifest root must be an object")

    base = manifest_path.parent
    title = _string(raw.get("title"), "title")
    language = _string(raw.get("language", "en"), "language")
    source_video = _path(base, raw.get("source_video"), "source_video")
    output_video = _path(base, raw.get("output_video", "demo.mp4"), "output_video")
    if source_video == output_video:
        raise ManifestError("output_video must differ from source_video")
    if output_video.suffix.lower() != ".mp4":
        raise ManifestError("output_video must use the .mp4 extension")

    tts = _mapping(raw.get("tts"), "tts")
    tts_model = _string(tts.get("model", "gpt-4o-mini-tts"), "tts.model")
    tts_voice = _string(tts.get("voice", "marin"), "tts.voice")
    instructions_value = tts.get("instructions")
    tts_instructions = None if instructions_value is None else _string(instructions_value, "tts.instructions")
    override = tts.get("api")
    try:
        tts_api = resolve_api(tts_model, None if override is None else _string(override, "tts.api"))
    except ValueError as error:
        raise ManifestError(str(error)) from error
    if re.fullmatch(r"tts-1(?:-hd)?(?:-\d{4}-\d{2}-\d{2})?", tts_model):
        if tts_instructions:
            raise ManifestError("The selected legacy speech model does not support tts.instructions")
        if tts_voice in {"marin", "cedar", "ballad", "verse"}:
            raise ManifestError("The selected legacy speech model does not support this voice")
    tts_timeout_seconds = _number(tts.get("timeout_seconds", 120), "tts.timeout_seconds")
    if tts_timeout_seconds <= 0:
        raise ManifestError("tts.timeout_seconds must be positive")

    video = _mapping(raw.get("video"), "video")
    width = _positive_integer(video.get("width", 1280), "video.width")
    height = _positive_integer(video.get("height", 720), "video.height")
    tail_padding_seconds = _number(video.get("tail_padding_seconds", 0.5), "video.tail_padding_seconds")
    if tail_padding_seconds < 0:
        raise ManifestError("video.tail_padding_seconds cannot be negative")

    raw_segments = raw.get("segments")
    if not isinstance(raw_segments, list) or not raw_segments:
        raise ManifestError("segments must be a non-empty array")
    segments: list[Segment] = []
    ids: set[str] = set()
    for index, raw_segment in enumerate(raw_segments):
        field = f"segments[{index}]"
        segment_data = _mapping(raw_segment, field)
        segment_id = _string(segment_data.get("id"), f"{field}.id")
        if not _SEGMENT_ID.fullmatch(segment_id):
            raise ManifestError(f"{field}.id must contain lowercase letters, numbers, and single hyphens")
        if segment_id in ids:
            raise ManifestError(f"duplicate segment id: {segment_id}")
        ids.add(segment_id)
        start = _number(segment_data.get("start"), f"{field}.start")
        end = _number(segment_data.get("end"), f"{field}.end")
        if start < 0 or end <= start:
            raise ManifestError(f"{field} must satisfy 0 <= start < end")
        narration = _string(segment_data.get("narration"), f"{field}.narration")
        if len(narration) > 4096:
            raise ManifestError(f"{field}.narration exceeds 4096 characters")

        if segment_data.get("redactions", []) != []:
            raise ManifestError(f"{field}.redactions are not supported; keep the complete product interface visible")
        segments.append(Segment(segment_id, start, end, narration))

    audio_directory_value = raw.get("audio_directory", ".demo-audio")
    audio_directory = _path(base, audio_directory_value, "audio_directory")
    return DemoManifest(
        path=manifest_path,
        title=title,
        language=language,
        source_video=source_video,
        output_video=output_video,
        audio_directory=audio_directory,
        tts_model=tts_model,
        tts_voice=tts_voice,
        tts_instructions=tts_instructions,
        tts_api=tts_api,
        tts_timeout_seconds=tts_timeout_seconds,
        width=width,
        height=height,
        tail_padding_seconds=tail_padding_seconds,
        segments=tuple(segments),
    )
