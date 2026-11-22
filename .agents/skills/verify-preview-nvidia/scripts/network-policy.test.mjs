// ABOUTME: Exercises the preview request policy with synthetic browser packets.
// ABOUTME: Verifies that the collector transport cannot follow redirects or expose cookies.
import { EventEmitter } from 'node:events';
import { describe, expect, test, vi } from 'vitest';
import { classifyPreviewRequest, forwardCollectorRequest } from './network-policy.mjs';

import { installAnalyticsGate } from './run.mjs';

const previewOrigin = 'https://preview.vercel.app';
const query = 'query-canary';
const fragment = 'fragment-canary';
const marker = 'verification-chat-marker';
const auth = 'preview-auth-token';
const rules = {
  previewOrigin,
  home: '/en/',
  query,
  fragment,
  markers: [query, fragment, marker, auth],
};

function classify(path, fields = {}) {
  return classifyPreviewRequest(
    {
      url: new URL(path, previewOrigin),
      method: 'GET',
      headers: {},
      ...fields,
    },
    rules,
  );
}

describe('preview request policy', () => {
  test('allows assets and the home URL and suppresses known Vercel scripts', () => {
    expect(
      classify('/_astro/main.js', {
        resourceType: 'script',
        headers: {
          referer: previewOrigin + '/en/?verification=' + query,
          cookie: auth,
        },
      }),
    ).toBe('preview-read');
    expect(classify('/en/?verification=' + query + '#' + fragment)).toBe('preview-read');
    expect(classify('/_vercel/insights/script.js', { resourceType: 'script' })).toBe(
      'vercel-control',
    );
    expect(classify('/3d75c399acdf0eac/script.js', { resourceType: 'script' })).toBe(
      'vercel-control',
    );
    expect(
      classify('https://va.vercel-scripts.com/v1/script.debug.js', {
        resourceType: 'script',
      }),
    ).toBe('vercel-control');
    expect(
      classify('/_vercel/insights/view', {
        method: 'POST',
        headers: {
          referer: previewOrigin + '/en/?verification=' + query,
          cookie: auth,
        },
        body: Buffer.from('{"url":"https://preview.vercel.app/en/"}'),
      }),
    ).toBe('vercel-control');
  });

  test.each([
    ['/api/proxy/e/', {}],
    ['/_vercel/insights/script.js.copy', { resourceType: 'script' }],
    ['https://va.vercel-scripts.com/v2/script.debug.js', { resourceType: 'script' }],
    ['/collect', {}],
    ['https://unknown.example/favicon.ico', {}],
    ['/en/?verification=' + query + '&copy=' + query, {}],
    ['/_astro/main.js?copy=verification%2Dchat%2Dmarker', {}],
    ['/_astro/main.js', { method: 'POST', body: Buffer.from('opaque') }],
    [
      '/_vercel/insights/view',
      {
        method: 'POST',
        body: Buffer.from(JSON.stringify({ message: marker })),
      },
    ],
  ])('fails on unexpected traffic to %s', (path, packet) => {
    expect(classify(path, packet)).toBe('blocked');
  });
});

describe('collector transport', () => {
  const collector = {
    url: new URL('https://collector.example/e/'),
    headers: { 'content-type': 'application/json', origin: previewOrigin },
    body: Buffer.from('{"batch":[]}'),
  };

  function transportWith(status) {
    const fetch = vi.fn().mockResolvedValue({
      status: () => status,
      headers: () => ({
        location: 'https://unapproved.example/collect',
        'set-cookie': 'unexpected=value',
        'access-control-allow-origin': previewOrigin,
      }),
      body: () => Buffer.from('OK'),
    });
    const dispose = vi.fn();
    return {
      newContext: vi.fn().mockResolvedValue({ fetch, dispose }),
      fetch,
      dispose,
    };
  }

  test.each([301, 302, 307, 308])('does not fulfill or follow HTTP %s', async (status) => {
    const transport = transportWith(status);
    const route = { fulfill: vi.fn() };
    await expect(forwardCollectorRequest(route, transport, collector)).rejects.toThrow(
      'Collector returned an unsuccessful status',
    );

    expect(transport.fetch).toHaveBeenCalledExactlyOnceWith(collector.url.href, {
      method: 'POST',
      headers: collector.headers,
      data: collector.body,
      maxRedirects: 0,
      timeout: expect.any(Number),
    });
    expect(route.fulfill).not.toHaveBeenCalled();
    expect(transport.dispose).toHaveBeenCalledTimes(1);
  });

  test('isolates approved browser data and returns only relevant response headers', async () => {
    const transport = transportWith(200);
    const route = { fulfill: vi.fn() };
    await forwardCollectorRequest(route, transport, collector);

    expect(transport.newContext).toHaveBeenCalledWith();
    expect(route.fulfill).toHaveBeenCalledExactlyOnceWith({
      status: 200,
      headers: { 'access-control-allow-origin': previewOrigin },
      body: Buffer.from('OK'),
    });
    expect(transport.dispose).toHaveBeenCalledTimes(1);
  });
});

test('records a blocked browser leak even after successful controls', async () => {
  const context = new EventEmitter();
  context.route = vi.fn();
  const session = {
    locale: 'en',
    inputs: { query, fragment },
    responses: [{ completed: true, status: 200, controls: [{ path: '/en/' }] }],
  };
  const transport = { newContext: vi.fn() };
  await installAnalyticsGate(
    context,
    {
      previewOrigin,
      posthogOrigin: 'https://collector.example',
    },
    session,
    [marker],
    transport,
  );
  const handler = context.route.mock.calls[0][1];
  const route = {
    request: () => ({
      url: () => previewOrigin + '/api/preview-proxy?value=' + marker,
      method: () => 'GET',
      allHeaders: async () => ({}),
      postDataBuffer: () => null,
      redirectedFrom: () => null,
      resourceType: () => 'fetch',
    }),
    abort: vi.fn(),
    continue: vi.fn(),
  };
  await handler(route);

  expect(session.analyticsFailure).toBe('Unexpected browser request blocked');
  expect(route.abort).toHaveBeenCalledTimes(1);
  expect(route.continue).not.toHaveBeenCalled();
  expect(transport.newContext).not.toHaveBeenCalled();
});
