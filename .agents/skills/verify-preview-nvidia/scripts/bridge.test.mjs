// ABOUTME: Tests the Portfolio preview bridge with a simulated Playwright context.
// ABOUTME: Uses an in-memory HTTP transport so no chat request leaves the test process.
// @vitest-environment node

import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import http from 'node:http';
import { syncBuiltinESMExports } from 'node:module';
import { afterEach, test, vi } from 'vitest';

import { installPreviewBridge } from './bridge.mjs';

const ORIGIN = 'https://preview.example.test';
const PORT = 8092;

async function setup(onReply = () => {}) {
  const rules = new Map();
  const context = {
    route: (match, handler) => rules.set(match, handler),
    unroute: (match, handler) => {
      assert.equal(rules.get(match), handler);
      rules.delete(match);
    },
  };
  const uninstall = await installPreviewBridge(context, { previewOrigin: ORIGIN, port: PORT, onReply });
  const [[matches, handle]] = rules;
  return { matches, handle, rules, uninstall };
}

function makeRoute(pathname, overrides = {}, response = {}) {
  const calls = [];
  const request = {
    url: () => ORIGIN + pathname,
    method: () => 'GET',
    resourceType: () => 'document',
    redirectedFrom: () => null,
    frame: () => ({ parentFrame: () => null }),
    ...overrides,
  };
  const route = {
    request: () => request,
    fetch: async (options) => {
      calls.push(['fetch', options]);
      return response;
    },
    fulfill: async (options) => calls.push(['fulfill', options]),
    abort: async () => calls.push(['abort']),
    fallback: async () => calls.push(['fallback']),
  };
  return { calls, route };
}

function island(lang, name = 'PortfolioAssistant') {
  const props = JSON.stringify({
    lang: [0, lang],
    preview: [0, false],
    unrelated: [0, 'false & true'],
  }).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  return `<astro-island component-url="/_astro/${name}.Ab_12-fw.js" component-export="default" props="${props}" ssr client="load">`;
}

function fakeTransport({ statusCode, headers, chunks, observe }) {
  vi.spyOn(http, 'request').mockImplementation((options, respond) => {
    const outbound = new EventEmitter();
    outbound.end = (bytes) => {
      observe(options, bytes);
      const response = Object.assign(new EventEmitter(), { statusCode, headers });
      respond(response);
      for (const chunk of chunks) response.emit('data', chunk);
      response.emit('end');
    };
    return outbound;
  });
  syncBuiltinESMExports();
}

afterEach(() => {
  vi.restoreAllMocks();
  syncBuiltinESMExports();
});

test('only clean preview roots and the preview chat path are registered', async () => {
  const { matches, uninstall, rules } = await setup();
  for (const path of ['/', '/en/', '/api/chat', '/api/chat?other']) assert.ok(matches(new URL(ORIGIN + path)));
  for (const url of [
    `${ORIGIN}/api/chat/`, `${ORIGIN}/en`,
    `${ORIGIN}/?foo=bar`, `${ORIGIN}/_astro/PortfolioAssistant.js`,
    'https://production.example.test/api/chat',
  ]) assert.equal(matches(new URL(url)), false);
  await uninstall();
  assert.equal(rules.size, 0);
});

test('changes only the Spanish and English assistant island flag and preserves CSP', async () => {
  const { handle } = await setup();
  for (const [path, lang] of [['/', 'es'], ['/en/', 'en']]) {
    const assistant = island(lang);
    const unrelated = island(lang, 'Other');
    const comment = `<!--${assistant}-->`;
    const script = `<script>var other = '${assistant}'</script>`;
    const html = `${script}${comment}${unrelated}${assistant}é`;
    const headers = {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy': "script-src 'self'",
      'content-length': '17',
      'content-encoding': 'gzip',
      etag: 'stale',
    };
    const { route, calls } = makeRoute(path, {}, {
      status: () => 200,
      headers: () => headers,
      text: () => html,
    });
    await handle(route);
    assert.deepEqual(calls, [
      ['fetch', { maxRedirects: 0, maxRetries: 0 }],
      ['fulfill', {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'content-security-policy': "script-src 'self'",
        },
        body: script + comment + unrelated + assistant.replace('[0,false]', '[0,true]') + 'é',
      }],
    ]);
  }
});

