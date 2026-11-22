// ABOUTME: Exercises the real PostHog SDK against an intercepted loopback collector.
// ABOUTME: Verifies both locales send public interactions without leaking assistant or page data.
import { expect, test, type Request } from '@playwright/test';
import { gunzipSync } from 'node:zlib';
import {
  POSTHOG_COLLECTOR,
  POSTHOG_SITE_SERVER,
  POSTHOG_TEST_TOKEN,
} from '../playwright.posthog.config';

const EVENT_PATH = '/e/';
const LOG_PATH = '/i/v1/logs';

const PRIVATE = {
  question: 'private-assistant-question-canary',
  reply: 'private-assistant-reply-canary',
  challenge: 'private-challenge-token-canary',
  query: 'private-url-query-canary',
  hash: 'private-url-fragment-canary',
  search: 'private-project-search-canary',
  dom: 'private-rendered-dom-canary',
  exception: 'private-client-exception-canary',
  log: 'private-console-log-canary',
};

interface AnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
}

interface AnalyticsLogBatch {
  resourceLogs: { scopeLogs: { logRecords: { body: { stringValue: string } }[] }[] }[];
}

function readBody(request: Request): string {
  const data = request.postDataBuffer();
  if (!data) return '';
  if (data[0] === 0x1f && data[1] === 0x8b) return gunzipSync(data).toString();
  const body = data.toString();
  const encoded = new URLSearchParams(body).get('data');
  return encoded ? Buffer.from(encoded, 'base64').toString() : body;
}

