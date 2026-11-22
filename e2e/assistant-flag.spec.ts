// ABOUTME: Verifies PostHog controls whether Mota is available in the portfolio UI.
// ABOUTME: Covers fail-closed loading, both locales, desktop and mobile layouts.
import { expect, test, type Page } from '@playwright/test';

const LOCALES = [
  {
    path: '/',
    label: 'Asistente',
    prompt: '¿Qué proyectos ha hecho Alex?',
    reply: 'Proyectos destacados',
  },
  {
    path: '/en/',
    label: 'Assistant',
    prompt: 'What projects has Alex built?',
    reply: 'Featured projects',
  },
] as const;

async function mockFlag(page: Page, status: number, enabled: boolean, reply: string) {
  const methods: string[] = [];
  await page.route('**/api/chat', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      methods.push('GET');
      if (status !== 200) return route.fulfill({ status });
      return route.fulfill({ status: 200, json: { enabled } });
    }

    methods.push(request.method());
    const chunks = [
      { type: 'start', messageId: 'assistant-flag-test' },
      { type: 'text-start', id: 'text' },
      { type: 'text-delta', id: 'text', delta: reply },
      { type: 'text-end', id: 'text' },
      { type: 'finish', finishReason: 'stop' },
    ];
    await route.fulfill({
      contentType: 'text/event-stream',
      headers: { 'x-vercel-ai-ui-message-stream': 'v1' },
      body: [...chunks.map((chunk) => `data: ${JSON.stringify(chunk)}`), 'data: [DONE]', ''].join(
        '\n\n',
      ),
    });
  });
  return methods;
}

async function openAssistant(page: Page, viewport: 'desktop' | 'mobile', label: string) {
  if (viewport === 'mobile') {
    const toggle = page.getByRole('button', { name: label, exact: true });
    await toggle.focus();
    await toggle.press('Enter');
  }
  await expect(page.locator('[data-assistant-island]')).toBeVisible();
  await expect(page.locator('#assistant-question')).toBeVisible();
}

function captureBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

for (const locale of LOCALES) {
  for (const viewport of ['desktop', 'mobile'] as const) {
    test(`enables Mota in ${locale.path === '/' ? 'Spanish' : 'English'} on ${viewport}`, async ({
      page,
    }) => {
      await page.setViewportSize(
        viewport === 'desktop' ? { width: 1440, height: 1000 } : { width: 390, height: 844 },
      );
      const browserErrors = captureBrowserErrors(page);
      const methods = await mockFlag(page, 200, true, locale.reply);

      await page.goto(locale.path);
      await expect(page.locator('portfolio-desktop')).toHaveAttribute('data-assistant-flag', '');
      await expect(page.locator('portfolio-desktop')).toHaveAttribute(
        'data-assistant',
        viewport === 'desktop' ? 'open' : 'minimized',
      );
      await openAssistant(page, viewport, locale.label);
      const question = page.locator('#assistant-question');
      await question.fill(locale.prompt);
      await question.press('Enter');
      await expect(page.getByRole('log')).toContainText(locale.reply);
      expect(methods).toContain('GET');
      expect(methods.filter((method) => method === 'POST')).toHaveLength(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      expect(browserErrors).toEqual([]);
    });

    test(`keeps Mota unavailable in ${locale.path === '/' ? 'Spanish' : 'English'} on ${viewport}`, async ({
      page,
    }) => {
      await page.setViewportSize(
        viewport === 'desktop' ? { width: 1440, height: 1000 } : { width: 390, height: 844 },
      );
      const browserErrors = captureBrowserErrors(page);
      const methods = await mockFlag(page, 200, false, '');

      await page.goto(locale.path);
      await expect(page.locator('portfolio-desktop')).toHaveAttribute('data-assistant-flag', '');
      await expect(page.locator('portfolio-desktop')).toHaveAttribute('data-assistant', 'disabled');
      await expect(page.locator('[data-assistant-toggle]')).toBeHidden();
      await expect(page.locator('[data-assistant-island]')).toBeHidden();
      await expect(page.locator('[data-desktop-content]')).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await expect.poll(() => methods.includes('GET')).toBe(true);
      expect(methods).toContain('GET');
      expect(methods).not.toContain('POST');
      expect(browserErrors).toEqual([]);
    });
  }

  test(`fails closed in ${locale.path === '/' ? 'Spanish' : 'English'} when flag lookup fails`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const browserErrors = captureBrowserErrors(page);
    const methods = await mockFlag(page, 503, false, '');
    await page.goto(locale.path);
    await expect(page.locator('portfolio-desktop')).toHaveAttribute('data-assistant-flag', '');
    await expect(page.locator('portfolio-desktop')).toHaveAttribute('data-assistant', 'disabled');
    await expect(page.locator('[data-assistant-toggle]')).toBeHidden();
    await expect(page.locator('[data-assistant-island]')).toBeHidden();
    await expect(page.locator('[data-desktop-content]')).toBeVisible();
    await expect(page.locator('#assistant-question')).toBeHidden();
    await expect.poll(() => methods.includes('GET')).toBe(true);
    expect(methods).toContain('GET');
    expect(methods).not.toContain('POST');
    expect(browserErrors).toEqual([
      'Failed to load resource: the server responded with a status of 503 (Service Unavailable)',
    ]);
  });
}
