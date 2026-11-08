# ABOUTME: Exercises narration protocol selection, complete audio generation and cache invalidation.
# ABOUTME: Uses local fake HTTP/WebSocket responses without paid API calls or real recordings.

from __future__ import annotations

import base64
import io
import itertools
import json
import shutil
import struct
import subprocess
import sys
import wave
from collections import deque
from dataclasses import replace
from pathlib import Path
from unittest.mock import Mock

import pytest


sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))

import generate_narration  # noqa: E402
import narration_audio  # noqa: E402
from demo_manifest import ManifestError, load_manifest  # noqa: E402
from narration_cache import cache_matches, save_audio  # noqa: E402
from narration_config import NarrationAPI  # noqa: E402
from render_demo import _validate_inputs, render  # noqa: E402


@pytest.fixture
def manifest_path(tmp_path):
    (tmp_path / "recording.webm").write_bytes(b"recording")
    path = tmp_path / "manifest.json"
    path.write_text(json.dumps({
        "title": "Demo", "source_video": "recording.webm", "language": "es",
        "segments": [{"id": "step", "start": 0, "end": 5, "narration": "Hola mundo."}],
    }))
    return path


def configure(path, **tts):
    data = json.loads(path.read_text())
    data["tts"] = tts
    path.write_text(json.dumps(data))
    return load_manifest(path)


class Socket:
    def __init__(self, events):
        self.events = deque(events)
        self.sent = []
        self.closed = False

    def send(self, message):
        self.sent.append(json.loads(message))

    def recv(self, timeout):
        event = self.events.popleft()
        if isinstance(event, Exception):
            raise event
        return json.dumps(event)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.closed = True


@pytest.mark.parametrize("model,api", [
    ("gpt-4o-mini-tts", NarrationAPI.SPEECH),
    ("gpt-4o-mini-tts-2025-12-15", NarrationAPI.SPEECH),
    ("tts-1-hd", NarrationAPI.SPEECH),
    ("gpt-realtime-2.1-mini", NarrationAPI.REALTIME),
    ("gpt-live-1", NarrationAPI.LIVE),
])
def test_known_model_resolves_api(manifest_path, model, api):
    manifest = configure(manifest_path, model=model, voice="alloy")
    assert manifest.tts_api == api
    assert manifest.tts_model == model


def test_future_model_and_voice_require_explicit_compatible_api(manifest_path):
    with pytest.raises(ManifestError, match="Unknown narration model"):
        configure(manifest_path, model="future-model", voice="future-voice")
    manifest = configure(manifest_path, model="future-model", voice="future-voice", api="speech")
    assert manifest.tts_model == "future-model"
    assert manifest.tts_voice == "future-voice"


@pytest.mark.parametrize("tts", [
    {"model": "gpt-live-1", "api": "speech"},
    {"api": "invalid"},
    {"model": "tts-1", "voice": "marin"},
    {"model": "tts-1-hd", "voice": "alloy", "instructions": "Slow"},
    {"timeout_seconds": 0},
])
def test_incompatible_options_fail_without_network(manifest_path, tts):
    with pytest.raises(ManifestError):
        configure(manifest_path, **tts)


def test_speech_forwards_selected_options_and_returns_wav(manifest_path, monkeypatch):
    manifest = configure(manifest_path, voice="cedar", instructions="Natural")
    expected = narration_audio._wav(struct.pack("<hh", 1000, -1000))
    received = []

    def urlopen(request, timeout):
        received.append((json.loads(request.data), timeout))
        return io.BytesIO(expected)

    monkeypatch.setattr(narration_audio.urllib.request, "urlopen", urlopen)
    assert narration_audio.request_audio(manifest, "Hola mundo.", "test-key") == expected
    payload, timeout = received[0]
    assert payload["model"] == manifest.tts_model
    assert payload["voice"] == "cedar"
    assert payload["instructions"] == "Natural"
    assert payload["input"] == "Hola mundo."
    assert timeout == manifest.tts_timeout_seconds


def realtime_events(status="completed", transcript="Hola mundo."):
    return [
        {"type": "session.created"},
        {"type": "session.updated"},
        {"type": "response.output_audio.delta", "delta": base64.b64encode(b"\x10\x00" * 100).decode()},
        {"type": "response.output_audio_transcript.delta", "delta": transcript},
        {"type": "response.done", "response": {"status": status}},
    ]


def test_realtime_collects_pcm_verifies_script_and_closes(manifest_path, monkeypatch):
    manifest = configure(manifest_path, model="gpt-realtime-2.1-mini", voice="cedar")
    socket = Socket(realtime_events())
    connect = Mock(return_value=socket)
    monkeypatch.setattr(narration_audio, "_connect", connect)
    output = narration_audio.request_audio(manifest, "Hola mundo.", "test-key")
    with wave.open(io.BytesIO(output)) as audio:
        assert audio.getframerate() == 24000
        assert audio.readframes(100) == b"\x10\x00" * 100
    assert socket.closed
    assert connect.call_args.args[0].endswith("?model=gpt-realtime-2.1-mini")
    assert socket.sent[0]["session"]["audio"]["output"]["voice"] == "cedar"
    assert socket.sent[1]["response"]["input"][0]["content"][0]["text"] == "Hola mundo."


