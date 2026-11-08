#!/usr/bin/env python3
# ABOUTME: Generates configured OpenAI narration tracks and reuses only matching completed audio.
# ABOUTME: Keeps API credentials in the environment and never prints submitted narration text.

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from demo_manifest import DemoManifest, ManifestError, load_manifest
from narration_audio import request_audio
from narration_cache import cache_matches, save_audio


def generate(manifest: DemoManifest, *, force: bool, dry_run: bool) -> None:
    if not manifest.source_video.is_file():
        raise ManifestError(f"source video does not exist: {manifest.source_video}")
    if dry_run:
        for index, segment in enumerate(manifest.segments):
            action = "reuse" if not force and cache_matches(manifest, segment, index) else "generate"
            print(f"would {action} {manifest.audio_path(segment, index)} ({manifest.tts_api.value})")
        return

    api_key = os.environ.get("OPENAI_API_KEY")
    manifest.audio_directory.mkdir(parents=True, exist_ok=True)
    for index, segment in enumerate(manifest.segments):
        output = manifest.audio_path(segment, index)
        if not force and cache_matches(manifest, segment, index):
            print(f"keeping existing narration: {output}")
            continue
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is required to generate narration")
        audio = request_audio(manifest, segment.narration, api_key)
        save_audio(manifest, segment, index, audio)
        print(f"generated narration: {output}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate OpenAI Speech, Realtime or Live narration for a demo manifest")
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--force", action="store_true", help="replace existing narration files")
    parser.add_argument("--dry-run", action="store_true", help="validate and print output paths without API calls")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        generate(load_manifest(args.manifest), force=args.force, dry_run=args.dry_run)
    except (ManifestError, RuntimeError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
