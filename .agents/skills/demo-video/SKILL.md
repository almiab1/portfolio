---
name: demo-video
description: Record and produce a narrated MP4 walkthrough of a Portfolio feature, or post-process existing footage. Use when asked for a product demo video.
---

# Demo Video

Explain a Portfolio change in a concise narrated MP4. Show what changed, why it helps, and how to use it. Choose one clear visual journey. A matching E2E report can support the demo. When there is no relevant visual outcome, record `SKIPPED` and the reason.

## Modes

- **Record and produce (default):** prepare and record a demonstration from relevant E2E evidence when supplied, otherwise from the task, specification and diff.
- **Post-process:** reuse an existing demo recording with identifiable functionality, source revision and observed outcomes.

Accept an optional E2E result Markdown file or explicit path, including referenced case evidence. Use that input first; otherwise use an unambiguous result reference already present in task/run artifacts. Missing E2E evidence selects standalone preparation, not a request for the user to run E2E. `test-e2e` does not record media.

## Presentation rule

In every environment and both invocation modes, show the complete product viewport and the displayed data of the journey. Keep navigation, surrounding panels and product context visible. Do not conceal them with masks, blur, opaque overlays, CSS/DOM hiding or crops. This is a global rule, without audience switches or environment-specific exceptions.

Complete authentication before recording and keep passwords, API keys and authentication tokens outside retained footage, narration, captions, filenames and command output. If secret entry appears in a source recording, select clean intervals or record the scene again rather than covering the interface.

## Browser selection

For a new recording, use this order without silently substituting another browser mechanism:

1. Playwright MCP when it is available and supports video capture.
2. Playwright CLI when Playwright MCP is unavailable.
3. Stop and report that browser recording is unavailable when neither can be used.

An existing recording is input to **post-process** mode; it is not a substitute when the user requested a fresh browser run.

## Recording preflight

Before the main recording, prove that the browser surface will produce a usable video:

1. Choose a canvas that fits the available display. Make the page viewport, recording surface, and final manifest canvas use the same width, height, and aspect ratio. A larger native browser window is fine because its chrome is not part of the page viewport.
2. Size or maximize the native browser window so the complete viewport is visible to a supervising user. Browser viewport resizing alone may not resize the native window.
3. Open the product surface that will be demonstrated, including any drawer, modal, or assistant panel whose layout matters.
4. Make a short disposable recording with the intended recording dimensions, stop it, and inspect a representative frame from the actual file.
5. Do not begin the scenario while the frame contains cropped product UI, unintended padding or bars, distorted scaling, or controls outside the visible surface. Adjust the dimensions and repeat the preflight instead.

The preflight verifies the recorded pixels, not only the browser snapshot or the reported video dimensions. Keep it separate from the successful scenario recording.

## Boundaries

- From E2E results, use only cases explicitly marked `PASS` (`success`) with their supporting observations. `FAIL`, `BLOCKED`, and `NOT RUN` cases cannot support demo claims. Preserve any instability qualification on passing retries.
- Also use the PR diff, source code, specifications, and user request to understand and explain the feature. Identify each source separately: code inspection or an intended requirement does not establish that a behavior passed E2E or was observed in the recording.
- Keep claims within their evidence. Do not rerun the E2E suite, create acceptance coverage, change its verdicts, or fix application code as part of making a demo.
- Use a successful recording for a product demo. Keep failed attempts as engineering evidence unless the user explicitly requests a debugging retrospective.
- Resolve the site URL and revision using [the execution target procedure](../test-e2e/references/execution-target.md). Reuse matching E2E context. If the revision or destination differs, use standalone observations.
- Record only public content or material the user has authorized for the intended audience. Send only sanitized narration to an authorized text-to-speech provider.
- Keep technical evidence, failures and limitations in the internal Markdown. Narration addresses the viewer's goals and visible actions, not databases, logs, SHAs or agent/tool mechanics. Explain the previous experience only when supported by requirements or historical evidence.
- Return observations and artifacts only. Workflow transitions, repair dispatch and implementation changes belong to the caller, not this skill.

## Workflow

### 1. Gather context and choose the journey

Create a unique run directory outside the repository, or use the task's artifact location. Start [the demo scenario template](assets/demo-scenarios.md) and record applicability, inputs, and missing prerequisites.

Read supplied E2E result Markdown and its referenced evidence when available. Select relevant `PASS` cases and retain retry qualifications; a mixed run can support independent passing functionality. Match the evidence to the actual destination and revision. Known failed prerequisites cannot support a success story; missing, stale or unrelated evidence does not prevent an independent demonstration of observable functionality. Record that no E2E verdict applies to the standalone journey.