@pytest.mark.parametrize("status,transcript", [("failed", "Hola mundo."), ("completed", "Hola."), ("completed", "Hola mundo. Gracias.")])
def test_realtime_rejects_partial_or_rewritten_narration(manifest_path, monkeypatch, status, transcript):
    manifest = configure(manifest_path, model="gpt-realtime-2.1-mini")
    socket = Socket(realtime_events(status, transcript))
    monkeypatch.setattr(narration_audio, "_connect", Mock(return_value=socket))
    with pytest.raises(RuntimeError):
        narration_audio.request_audio(manifest, "Hola mundo.", "test-key")
    assert socket.closed


def live_events():
    return [
        {"type": "session.started"},
        {"type": "session.output_audio.delta", "delta": base64.b64encode(b"\x00\x10" * 100).decode()},
        {"type": "session.output_transcript.delta", "delta": "Hola mundo."},
        {"type": "session.output_audio.delta", "delta": base64.b64encode(bytes(48000)).decode()},
        {"type": "session.closed"},
    ]


def test_live_requires_full_transcript_silence_and_finalization(manifest_path, monkeypatch):
    manifest = configure(manifest_path, model="gpt-live-1", voice="quartz")
    socket = Socket(live_events())
    monkeypatch.setattr(narration_audio, "_connect", Mock(return_value=socket))
    output = narration_audio.request_audio(manifest, "Hola mundo.", "test-key")
    with wave.open(io.BytesIO(output)) as audio:
        assert audio.getnframes() == 24100
    start = socket.sent[0]["session"]
    assert start["model"] == "gpt-live-1"
    assert start["audio"]["output"]["voice"] == "quartz"
    assert start["input"][0]["content"][0]["text"] == "Hola mundo."
    assert any(event["type"] == "session.input_audio.append" for event in socket.sent)
    assert socket.sent[-1] == {"type": "session.close"}
    assert socket.closed


def test_live_late_extra_speech_is_not_accepted(manifest_path, monkeypatch):
    events = live_events()
    events.insert(-1, {"type": "session.output_transcript.delta", "delta": " Gracias."})
    monkeypatch.setattr(narration_audio, "_connect", Mock(return_value=Socket(events)))
    with pytest.raises(RuntimeError, match="differs"):
        narration_audio.request_audio(configure(manifest_path, model="gpt-live-1"), "Hola mundo.", "test-key")


@pytest.mark.parametrize("events", [
    [{"type": "session.started"}, {"type": "session.closed"}],
    [{"type": "error", "error": {"message": "secret-and-script-must-not-leak"}}],
    [TimeoutError("secret-and-script-must-not-leak")],
])
def test_session_failures_never_return_partial_audio_or_echo_errors(manifest_path, monkeypatch, events):
    monkeypatch.setattr(narration_audio, "_connect", Mock(return_value=Socket(events)))
    with pytest.raises(RuntimeError) as error:
        narration_audio.request_audio(configure(manifest_path, model="gpt-live-1"), "Hola mundo.", "test-key")
    assert "secret-and-script-must-not-leak" not in str(error.value)


@pytest.mark.parametrize("field,value", [
    ("tts_model", "gpt-live-1"), ("tts_voice", "cedar"), ("tts_instructions", "Slow"),
    ("language", "en"), ("tts_api", NarrationAPI.REALTIME),
])
def test_cache_invalidates_changed_generation_inputs(manifest_path, field, value):
    manifest = load_manifest(manifest_path)
    manifest.audio_directory.mkdir()
    segment = manifest.segments[0]
    save_audio(manifest, segment, 0, narration_audio._wav(b"\x10\x00" * 10))
    assert cache_matches(manifest, segment, 0)
    assert not cache_matches(replace(manifest, **{field: value}), segment, 0)
    assert not cache_matches(manifest, replace(segment, narration="Otro texto."), 0)


def test_generation_reuses_only_matching_audio_and_renderer_rejects_stale(manifest_path, monkeypatch):
    manifest = load_manifest(manifest_path)
    audio = narration_audio._wav(b"\x10\x00" * 10)
    request = Mock(return_value=audio)
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(generate_narration, "request_audio", request)
    generate_narration.generate(manifest, force=False, dry_run=False)
    generate_narration.generate(manifest, force=False, dry_run=False)
    assert request.call_count == 1
    _validate_inputs(manifest, require_audio=True)
    changed = replace(manifest, tts_voice="cedar")
    with pytest.raises(ManifestError, match="stale"):
        _validate_inputs(changed, require_audio=True)
    generate_narration.generate(changed, force=False, dry_run=False)
    assert request.call_count == 2
    generate_narration.generate(changed, force=True, dry_run=False)
    assert request.call_count == 3
    manifest.audio_path(manifest.segments[0], 0).write_bytes(b"tampered")
    assert not cache_matches(changed, changed.segments[0], 0)


