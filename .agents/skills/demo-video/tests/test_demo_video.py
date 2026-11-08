# ABOUTME: Covers manifest validation and deterministic subtitle generation for demo videos.
# ABOUTME: Keeps the skill testable without FFmpeg, OpenAI calls, or browser recordings.

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest


SCRIPTS = Path(__file__).parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

from demo_manifest import ManifestError, load_manifest  # noqa: E402
from render_demo import RenderedSegment, _write_subtitles  # noqa: E402


def _write_manifest(tmp_path: Path, **overrides: object) -> Path:
    source = tmp_path / "recording.webm"
    source.write_bytes(b"webm")
    data: dict[str, object] = {
        "title": "Safe demo",
        "language": "es",
        "source_video": source.name,
        "output_video": "demo.mp4",
        "segments": [
            {
                "id": "review",
                "start": 1,
                "end": 5,
                "narration": "The user reviews the affected tools before confirming.",
            }
        ],
    }
    data.update(overrides)
    manifest = tmp_path / "demo-manifest.json"
    manifest.write_text(json.dumps(data), encoding="utf-8")
    return manifest


def test_load_manifest_resolves_paths_and_defaults(tmp_path: Path) -> None:
    manifest = load_manifest(_write_manifest(tmp_path))

    assert manifest.source_video == (tmp_path / "recording.webm").resolve()
    assert manifest.output_video == (tmp_path / "demo.mp4").resolve()
    assert manifest.tts_model == "gpt-4o-mini-tts"
    assert manifest.audio_path(manifest.segments[0], 0).name == "01-review.wav"
    assert manifest.segments[0].id == "review"


def test_load_manifest_rejects_duplicate_segment_ids(tmp_path: Path) -> None:
    segment = {"id": "review", "start": 6, "end": 8, "narration": "Duplicate."}
    manifest_path = _write_manifest(
        tmp_path,
        segments=[
            {"id": "review", "start": 1, "end": 5, "narration": "First."},
            segment,
        ],
    )

    with pytest.raises(ManifestError, match="duplicate segment id"):
        load_manifest(manifest_path)


@pytest.mark.parametrize("redactions", [
    [{"x": 10, "y": 20, "width": 100, "height": 50}],
    [{"x": 0, "y": 0, "width": 1280, "height": 720}],
])
def test_load_manifest_rejects_redactions(tmp_path: Path, redactions: list[dict[str, int]]) -> None:
    manifest_path = _write_manifest(
        tmp_path,
        segments=[
            {
                "id": "review",
                "start": 1,
                "end": 5,
                "narration": "Review.",
                "redactions": redactions,
            }
        ],
    )

    with pytest.raises(ManifestError, match="redactions are not supported"):
        load_manifest(manifest_path)


def test_load_manifest_rejects_non_finite_timestamps(tmp_path: Path) -> None:
    manifest_path = _write_manifest(
        tmp_path,
        segments=[{"id": "review", "start": float("nan"), "end": 5, "narration": "Review."}],
    )

    with pytest.raises(ManifestError, match="must be finite"):
        load_manifest(manifest_path)


def test_write_subtitles_uses_contiguous_output_timing(tmp_path: Path) -> None:
    subtitles = tmp_path / "demo.srt"
    _write_subtitles(
        subtitles,
        [
            RenderedSegment(tmp_path / "one.mp4", 2.0, "First chapter."),
            RenderedSegment(tmp_path / "two.mp4", 3.0, "Second chapter."),
        ],
    )

    content = subtitles.read_text(encoding="utf-8")
    assert "00:00:00,000 --> 00:00:02,000" in content
    assert "00:00:02,000 --> 00:00:05,000" in content
