// ABOUTME: Tests the browser analytics privacy checks with synthetic request fixtures.
// ABOUTME: Exercises uncompressed events, gzipped OTLP, and private data rejection offline.
import { deepEqual, throws } from 'node:assert/strict';
import { test } from 'node:test';
import { gzipSync } from 'node:zlib';
import { inspectAnalytics } from './payloads.mjs';

const token = 'phc_fixture_token';
const distinctId = '0194211c-d200-7f22-8a01-123456789abc';
const time = '2026-01-01T12:00:00.000Z';
const canary = 'Verification-Private-09';
const config = {
  locale: 'es',
  previewOrigin: 'https://fixture.vercel.app',
  userAgent: 'Fixture Chromium',
  markers: [canary],
};

function request(path, payload, headers = {}, encode = Buffer.from) {
  return {
    url: new URL(path, 'https://collector.example'),
    method: 'POST',
    headers: {
      origin: config.previewOrigin,
      'user-agent': config.userAgent,
      'content-type': 'application/json',
      ...headers,
    },
    body: encode(JSON.stringify(payload)),
  };
}

function event(eventName = 'cv_downloaded', properties = { locale: 'es', cv_locale: 'es' }) {
  return {
    api_key: token,
    sent_at: time,
    batch: [
      {
        event: eventName,
        timestamp: time,
        uuid: distinctId,
        properties: {
          distinct_id: distinctId,
          token,
          $process_person_profile: false,
          ...properties,
        },
      },
    ],
  };
}

function otlp(extraAttributes = {}) {
  const attributes = (values) =>
    Object.entries(values).map(([key, stringValue]) => ({
      key,
      value: { stringValue },
    }));
  return {
    resourceLogs: [
      {
        resource: {
          attributes: attributes({ 'service.name': 'portfolio-web', 'os.name': 'Linux' }),
        },
        scopeLogs: [
          {
            scope: { name: 'web', version: '1.453.2' },
            logRecords: [
              {
                timeUnixNano: '1767268800000000000',
                observedTimeUnixNano: '1767268800000000000',
                severityNumber: 9,
                severityText: 'INFO',
                body: { stringValue: 'portfolio CV downloaded' },
                attributes: attributes({
                  posthogDistinctId: distinctId,
                  locale: 'es',
                  cv_locale: 'es',
                  ...extraAttributes,
                }),
              },
            ],
          },
        ],
      },
    ],
  };
}

test('allows canonical pageviews and the actual CV edition with a synthetic correlation ID', () => {
  deepEqual(
    inspectAnalytics(
      request(
        '/e/',
        event('$pageview', {
          $current_url: 'https://alejandromira.com/cv',
          $pathname: '/cv',
        }),
      ),
      config,
    ),
    [{ name: '$pageview', path: '/cv/', distinctId }],
  );
  deepEqual(inspectAnalytics(request('/e/', event()), config), [
    { name: 'cv_downloaded', locale: 'es', cvLocale: 'es', distinctId },
  ]);
});

test('inspects gzipped OTLP controls and blocks hidden attributes', () => {
  const path = '/i/v1/logs?token=' + token;
  const headers = { 'content-encoding': 'gzip' };
  deepEqual(inspectAnalytics(request(path, otlp(), headers, gzipSync), config), [
    { name: 'portfolio CV downloaded', locale: 'es', cvLocale: 'es', distinctId },
  ]);
  throws(
    () =>
      inspectAnalytics(
        request(path, otlp({ 'url.full': 'https://example.test/' }), headers, gzipSync),
        config,
      ),
    /Unexpected analytics attribute/,
  );
});

test('blocks analytics cookies, referrers, autocapture, and even disguised canaries', () => {
  throws(
    () => inspectAnalytics(request('/e/', event(), { cookie: 'secret=value' }), config),
    /Unexpected analytics request header/,
  );
  throws(
    () => inspectAnalytics(request('/e/', event(), { referer: config.previewOrigin }), config),
    /Unexpected analytics request header/,
  );
  throws(
    () => inspectAnalytics(request('/e/', event('$autocapture')), config),
    /Unexpected analytics event/,
  );
  const rawWithCanary = event('cv_downloaded', { arbitrary: 'verification PRIVATE 09' });
  const encoded = (json) =>
    Buffer.from(
      new URLSearchParams({
        data: Buffer.from(json).toString('base64'),
      }).toString(),
    );
  throws(
    () =>
      inspectAnalytics(
        request(
          '/e/?compression=base64',
          rawWithCanary,
          { 'content-type': 'application/x-www-form-urlencoded' },
          encoded,
        ),
        config,
      ),
    /Private canary detected/,
  );
});