def test_dry_run_requires_no_key_and_does_not_write_or_call_api(manifest_path, monkeypatch):
    manifest = configure(manifest_path, model="gpt-live-1")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    request = Mock(side_effect=AssertionError("network must not be called"))
    monkeypatch.setattr(generate_narration, "request_audio", request)
    generate_narration.generate(manifest, force=False, dry_run=True)
    assert not manifest.audio_directory.exists()
    assert not request.called


def test_failed_generation_does_not_publish_new_cache(manifest_path, monkeypatch):
    manifest = load_manifest(manifest_path)
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(generate_narration, "request_audio", Mock(side_effect=RuntimeError("incomplete")))
    with pytest.raises(RuntimeError):
        generate_narration.generate(manifest, force=False, dry_run=False)
    assert list(manifest.audio_directory.iterdir()) == []


@pytest.mark.parametrize("model", ["gpt-realtime-2.1-mini", "gpt-live-1"])
def test_deadline_expiry_never_returns_success(manifest_path, monkeypatch, model):
    ticks = itertools.chain([0], itertools.repeat(2))
    monkeypatch.setattr(narration_audio.time, "monotonic", lambda: next(ticks))
    socket = Socket([])
    monkeypatch.setattr(narration_audio, "_connect", Mock(return_value=socket))
    with pytest.raises(RuntimeError, match="deadline"):
        narration_audio.request_audio(configure(manifest_path, model=model, timeout_seconds=1), "Hola mundo.", "test-key")
    assert socket.closed


def test_changed_generation_failure_cannot_render_previous_audio(manifest_path, monkeypatch):
    manifest = load_manifest(manifest_path)
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(generate_narration, "request_audio", Mock(return_value=narration_audio._wav(b"\x10\x00" * 10)))
    generate_narration.generate(manifest, force=False, dry_run=False)
    changed = replace(manifest, tts_voice="cedar")
    monkeypatch.setattr(generate_narration, "request_audio", Mock(side_effect=RuntimeError("incomplete")))
    with pytest.raises(RuntimeError):
        generate_narration.generate(changed, force=False, dry_run=False)
    assert cache_matches(manifest, manifest.segments[0], 0)
    with pytest.raises(ManifestError, match="stale"):
        _validate_inputs(changed, require_audio=True)


@pytest.mark.parametrize("expected,actual", [("Saldo -1", "Saldo 1"), ("Precio 3.14", "Precio 314"), ("Hay 6 créditos", "Hay 7 créditos")])
def test_transcript_validation_preserves_numbers(expected, actual):
    with pytest.raises(RuntimeError, match="differs"):
        narration_audio._validate_transcript(expected, actual)


@pytest.mark.skipif(not shutil.which("ffmpeg") or not shutil.which("ffprobe"), reason="FFmpeg/FFprobe not installed")
def test_generated_wav_renders_mp4_with_subtitles_locally(manifest_path, monkeypatch):
    data = json.loads(manifest_path.read_text())
    data["video"] = {"width": 160, "height": 90}
    data["segments"][0]["end"] = 1
    manifest_path.write_text(json.dumps(data))
    manifest = load_manifest(manifest_path)
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=blue:s=160x90:d=1",
        "-c:v", "libvpx", str(manifest.source_video),
    ], check=True, capture_output=True)
    original = manifest.source_video.read_bytes()
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(generate_narration, "request_audio", Mock(return_value=narration_audio._wav(b"\x10\x00" * 2400)))
    generate_narration.generate(manifest, force=False, dry_run=False)
    render(manifest, force=False, validate_only=False)
    probe = subprocess.run([
        "ffprobe", "-v", "error", "-show_streams", "-of", "json", str(manifest.output_video),
    ], check=True, capture_output=True, text=True)
    streams = json.loads(probe.stdout)["streams"]
    assert {stream["codec_type"] for stream in streams} == {"video", "audio", "subtitle"}
    assert manifest.source_video.read_bytes() == original
    assert manifest.segments[0].narration in manifest.output_video.with_suffix(".srt").read_text()
    decoded = subprocess.run([
        "ffmpeg", "-v", "error", "-i", str(manifest.output_video),
        "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1",
    ], check=True, capture_output=True).stdout
    assert len(decoded) == 160 * 90 * 3
    assert all(
        decoded[index] < 16 and decoded[index + 1] < 16 and decoded[index + 2] > 240
        for index in range(0, len(decoded), 3)
    )
