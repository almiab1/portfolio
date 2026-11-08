# Demo manifest

The manifest is JSON. Manifest validation, Speech narration and FFmpeg rendering use Python's standard library; Realtime/Live additionally require `websockets>=15,<16`, declared in [the optional streaming requirements](../scripts/requirements.txt). Relative paths resolve from the manifest directory.

```json
{
  "title": "Reusable access demo",
  "language": "es",
  "source_video": "successful-run.webm",
  "output_video": "demo.mp4",
  "tts": {
    "model": "gpt-4o-mini-tts",
    "voice": "marin",
    "instructions": "Speak clearly and naturally, like a concise product walkthrough."
  },
  "video": {
    "width": 1280,
    "height": 720,
    "tail_padding_seconds": 0.5
  },
  "segments": [
    {
      "id": "review",
      "start": 3.5,
      "end": 14.0,
      "narration": "The user reviews the tools affected before confirming the change."
    }
  ]
}
```

## Fields

- `title`: human-readable demo title used as subtitle metadata.
- `language`: BCP-47-style language identifier. The renderer maps its primary component to MP4 subtitle metadata.
- `source_video`: one Playwright WebM or another FFmpeg-readable recording.
- `output_video`: output MP4. It must not be the source file.
- `tts.model`: externally selected OpenAI narration model string. Defaults to `gpt-4o-mini-tts`; no automatic migration or fallback.
- `tts.voice`: externally selected voice string. Defaults to `marin`. Voice support depends on the chosen model/API, not a universal voice enum.
- `tts.instructions`: optional delivery guidance. Keep it about tone; product claims belong in segment narration.
- `tts.api`: optional `speech`, `realtime` or `live` override. Usually omitted: known model families and their dated snapshots resolve internally. A known incompatible override or an unknown model without an override fails validation. For a future model, specify an override only after verifying compatibility with that protocol; this does not add another provider or API contract.
- `tts.timeout_seconds`: positive finite per-segment generation budget, including streamed-session setup and completion. Defaults to `120`; increase explicitly for longer scripts. Expiry never certifies partial audio.
- `video.width` / `height`: common output canvas. Defaults to `1280x720`.
- `video.tail_padding_seconds`: silence and held final frame after each narration. Defaults to `0.5`.
- `segments`: ordered output chapters. Source intervals may be non-contiguous.
- `segments[].id`: unique lowercase identifier used for deterministic audio filenames.
- `segments[].start` / `end`: source timestamps in seconds with `end > start`.
- `segments[].narration`: sanitized observed explanation, at most 4096 characters.

The manifest follows the skill's [presentation rule](../SKILL.md#presentation-rule): retained footage shows the complete product viewport and journey data. Omit `segments[].redactions`. Legacy empty arrays are accepted, but non-empty redactions are rejected rather than rendered or silently ignored. Prepare clean source intervals with authentication and secret entry outside the footage.

The renderer replaces the recording's audio with narration, extends the final frame when narration is longer than its selected clip, creates an SRT transcript, and embeds the transcript as a selectable MP4 subtitle track.

## Protocol compatibility and completed audio

The generator supports OpenAI Speech (`/v1/audio/speech`), Realtime (`/v1/realtime`) and GPT-Live (`/v1/live/sessions`). The model-to-protocol mapping lives in `narration_config.py`; model and voice inputs remain strings. For example, `gpt-4o-mini-tts` uses Speech, `gpt-realtime-2.1-mini` uses Realtime and `gpt-live-1` uses Live. Existing manifests remain valid. Legacy `tts-1`/`tts-1-hd` reject unsupported instructions and known incompatible voices; other combinations are also subject to the server's model/voice/access validation. No model, voice or endpoint fallback is attempted after rejection.

Each streamed segment uses a separate session and writes mono PCM16/24 kHz as WAV for the existing renderer. Realtime requires a completed response. Live has no audio-done event: this adapter sends silent input to advance its timeline, waits for the complete script transcript plus a one-second quiet PCM tail, requests `session.close`, drains until `session.closed`, and rechecks the transcript. Timeouts, extra/omitted words, backend delegation or early disconnects fail instead of saving partial narration. Transcript comparison tolerates casing, punctuation and whitespace, not changed words or numbers; hearing the full rendered video remains necessary. Live is a conversational API, so this completion strategy still needs a live integration check with the selected model and voice before relying on it unattended.

Protocol details: [Speech](https://developers.openai.com/api/docs/guides/text-to-speech), [Realtime](https://developers.openai.com/api/docs/guides/realtime-conversations), [Live connections](https://developers.openai.com/api/docs/guides/voice-websockets) and [Live session lifecycle](https://developers.openai.com/api/docs/guides/live-conversations). Consult current provider availability and retirement notices; configurable inputs do not keep a retired model available.

Completed WAVs have adjacent `.wav.json` receipts containing only input/audio SHA-256 hashes. Matching files can be reused without another paid call. Changing text, language, model, voice, instructions or resolved protocol regenerates that segment; corruption, missing receipts and old unverified tracks also require regeneration. `--force` regenerates even matching files. Failed requests do not publish a fresh receipt; the renderer rejects mismatched audio. Dry-run resolves compatibility and reports reuse/generation without API calls or dependency installation.
