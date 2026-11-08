# ABOUTME: Validates cached WAV narration against the exact generation inputs and audio checksum.
# ABOUTME: Publishes completed audio with hash-only receipts so stale tracks cannot reach rendering.

from __future__ import annotations

import hashlib
import json
import os
import tempfile
from pathlib import Path

from demo_manifest import DemoManifest, Segment


def _signature(manifest: DemoManifest, segment: Segment) -> str:
    inputs = {
        "version": 1,
        "api": manifest.tts_api.value,
        "model": manifest.tts_model,
        "voice": manifest.tts_voice,
        "instructions": manifest.tts_instructions,
        "language": manifest.language,
        "text": segment.narration,
    }
    return hashlib.sha256(json.dumps(inputs, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def cache_matches(manifest: DemoManifest, segment: Segment, index: int) -> bool:
    output = manifest.audio_path(segment, index)
    receipt = output.with_suffix(".wav.json")
    if not output.is_file() or not receipt.is_file():
        return False
    try:
        data = json.loads(receipt.read_text())
    except (OSError, ValueError):
        return False
    if not isinstance(data, dict) or data.get("input_sha256") != _signature(manifest, segment):
        return False
    return data.get("audio_sha256") == hashlib.sha256(output.read_bytes()).hexdigest()


def save_audio(manifest: DemoManifest, segment: Segment, index: int, audio: bytes) -> Path:
    output = manifest.audio_path(segment, index)
    receipt = {
        "input_sha256": _signature(manifest, segment),
        "audio_sha256": hashlib.sha256(audio).hexdigest(),
    }
    with tempfile.TemporaryDirectory(prefix=".narration-", dir=manifest.audio_directory) as directory:
        temp_audio = Path(directory) / "audio.wav"
        temp_receipt = Path(directory) / "receipt.json"
        temp_audio.write_bytes(audio)
        temp_receipt.write_text(json.dumps(receipt), encoding="utf-8")
        os.replace(temp_audio, output)
        os.replace(temp_receipt, output.with_suffix(".wav.json"))
    return output
