// ABOUTME: Tests the preview verification report with synthetic browser outcomes.
// ABOUTME: Exercises the real report file and its pass criteria without browser traffic.
// @vitest-environment node

import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { runVerification } from './run.mjs';

const DISTINCT_IDS = {
  es: '0194211c-d200-7f22-8a01-123456789abc',
  en: '0194211c-d200-7f22-8a01-123456789abd',
};
let directory;
let config;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'portfolio-preview-report-'));
  config = {
    reportFile: join(directory, 'report.json'),
    previewOrigin: 'https://fixture.vercel.app',
    posthogOrigin: 'https://collector.example',
  };
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

function finishSession(session) {
  session.distinctId = DISTINCT_IDS[session.locale];
  session.verified = true;
  session.phase = 'complete';
}

test('writes a private passing report for two verified locales with different IDs', async () => {
  const report = await runVerification(config, {}, async (_browser, _config, session) => {
    finishSession(session);
  });

  expect(report.status).toBe('passed');
  expect(report.sessions.map(({ locale, distinctId, verified }) => ({ locale, distinctId, verified })))
    .toEqual([
      { locale: 'es', distinctId: DISTINCT_IDS.es, verified: true },
      { locale: 'en', distinctId: DISTINCT_IDS.en, verified: true },
    ]);
  expect(JSON.parse(await readFile(config.reportFile, 'utf8'))).toEqual(report);
  expect((await stat(config.reportFile)).mode & 0o777).toBe(0o600);
});

test.each([
  ['missing locale evidence', { verified: false }],
  ['missing correlation ID', { distinctId: undefined }],
  ['duplicate correlation ID', { distinctId: DISTINCT_IDS.es }],
  ['blocked analytics', { analyticsFailure: 'Analytics privacy or transport check failed' }],
])('writes a partial report when the second locale has %s', async (_reason, outcome) => {
  const report = await runVerification(config, {}, async (_browser, _config, session) => {
    finishSession(session);
    if (session.locale === 'en') Object.assign(session, outcome);
  });

  expect(report.status).toBe('partial');
  expect(JSON.parse(await readFile(config.reportFile, 'utf8')).status).toBe('partial');
});

test('preserves the safe failure reason when an upstream request fails', async () => {
  const report = await runVerification(config, {}, async (_browser, _config, session) => {
    session.phase = 'analytics-flush';
    session.analyticsFailure = 'Collector returned an unsuccessful status';
    throw new Error('Private upstream error details');
  });

  expect(report.status).toBe('partial');
  expect(report.sessions).toMatchObject([
    {
      locale: 'es',
      phase: 'analytics-flush',
      verified: false,
      failure: 'Collector returned an unsuccessful status',
    },
  ]);
  expect(await readFile(config.reportFile, 'utf8')).not.toContain('Private upstream error details');
});
