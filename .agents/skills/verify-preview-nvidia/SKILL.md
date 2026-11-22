---
name: verify-preview-nvidia
description: Repeat the bilingual assistant privacy check with the develop preview UI, a local NVIDIA backend and real PostHog ingestion. Use to verify the hybrid flow or identify the remaining public-launch checks.
---

# Verify the develop preview with local NVIDIA

Use this when Alex asks to repeat the live privacy check. A run sends synthetic questions to NVIDIA and creates test traffic in the portfolio's PostHog project. When asked only to document or review the procedure, use the offline checks. The hybrid run needs neither Redis nor Turnstile. Keep the preview deployment, its access protection and production settings intact.

## Prepare the two endpoints

1. Resolve the `develop` alias of Vercel project `personal-web` to its **Ready immutable deployment**. Verify its Git branch and commit. Use application code and dependencies matching that commit. Record the SHA, the clean deployment origin and the UTC start time.
2. Confirm the preview uses the intended PostHog project and ingestion origin. The original run used EU project `362830`. Open the [portfolio dashboard](https://eu.posthog.com/project/362830/dashboard/1140590) and record the current CV download count. Have read access to events, logs and recordings as well as access to the protected preview.
3. From the repo root, select Node 22 and install locked dependencies with `pnpm install --frozen-lockfile`. Set the following in the shell that will run the browser. Supply the preview's **origin only**, without a query string or trailing slash. Set POSTHOG_ORIGIN to the collector actually embedded in this deployment. If protected, obtain a short-lived share URL through the team's authenticated Vercel access. Store it in `$PREVIEW_ACCESS_FILE` inside the private directory below, with mode 0600. Keep it out of command history, screenshots and chat.

```bash
umask 077
export RUN_DIR="$(mktemp -d)"
export PREVIEW_ORIGIN="https://<immutable-develop-deployment>"
export POSTHOG_ORIGIN="https://eu.i.posthog.com"
export LOCAL_CHAT_PORT=18762
export REPORT_FILE="$RUN_DIR/result.json"
export PREVIEW_ACCESS_FILE="$RUN_DIR/access"
```

Start the local backend in this environment. Put `NVIDIA_API_KEY` in the ignored `.env.local` or pass the absolute path of the corresponding private env file. Choose an unused loopback port. Use a local shell without hosted Vercel flags.

```bash
PORTFOLIO_ASSISTANT_MODE=live PORTFOLIO_ASSISTANT_PROVIDER=nvidia \
PORTFOLIO_ASSISTANT_LOCAL_ORIGIN="$PREVIEW_ORIGIN" \
uv run --no-project --python 3.13 --env-file .env.local \
  --with-requirements requirements.txt --with uvicorn python -c '
import logging, os, uvicorn
from server.assistant_inference import provider_settings
settings = provider_settings()
assert settings.provider == "nvidia"
assert os.environ.get("VERCEL") != "1" and "VERCEL_ENV" not in os.environ
print("Provider:", settings.provider, "model:", settings.model, flush=True)
for name in ("api.chat", "httpx2"):
    logger = logging.getLogger(name)
    logger.addHandler(logging.StreamHandler())
    logger.setLevel(logging.INFO)
    logger.propagate = False
uvicorn.run("api.chat:app", host="127.0.0.1",
            port=int(os.environ["LOCAL_CHAT_PORT"]), access_log=False)
'
```

## Run one turn per language

Delegate the browser check to the repo's UI validator. Give it the repo root, clean preview origin, loopback port and private **file paths**. Run with the exported browser settings in a second shell. Install Chromium with `pnpm exec playwright install chromium` if missing.

```bash
node .agents/skills/verify-preview-nvidia/scripts/run.mjs
```

The bridge enables the deployed assistant island's remote transport only in the test browser. It sends the original chat payload to loopback and returns the actual server-sent events (SSE) to the UI. The preview serves the app and the PostHog SDK throughout. A comparison of GLIO-IA and SIMDAT exercises synthesis in each language. A CV preset or an editorial reply can complete with zero model calls.

For each locale, correlate the visible reply with the returned text, an HTTP 200 from NVIDIA's `/v1/chat/completions`, and an `assistant_turn` log with `mode=synthesis status=complete` and `requests=1`. Keep the contexts alive until PostHog accepts both the matching CV download event and its deferred log. A completed model call can outlive a closed tab. If a run fails, count all provider attempts and identify which evidence was lost before deciding whether another paid attempt is needed.

## Verify the receiving end

Use the private report and [PostHog checks](references/posthog.md) to verify the ES/EN controls, search stored telemetry for input and output fragments, and count recordings. A pass requires positive ingestion **and** zero matches for conversation content. Report missing evidence or a blocked send as a failure or an incomplete check. After verification, stop the loopback server, close the browser and remove the temporary access file and private report when no longer needed. Keep a summary containing the SHA, model, UTC window, control counts, privacy result and retries.

## What remains before public access

Use the [hosted configuration and limits](../../../docs/features/assistant-preview.md) for a separately authorized deployment test. Record these items as pending until tested on the hosted path:

- **Deployed function and credentials.** On protected staging, exercise the deployed `/api/chat` with the normal browser and real NVIDIA settings, once in ES and once in EN. Match each answer to a successful provider call. At production rollout, confirm canonical host `www.alejandromira.com`, build/runtime flags and intended alias behavior.
- **Bot and origin controls.** Verify the real managed Turnstile widget on the allowed hostname and `portfolio_chat` action. Confirm success and that missing or rejected verification and an unapproved origin stop the turn before inference.
- **Shared cost limits.** Use a dedicated staging Redis with production-equivalent limits or low test limits. Check per-client, global minute and daily reservations across clients/instances, a quota rejection (429), and failure with Redis unavailable (503). Reconcile provider attempts with reservations. An editorial turn should consume zero.
- **Privacy and shutdown.** Repeat the bilingual telemetry checks against the hosted chat, including the challenge token in the browser's private-data checks. Check hosted function logs for transcript leakage. Exercise the documented return to demo and verify how to stop calls to an already deployed live endpoint. The hybrid test establishes browser privacy for the observed turns only.

## Offline checks

From the repo root, run the bridge and payload tests without contacting either service. The [existing SDK spec](../../../e2e/portfolio-posthog.spec.ts) also covers the site’s analytics policy with intercepted endpoints.

```bash
node --test --experimental-test-isolation=none .agents/skills/verify-preview-nvidia/scripts/*.test.mjs
```

## Recorded baseline

On 2026-11-22 at `b17d3a8`, the hybrid run completed one visible ES turn and one EN turn with NVIDIA Nemotron. There were three successful NVIDIA calls because the first ES tab closed before displaying its reply. For the two completed visits PostHog stored four pageviews, one CV event and one fixed CV log per locale, **zero** matching conversation fragments and **zero** recordings. The dashboard went from four to six downloads. The original report omitted the anonymous IDs, so that check used the UTC window and CV editions. Use fresh IDs and counts on every repeat.
