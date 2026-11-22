// ABOUTME: Tests the build-time opt-ins used by the portfolio assistant.
// ABOUTME: Keeps production, hosted preview, and local fixture activation independent.
import { expect, test } from 'vitest';
import { getAssistantAvailability } from './assistant-availability';

const build = {
  previewOptIn: true,
  publicOptIn: false,
  vercel: true,
  deployment: 'portfolio-deployment.vercel.app',
  siteKey: 'site-key',
};

test('production requires its own opt-in and a site key and uses the public origin', () => {
  const production = { ...build, environment: 'production' };
  expect(getAssistantAvailability(production)).toEqual({ local: false, challenge: undefined });
  expect(getAssistantAvailability({ ...production, publicOptIn: true, siteKey: ' ' })).toEqual({
    local: false,
    challenge: undefined,
  });
  expect(
    getAssistantAvailability({ ...production, previewOptIn: false, publicOptIn: true }),
  ).toEqual({
    local: false,
    challenge: { origin: 'https://www.alejandromira.com', siteKey: 'site-key' },
  });
});

test('hosted preview uses only the deployment hostname and fails closed without configuration', () => {
  const preview = { ...build, environment: 'preview' };
  expect(getAssistantAvailability(preview)).toEqual({
    local: false,
    challenge: { origin: 'https://portfolio-deployment.vercel.app', siteKey: 'site-key' },
  });
  expect(getAssistantAvailability({ ...preview, deployment: undefined }).challenge).toBeUndefined();
  expect(
    getAssistantAvailability({ ...preview, previewOptIn: false, publicOptIn: true }).challenge,
  ).toBeUndefined();
});

test('a local fixture can opt in without a site key or hosted origin', () => {
  expect(getAssistantAvailability({ ...build, vercel: false, siteKey: undefined })).toEqual({
    local: true,
    challenge: undefined,
  });
  expect(getAssistantAvailability(build)).toEqual({ local: false, challenge: undefined });
});
