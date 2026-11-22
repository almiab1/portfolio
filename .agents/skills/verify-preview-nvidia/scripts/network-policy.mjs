// ABOUTME: Classifies browser traffic outside the configured PostHog collector.
// ABOUTME: Forwards validated collector packets without browser credentials or redirect following.
import { gunzipSync } from 'node:zlib';
import { requireCheck } from './payloads.mjs';

const VERCEL_SCRIPT = /^\/(?:_vercel\/insights|[a-f0-9]{16})\/script\.js$/;
const VERCEL_CONTROLS = new Set(['/_vercel/insights/view', '/_vercel/insights/event']);
const COLLECTOR_PATH =
  /(?:^|\/)(?:e|i\/v1\/logs|batch|capture|collect|decide|flags|ingest|proxy|events?|track|beacon|posthog|analytics|telemetry|t|session-recordings?|s)(?:\/|$)/i;
const RESPONSE_HEADERS = /^(?:content-type|access-control-[a-z-]+)$/i;

function decoded(text) {
  try {
    return decodeURIComponent(text.replaceAll('+', ' '));
  } catch {
    return text;
  }
}

function normalized(text) {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function hasMarker(values, markers) {
  const candidates = values.flatMap((value) => [normalized(value), normalized(decoded(value))]);
  return markers.some((marker) => {
    const needle = normalized(marker);
    return needle && candidates.some((candidate) => candidate.includes(needle));
  });
}

function payloadText(body) {
  if (body?.[0] === 0x1f && body[1] === 0x8b) {
    try {
      return gunzipSync(body, { maxOutputLength: 128_000 }).toString();
    } catch {
      return '';
    }
  }
  return body?.toString() ?? '';
}

export function classifyPreviewRequest(
  { url, method, headers, body, redirected, resourceType },
  { previewOrigin, home, query, fragment, markers },
) {
  const sameOrigin = url.origin === previewOrigin;
  const read = method === 'GET' || method === 'HEAD';
  const path = decoded(url.pathname);
  if (sameOrigin && path.replace(/\/$/, '') === '/api/chat') return 'unbridged';

  if (sameOrigin && read && path === home) {
    if (
      url.searchParams.getAll('verification').length === 1 &&
      url.searchParams.get('verification') === query
    ) {
      url = new URL(url);
      url.searchParams.delete('verification');
      if (url.hash === '#' + fragment) url.hash = '';
    }
  }

  const vercelControl = sameOrigin && method === 'POST' && VERCEL_CONTROLS.has(path);
  const vercelScript =
    read &&
    resourceType === 'script' &&
    ((sameOrigin && VERCEL_SCRIPT.test(path)) ||
      (url.origin === 'https://va.vercel-scripts.com' && path === '/v1/script.debug.js'));
  const inspectedHeaders = Object.entries(headers)
    .filter(([name]) => !sameOrigin || !['cookie', 'referer'].includes(name))
    .map(([, value]) => value);
  if (hasMarker([url.href, payloadText(body), ...inspectedHeaders], markers)) return 'blocked';
  if (redirected || url.username || url.password) return 'blocked';
  if (vercelControl || (vercelScript && !body?.length)) return 'vercel-control';
  if (
    sameOrigin &&
    read &&
    !body?.length &&
    !path.startsWith('/_vercel/insights/') &&
    !COLLECTOR_PATH.test(path)
  ) {
    return 'preview-read';
  }
  return 'blocked';
}

export async function forwardCollectorRequest(route, transport, { url, headers, body }) {
  const client = await transport.newContext();
  try {
    // Playwright routes only see the first URL in a redirect chain.
    const response = await client.fetch(url.href, {
      method: 'POST',
      headers,
      data: body,
      maxRedirects: 0,
      timeout: 20_000,
    });
    const status = response.status();
    requireCheck(status >= 200 && status < 300, 'Collector returned an unsuccessful status');
    await route.fulfill({
      status,
      headers: Object.fromEntries(
        Object.entries(response.headers()).filter(([name]) => RESPONSE_HEADERS.test(name)),
      ),
      body: await response.body(),
    });
  } finally {
    await client.dispose();
  }
}
