// ABOUTME: Tests PostHog startup and route tracking without external analytics requests.
// ABOUTME: Exercises the final event and log filters with synthetic private data.

import type { BeforeSendFn, CaptureLogOptions, PostHogConfig } from 'posthog-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

interface AnalyticsConfig extends Partial<PostHogConfig> {
  before_send: BeforeSendFn;
  logs: {
    captureConsoleLogs: boolean;
    beforeSend: (record: CaptureLogOptions) => CaptureLogOptions | null;
  };
}

const { init, capture, info, listen } = vi.hoisted(() => ({
  init: vi.fn<(token: string, config: AnalyticsConfig) => void>(),
  capture: vi.fn(),
  info: vi.fn(),
  listen: vi.fn<(capture: (event: string, properties: Record<string, string>) => void) => void>(),
}));

vi.mock('posthog-js/no-external', () => ({
  default: { init, capture, logger: { info }, get_distinct_id: () => 'anonymous-id' },
}));

vi.mock('./portfolio-events', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./portfolio-events')>()),
  listenForPortfolioEvents: listen,
}));

function setCanonical(url: string) {
  document.head.innerHTML = '<link rel="canonical">';
  document.head.querySelector('link')!.href = url;
}

afterEach(() => {
  document.head.replaceChildren();
  document.documentElement.removeAttribute('lang');
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.resetModules();
});

describe('PostHog portfolio analytics', () => {
  it('requires both environment values before registering analytics', async () => {
    const { startPostHog } = await import('./posthog');

    startPostHog(undefined, 'https://collector.example', 'test');
    startPostHog('phc_test', ' ', 'test');

    expect(init).not.toHaveBeenCalled();
    expect(listen).not.toHaveBeenCalled();
  });

  it('initializes once and tracks each canonical route without search or hash', async () => {
    const { startPostHog } = await import('./posthog');
    const addListener = vi.spyOn(document, 'addEventListener');
    setCanonical('https://portfolio.example/work?private=prompt#reply');

    startPostHog('phc_test', 'https://collector.example', 'test');
    startPostHog('phc_test', 'https://collector.example', 'test');
    expect(init).toHaveBeenCalledTimes(1);
    expect(listen).toHaveBeenCalledTimes(1);

    const pageLoad = addListener.mock.calls.find(([name]) => name === 'astro:page-load')?.[1];
    expect(pageLoad).toEqual(expect.any(Function));
    try {
      document.dispatchEvent(new Event('astro:page-load'));
      setCanonical('https://portfolio.example/en/work');
      document.dispatchEvent(new Event('astro:page-load'));
      setCanonical('https://portfolio.example/work');
      document.dispatchEvent(new Event('astro:page-load'));

      expect(capture.mock.calls).toEqual([
        ['$pageview', { $current_url: 'https://portfolio.example/work', $pathname: '/work' }],
        ['$pageview', { $current_url: 'https://portfolio.example/en/work', $pathname: '/en/work' }],
        ['$pageview', { $current_url: 'https://portfolio.example/work', $pathname: '/work' }],
      ]);

      const config = init.mock.calls[0][1];
      expect(config).toMatchObject({
        advanced_disable_flags: true,
        autocapture: false,
        capture_exceptions: false,
        disable_external_dependency_loading: true,
        disable_session_recording: true,
        disable_beacon: true,
        fetch_options: { referrerPolicy: 'no-referrer', credentials: 'omit' },
        logs: { captureConsoleLogs: false },
      });

      document.documentElement.lang = 'es';
      const timestamp = new Date('2026-01-01T00:00:00Z');
      const event = {
        uuid: 'event-id',
        timestamp,
        event: 'contact_method_opened',
        properties: {
          method: 'email',
          locale: 'private-prompt',
          $current_url: 'private-prompt',
          $referrer: 'private-reply',
        },
        $set: { name: 'private-prompt' },
      };
      expect(config.before_send(event)).toEqual({
        uuid: 'event-id',
        timestamp,
        event: 'contact_method_opened',
        properties: {
          token: 'phc_test',
          distinct_id: 'anonymous-id',
          $process_person_profile: false,
          method: 'email',
          locale: 'es',
        },
      });
      expect(config.before_send({ ...event, event: '$exception' })).toBeNull();
      expect(config.logs.beforeSend({ body: 'private-prompt' })).toBeNull();
      expect(
        config.logs.beforeSend({
          body: 'contact_method_opened',
          attributes: { method: 'email', 'url.full': 'private-prompt', message: 'private-reply' },
        }),
      ).toEqual({
        body: 'portfolio contact method opened',
        level: 'info',
        attributes: { method: 'email', locale: 'es', 'url.full': null },
      });

      document.documentElement.lang = 'en';
      expect(
        config.before_send({
          ...event,
          event: 'cv_downloaded',
          properties: { locale: 'es', cv_locale: 'es' },
        })?.properties,
      ).toMatchObject({ locale: 'en', cv_locale: 'es' });
      document.documentElement.lang = 'private-reply';
      expect(config.before_send(event)).toBeNull();

      const reportInteraction = listen.mock.calls[0][0];
      reportInteraction('contact_method_opened', { method: 'email' });
      expect(info).toHaveBeenCalledWith('contact_method_opened', { method: 'email' });
    } finally {
      if (pageLoad) document.removeEventListener('astro:page-load', pageLoad);
    }
  });
});