test('leaves redirect, error, and ambiguous assistant documents alone', async () => {
  const { handle } = await setup();
  for (const status of [302, 503, 200]) {
    const response = {
      status: () => status,
      headers: () => ({ 'content-type': 'text/html' }),
      text: () => {
        assert.equal(status, 200);
        return island('es').repeat(2);
      },
    };
    const { route, calls } = makeRoute('/', {}, response);
    await handle(route);
    assert.deepEqual(calls, [
      ['fetch', { maxRedirects: 0, maxRetries: 0 }],
      ['fulfill', { response }],
    ]);
  }
});

test('falls through for subresources, iframe and redirected document requests', async () => {
  const { handle } = await setup();
  for (const [path, overrides] of [
    ['/', { resourceType: () => 'fetch' }],
    ['/', { frame: () => ({ parentFrame: () => ({}) }) }],
    ['/en/', { redirectedFrom: () => ({}) }],
  ]) {
    const { route, calls } = makeRoute(path, overrides);
    await handle(route);
    assert.deepEqual(calls, [['fallback']]);
  }
});

test('forwards untouched request bytes once and awaits inspection of real SSE bytes', async () => {
  const body = Buffer.from(' { "text": "hola" } \n');
  const stream = Buffer.from('data: {"text":"Adiós"}\r\n\r\ndata: [DONE]\n\n');
  const contentType = 'text/event-stream; charset=utf-8';
  const requestType = 'application/json; charset=utf-8';
  let forwards = 0;
  const { route, calls } = makeRoute('/api/chat', {
    method: () => 'POST',
    headerValue: (name) => {
      assert.equal(name, 'content-type');
      return requestType;
    },
    postDataBuffer: () => body,
  });
  fakeTransport({
    statusCode: 200,
    headers: {
      'content-type': contentType,
      'x-vercel-ai-ui-message-stream': 'v1',
      'set-cookie': ['secret=never-forwarded'],
    },
    chunks: [stream.subarray(0, 20), stream.subarray(20)],
    observe: (options, bytes) => {
      forwards++;
      assert.equal(options.hostname, '127.0.0.1');
      assert.equal(options.port, PORT);
      assert.equal(options.path, '/api/chat');
      assert.equal(options.method, 'POST');
      assert.deepEqual(options.headers, { origin: ORIGIN, 'content-type': requestType });
      assert.equal(bytes, body);
    },
  });

  const { handle } = await setup(async (reply) => {
    await Promise.resolve();
    assert.deepEqual(calls, []);
    assert.deepEqual(reply, { status: 200, contentType, streamProtocol: 'v1', body: stream });
    reply.body.fill(0);
  });
  const concurrent = makeRoute('/api/chat', { method: () => 'POST' });
  await Promise.all([handle(route), handle(concurrent.route)]);
  assert.deepEqual(concurrent.calls, [['abort']]);
  assert.equal(forwards, 1);
  assert.deepEqual(calls, [['fulfill', {
    status: 200,
    headers: { 'content-type': contentType, 'x-vercel-ai-ui-message-stream': 'v1' },
    body: stream,
  }]]);
});

test('aborts the browser route when reply inspection rejects', async () => {
  const { route, calls } = makeRoute('/api/chat', {
    method: () => 'POST',
    postDataBuffer: () => Buffer.alloc(0),
    headerValue: () => 'application/json',
  });
  fakeTransport({
    statusCode: 307,
    headers: { location: 'https://example.test/do-not-follow' },
    chunks: [],
    observe: () => {},
  });
  const { handle } = await setup(({ status }) => {
    assert.equal(status, 307);
    throw new Error('rejected by reply inspection');
  });
  await handle(route);
  assert.deepEqual(calls, [['abort']]);
});

test('aborts non-POST, redirected and query-bearing preview chat requests', async () => {
  const { handle } = await setup();
  for (const [path, overrides] of [
    ['/api/chat', {}],
    ['/api/chat', { method: () => 'POST', redirectedFrom: () => ({}) }],
    ['/api/chat?query', { method: () => 'POST' }],
  ]) {
    const { route, calls } = makeRoute(path, overrides);
    assert.deepEqual(await handle(route), undefined);
    assert.deepEqual(calls, [['abort']]);
  }
});