for (const locale of ['es', 'en'] as const) {
  test(`sends only public portfolio analytics in ${locale}`, async ({
    context,
    page,
    baseURL,
    request,
  }) => {
    const siteOrigin = new URL(baseURL!).origin;
    const prefix = locale === 'en' ? '/en' : '';
    const work = `${prefix}/work`;
    const casePath = `${work}/glio-ia`;
    const events: AnalyticsEvent[] = [];
    const logs: string[] = [];
    const requests: Array<{ path: string; headers: Record<string, string>; data: string }> = [];
    const cors = {
      'access-control-allow-origin': siteOrigin,
      'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
    };

    await context.addInitScript(() => {
      // The SDK filters automated clients before capture. Model a regular visitor in this fixture.
      Object.defineProperties(navigator, {
        webdriver: { value: false },
        userAgentData: { value: undefined },
      });
    });

    await context.route('**/*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin === POSTHOG_COLLECTOR) {
        const body = readBody(request);
        const headers = await request.allHeaders();
        requests.push({ path: url.pathname, headers, data: decodeURIComponent(url.href) + body });
        const send = (status: number) =>
          route.fulfill({ headers: cors, status, json: { status: 1 } });
        if (request.method() === 'OPTIONS') return send(200);
        if (request.method() !== 'POST') return send(405);
        if (url.pathname === EVENT_PATH) {
          const { api_key, batch } = JSON.parse(body) as {
            api_key: string;
            batch: AnalyticsEvent[];
          };
          if (
            api_key !== POSTHOG_TEST_TOKEN ||
            !batch?.length ||
            batch.some(
              ({ event, properties }) =>
                properties?.token !== POSTHOG_TEST_TOKEN ||
                typeof properties.distinct_id !== 'string' ||
                !properties.distinct_id ||
                !event,
            )
          )
            return send(400);
          events.push(...batch);
          return send(200);
        }
        if (url.pathname === LOG_PATH && url.searchParams.get('token') === POSTHOG_TEST_TOKEN) {
          const { resourceLogs } = JSON.parse(body) as AnalyticsLogBatch;
          const messages = resourceLogs.flatMap(({ scopeLogs }) =>
            scopeLogs.flatMap(({ logRecords }) => logRecords.map(({ body }) => body.stringValue)),
          );
          if (messages.length === 0) return send(400);
          logs.push(...messages);
          return send(200);
        }
        return send(400);
      }
      if (url.hostname === 'challenges.cloudflare.com') {
        return route.fulfill({
          contentType: 'application/javascript',
          body: `window.turnstile = {
            render(container, options) {
              options.callback(${JSON.stringify(PRIVATE.challenge)});
              return 'portfolio-playwright-widget';
            },
            remove() {},
          };`,
        });
      }
      if (url.origin !== siteOrigin) return route.abort();
      if (url.pathname === '/api/chat') {
        const chunks = [
          { type: 'start', messageId: 'portfolio-playwright-reply' },
          { type: 'text-start', id: 'text' },
          { type: 'text-delta', id: 'text', delta: PRIVATE.reply },
          { type: 'text-end', id: 'text' },
          { type: 'finish', finishReason: 'stop' },
        ];
        return route.fulfill({
          contentType: 'text/event-stream',
          headers: { 'x-vercel-ai-ui-message-stream': 'v1' },
          body: [
            ...chunks.map((chunk) => `data: ${JSON.stringify(chunk)}`),
            'data: [DONE]',
            '',
          ].join('\n\n'),
        });
      }
      // Present the loopback server as an HTTPS preview so the actual Turnstile flow runs.
      const localUrl = new URL(POSTHOG_SITE_SERVER);
      localUrl.pathname = url.pathname;
      localUrl.search = url.search;
      const response = await route.fetch({ url: localUrl.href, maxRedirects: 0 });
      if (url.pathname.endsWith('.pdf')) {
        return route.fulfill({ contentType: 'application/pdf', body: await response.body() });
      }
      return route.fulfill({ response });
    });

    const analyticsResponse = page.waitForResponse(
      (response) =>
        response.url().startsWith(`${POSTHOG_COLLECTOR}${EVENT_PATH}`) &&
        response.request().method() === 'POST',
    );
    await page.goto(`${prefix}/?private=${PRIVATE.query}#${PRIVATE.hash}`);
    expect(
      (await analyticsResponse).status(),
      'analytics collector accepted the initial pageview',
    ).toBe(200);
    await page.evaluate((canaries) => {
      const marker = document.createElement('span');
      marker.textContent = canaries.dom;
      marker.title = canaries.dom;
      document.body.append(marker);
      document.title = canaries.dom;
      Reflect.set(window, 'portfolioPlaywrightNavigationMarker', canaries.dom);
      window.dispatchEvent(
        new ErrorEvent('error', {
          error: new Error(canaries.exception),
          message: canaries.exception,
        }),
      );
      console.error(canaries.log);
      window.addEventListener('click', (event) => {
        if (
          event.target instanceof Element &&
          event.target.closest('a[data-project-link], a[data-contact-method]')
        ) {
          event.preventDefault();
        }
      });
    }, PRIVATE);

    const assistant = page.getByRole('complementary', {
      name: locale === 'en' ? 'Assistant' : 'Asistente',
    });
    await expect(assistant.locator('#assistant-question')).toBeVisible();
    const chatRequest = page.waitForRequest(
      (request) => new URL(request.url()).pathname === '/api/chat',
    );
    const question = assistant.getByRole('textbox');
    await question.fill(PRIVATE.question);
    await question.press('Enter');
    const sentQuestion = await chatRequest;
    expect(sentQuestion.postData()).toContain(PRIVATE.question);
    expect(sentQuestion.headers()['x-portfolio-challenge']).toBe(PRIVATE.challenge);
    await expect(assistant.getByRole('log').getByText(PRIVATE.reply)).toBeVisible();

    const dock = page.locator('.desktop-dock');
    await dock
      .getByRole('link', { name: locale === 'en' ? 'Projects' : 'Proyectos', exact: true })
      .click();
    const search = page.getByRole('searchbox');
    await search.fill(PRIVATE.search);
    await expect(page).toHaveURL(
      (url) => url.pathname === work && url.searchParams.get('q') === PRIVATE.search,
    );
    await page.getByRole('combobox').selectOption('ai');
    await page
      .getByRole('button', { name: locale === 'en' ? 'Clear filters' : 'Limpiar filtros' })
      .click();
    await page.evaluate(({ query, hash }) => {
      history.replaceState(history.state, '', `?private=${query}#${hash}`);
    }, PRIVATE);
    await page
      .locator('project-catalog')
      .getByRole('link', { name: /GLIO-IA/ })
      .click();
    await expect(page).toHaveURL(casePath);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('GLIO-IA');
    expect(
      await page.evaluate(() => Reflect.get(window, 'portfolioPlaywrightNavigationMarker')),
    ).toBe(PRIVATE.dom);
    const projectLink = page.locator('main a[data-project-link][data-link-type="external"]');
    await projectLink.click();
    await projectLink.click();

    const menu = page.locator('.desktop-menu');
    await menu
      .getByRole('link', { name: locale === 'en' ? 'Contact' : 'Contacto', exact: true })
      .click();
    const email = page.locator('main a[href^="mailto:"]');
    await email.click();
    await email.click();
    await dock.getByRole('link', { name: 'CV', exact: true }).click();
    const cvLink = page.locator('main a[download][href^="/cv/eng/"]');
    const pdfUrl = new URL(POSTHOG_SITE_SERVER);
    pdfUrl.pathname = (await cvLink.getAttribute('href'))!;
    const pdfResponse = await request.get(pdfUrl.href);
    expect(pdfResponse.ok()).toBe(true);
    expect(pdfResponse.headers()['content-type']).toContain('application/pdf');
    expect((await pdfResponse.body()).subarray(0, 4).toString()).toBe('%PDF');
    const download = page.waitForEvent('download');
    await cvLink.click();
    expect((await download).suggestedFilename()).toMatch(/\.pdf$/);

    await expect
      .poll(() => events.map(({ event }) => event).filter((event) => event !== '$pageview'))
      .toEqual([
        'project_filter_changed',
        'project_filter_changed',
        'project_detail_opened',
        'project_link_opened',
        'project_link_opened',
        'contact_method_opened',
        'contact_method_opened',
        'cv_downloaded',
      ]);
    for (const { event, properties } of events) {
      if (event !== '$pageview') expect(properties.locale).toBe(locale);
    }
    const propertiesFor = (name: string) =>
      events.filter(({ event }) => event === name).map(({ properties }) => properties);
    expect(propertiesFor('project_filter_changed')).toMatchObject([
      { project_type: 'ai' },
      { action: 'cleared' },
    ]);
    expect(propertiesFor('project_detail_opened')).toMatchObject([
      { project_slug: 'glio-ia', project_type: 'ai', is_featured: true },
    ]);
    expect(propertiesFor('project_link_opened')).toMatchObject(
      Array(2).fill({ project_slug: 'glio-ia', link_type: 'external' }),
    );
    expect(propertiesFor('contact_method_opened')).toMatchObject([
      { method: 'email' },
      { method: 'email' },
    ]);
    expect(propertiesFor('cv_downloaded')).toMatchObject([{ locale, cv_locale: 'en' }]);
    expect(propertiesFor('$pageview').map((properties) => properties.$pathname)).toEqual([
      `${prefix}/`,
      `${work}/`,
      `${casePath}/`,
      `${prefix}/contact/`,
      `${prefix}/cv/`,
    ]);
    await expect
      .poll(() => logs, { timeout: 10_000 })
      .toEqual([
        'portfolio project detail opened',
        'portfolio contact method opened',
        'portfolio contact method opened',
        'portfolio CV downloaded',
      ]);
    expect([...new Set(requests.map(({ path }) => path))].sort()).toEqual([EVENT_PATH, LOG_PATH]);
    for (const { path, headers, data } of requests) {
      expect(headers.referer, `analytics referrer on ${path}`).toBeUndefined();
      for (const canary of Object.values(PRIVATE)) {
        expect(
          data + JSON.stringify(headers),
          `private value in analytics request to ${path}`,
        ).not.toContain(canary);
      }
    }
  });
}