For the diff, follow the branch-scope procedure in [test-e2e](../test-e2e/SKILL.md#1-establish-the-branch-scope): pin the comparison base and source revision, include renamed/deleted files and relevant local dirty changes, and preserve the worktree and branch. Use the task, specifications and product contracts to define expected behavior independently of the implementation. Record any unavailable comparison or source attribution as a limitation.

Choose the route, locale, and viewport that best show the feature. Use a fresh browser session when state such as a language or theme preference would change the starting view.

### 3. Create demonstration scenarios

Complete the scenario artifact before opening the feature. Carry forward account selection, source identity and capture and cleanup context.

- Define the communication goal, intended viewer, and message of each visual moment. Choose a concise journey that shows the feature's value.
- Link each scenario to relevant passing E2E cases when available, or task/diff/specification sources in standalone mode. Several cases may support one scenario; omit acceptance checks irrelevant to the story.
- Specify the initial route, locale, inputs, ordered UI actions, visible outcomes, and narration points. Include rejection behavior when useful to the viewer and supported by observation.
- List dependencies and any setup to complete outside retained footage.

### 4. Prepare and record

For **record and produce**, check source identity before feature actions and at completion. Keep one identified revision per recording. Complete the recording preflight and keep setup or preview authentication outside retained footage.

Record at a readable pace. If a scene diverges from the expected journey, record the discrepancy in Markdown and continue independent scenes. Use a fresh session when retrying a state-dependent scene.

For **post-process**, confirm the recording's scenario, source identity and observed outcomes, plus matching E2E cases if supplied. Record unknown provenance and limit claims accordingly; an existing recording is not automatically E2E evidence.

Inspect the candidate recording and screenshots against the presentation rule before selecting retained intervals.

### 5. Produce the narrated video

Check local requirements:

```bash
command -v ffmpeg
command -v ffprobe
```

If either command is unavailable, stop before rendering and report the installation prerequisite. Do not install it automatically.

Create a JSON manifest beside the demo scenarios. Follow [the manifest contract](references/manifest.md). Accept optional external `model`, `voice` and delivery `instructions` from the invocation or its explicitly supplied configuration; explicit invocation values take precedence. Store them under `tts`; omitted values retain the documented defaults. Models and voices are strings, not fixed enums. The generator resolves the protocol internally; `tts.api` is an optional compatibility override, not a required input. Never substitute a requested model/voice silently or treat narration options as authority to change product claims or access.

Map selected source intervals to the scenarios' visual moments in the scenario artifact; keep source citations there rather than adding unsupported manifest fields. Finalize short chapters and narration from the actual footage and attributed supporting evidence. Realtime and Live require the Python dependency declared in [scripts/requirements.txt](scripts/requirements.txt); report missing dependencies rather than installing them automatically. Speech and rendering keep their standard-library Python implementation. FFmpeg/FFprobe remain preinstalled requirements.

Validate without external calls:

```bash
python3 .agents/skills/demo-video/scripts/generate_narration.py <manifest> --dry-run
python3 .agents/skills/demo-video/scripts/render_demo.py <manifest> --validate-only
```

When narration generation is authorized and `OPENAI_API_KEY` is available, create the audio segments using the selected protocol. Only sanitized narration, language and delivery instructions are sent to OpenAI; recordings, credentials and product access configuration are not narration inputs. Streamed protocols must complete with a transcript matching the script before audio is saved. A mismatch, timeout or rejected combination is a narration failure, not permission to alter the script, switch models or retry indefinitely:

```bash
python3 .agents/skills/demo-video/scripts/generate_narration.py <manifest>
```

Render the MP4 and sidecar subtitles:

```bash
python3 .agents/skills/demo-video/scripts/render_demo.py <manifest>
```

Audio is reused only when its receipt matches the text, language, model, voice, instructions, protocol and file checksum. Changed inputs regenerate the affected track; the renderer rejects stale or unverified tracks. `--force` explicitly regenerates even matching tracks. Report generation failures and pending media without publishing an earlier track as the requested narration.

### 6. Review and package

Review the entire MP4 for readable product context, accurate narration and subtitles, clean segment boundaries, and absence of secrets. In the Markdown result, include source identity, optional E2E references, observed outcomes, attempts, and limitations. Use `COMPLETE` for the reviewed journey, `PARTIAL` for omitted scenes, `BLOCKED` for missing prerequisites, and `SKIPPED` when no visual journey applies.

### 7. Deliver

Provide local paths to the reviewed video, subtitles, and result. Publish only when the user specifies a destination and authorizes the upload. Record a confirmed publication link when applicable.

## Output

The scripts keep generated narration in `.demo-audio/` beside the manifest and produce the configured MP4 and adjacent `.srt` transcript. The complete workflow retains:

- the configured MP4;
- an adjacent `.srt` transcript;
- a demo scenario artifact and render manifest alongside the generated media;
- the internal Markdown result, including limitations and optional unchanged E2E evidence references; skipped or blocked runs retain this result even without media;
- any publication link the user requested and that was verified.
