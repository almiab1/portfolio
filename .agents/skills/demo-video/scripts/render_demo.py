#!/usr/bin/env python3
# ABOUTME: Composes selected browser-test clips, TTS tracks and subtitles into MP4 with the full viewport visible.
# ABOUTME: Uses FFmpeg as a deterministic local renderer while preserving the source recording.

from __future__ import annotations

import argparse
import json
import math
import shutil
import subprocess
import sys
import tempfile
import textwrap
from dataclasses import dataclass
from pathlib import Path

from demo_manifest import DemoManifest, ManifestError, Segment, load_manifest
from narration_cache import cache_matches


@dataclass(frozen=True)
class RenderedSegment:
    path: Path
    duration: float
    narration: str


def _require_command(name: str) -> str:
    executable = shutil.which(name)
    if executable is None:
        raise RuntimeError(f"{name} is required but is not installed or available on PATH")
    return executable


def _run(command: list[str]) -> None:
    completed = subprocess.run(command, check=False, capture_output=True, text=True)
    if completed.returncode != 0:
        detail = completed.stderr.strip().splitlines()
        summary = detail[-1] if detail else "unknown FFmpeg error"
        raise RuntimeError(f"media command failed: {summary}")


def _probe_duration(ffprobe: str, path: Path) -> float:
    completed = subprocess.run(
        [
            ffprobe,
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(path),
        ],
        check=False,
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0:
        raise RuntimeError(f"could not inspect media duration: {path}")
    try:
        duration = float(json.loads(completed.stdout)["format"]["duration"])
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        raise RuntimeError(f"invalid media duration returned for: {path}") from error
    if not math.isfinite(duration) or duration <= 0:
        raise RuntimeError(f"media duration must be positive: {path}")
    return duration


def _video_filter(manifest: DemoManifest, extra_duration: float) -> str:
    filters = [
        "setpts=PTS-STARTPTS",
        (
            f"scale={manifest.width}:{manifest.height}:force_original_aspect_ratio=decrease,"
            f"pad={manifest.width}:{manifest.height}:(ow-iw)/2:(oh-ih)/2,setsar=1"
        ),
    ]
    if extra_duration > 0:
        filters.append(f"tpad=stop_mode=clone:stop_duration={extra_duration:.3f}")
    return ",".join(filters)


def _render_segment(
    *,
    ffmpeg: str,
    ffprobe: str,
    manifest: DemoManifest,
    segment: Segment,
    index: int,
    output: Path,
) -> RenderedSegment:
    audio_path = manifest.audio_path(segment, index)
    audio_duration = _probe_duration(ffprobe, audio_path)
    clip_duration = segment.end - segment.start
    output_duration = max(clip_duration, audio_duration + manifest.tail_padding_seconds)
    extra_duration = max(0.0, output_duration - clip_duration)
    _run(
        [
            ffmpeg,
            "-hide_banner",
            "-loglevel",
            "error",
            "-ss",
            f"{segment.start:.3f}",
            "-t",
            f"{clip_duration:.3f}",
            "-i",
            str(manifest.source_video),
            "-i",
            str(audio_path),
            "-filter:v",
            _video_filter(manifest, extra_duration),
            "-filter:a",
            f"apad=whole_dur={output_duration:.3f}",
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-t",
            f"{output_duration:.3f}",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-movflags",
            "+faststart",
            "-y",
            str(output),
        ]
    )
    return RenderedSegment(output, output_duration, segment.narration)


def _srt_timestamp(seconds: float) -> str:
    milliseconds = round(seconds * 1000)
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    whole_seconds, milliseconds = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{whole_seconds:02d},{milliseconds:03d}"


def _caption_chunks(narration: str) -> list[str]:
    lines = textwrap.wrap(narration, width=64, break_long_words=False, break_on_hyphens=False)
    return ["\n".join(lines[index : index + 2]) for index in range(0, len(lines), 2)] or [narration]


def _write_subtitles(path: Path, segments: list[RenderedSegment]) -> None:
    cues: list[str] = []
    cue_number = 1
    offset = 0.0
    for segment in segments:
        chunks = _caption_chunks(segment.narration)
        weights = [max(1, len(chunk.replace("\n", " "))) for chunk in chunks]
        total_weight = sum(weights)
        cursor = offset
        for chunk, weight in zip(chunks, weights, strict=True):
            duration = segment.duration * weight / total_weight
            cues.append(
                f"{cue_number}\n{_srt_timestamp(cursor)} --> {_srt_timestamp(cursor + duration)}\n{chunk}\n"
            )
            cue_number += 1
            cursor += duration
        offset += segment.duration
    path.write_text("\n".join(cues), encoding="utf-8")


def _concat_file_line(path: Path) -> str:
    return "file '" + str(path).replace("'", "'\\''") + "'\n"


def _validate_inputs(manifest: DemoManifest, *, require_audio: bool) -> None:
    if not manifest.source_video.is_file():
        raise ManifestError(f"source video does not exist: {manifest.source_video}")
    if require_audio:
        missing = [
            manifest.audio_path(segment, index)
            for index, segment in enumerate(manifest.segments)
            if not manifest.audio_path(segment, index).is_file()
        ]
        if missing:
            raise ManifestError(f"narration audio is missing: {missing[0]}")
        for index, segment in enumerate(manifest.segments):
            if not cache_matches(manifest, segment, index):
                raise ManifestError("narration audio is stale or unverified; run generate_narration.py first")


def render(manifest: DemoManifest, *, force: bool, validate_only: bool) -> None:
    _validate_inputs(manifest, require_audio=not validate_only)
    if validate_only:
        print(f"valid demo manifest: {manifest.path}")
        return
    ffmpeg = _require_command("ffmpeg")
    ffprobe = _require_command("ffprobe")
    if manifest.output_video.exists() and not force:
        raise RuntimeError(f"output already exists; pass --force to replace it: {manifest.output_video}")

    manifest.output_video.parent.mkdir(parents=True, exist_ok=True)
    subtitle_path = manifest.output_video.with_suffix(".srt")
    with tempfile.TemporaryDirectory(prefix="portfolio-demo-video-") as temporary_directory:
        temporary = Path(temporary_directory)
        rendered = [
            _render_segment(
                ffmpeg=ffmpeg,
                ffprobe=ffprobe,
                manifest=manifest,
                segment=segment,
                index=index,
                output=temporary / f"segment-{index + 1:02d}.mp4",
            )
            for index, segment in enumerate(manifest.segments)
        ]
        concat_path = temporary / "segments.txt"
        concat_path.write_text("".join(_concat_file_line(item.path) for item in rendered), encoding="utf-8")
        joined_path = temporary / "joined.mp4"
        _run(
            [
                ffmpeg,
                "-hide_banner",
                "-loglevel",
                "error",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(concat_path),
                "-c",
                "copy",
                "-y",
                str(joined_path),
            ]
        )
        _write_subtitles(subtitle_path, rendered)
        _run(
            [
                ffmpeg,
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                str(joined_path),
                "-i",
                str(subtitle_path),
                "-map",
                "0:v:0",
                "-map",
                "0:a:0",
                "-map",
                "1:0",
                "-c:v",
                "copy",
                "-c:a",
                "copy",
                "-c:s",
                "mov_text",
                "-metadata:s:s:0",
                f"language={manifest.language.split('-', 1)[0]}",
                "-metadata:s:s:0",
                f"title={manifest.title}",
                "-movflags",
                "+faststart",
                "-y",
                str(manifest.output_video),
            ]
        )
    print(f"rendered demo: {manifest.output_video}")
    print(f"wrote subtitles: {subtitle_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render a narrated browser-test demo with FFmpeg")
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--force", action="store_true", help="replace an existing MP4")
    parser.add_argument("--validate-only", action="store_true", help="validate the manifest without FFmpeg")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        render(load_manifest(args.manifest), force=args.force, validate_only=args.validate_only)
    except (ManifestError, RuntimeError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
