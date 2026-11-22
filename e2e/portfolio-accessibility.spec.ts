// ABOUTME: Checks portfolio keyboard focus, compact navigation, and profile hierarchy.
// ABOUTME: Verifies share imagery for the Spanish and English profile pages.
import { expect, test } from '@playwright/test';

for (const locale of [
  { path: '/', experience: 'Trayectoria' },
  { path: '/en/', experience: 'Experience' },
]) {
  test(`keeps navigation visible and share imagery available on ${locale.path}`, async ({
    page,
    request,
  }) => {
    await page.goto(locale.path);
    const header = page.getByRole('banner');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const brand = header.getByRole('link', { name: 'Alejandro Mira', exact: true });
    await expect(brand).toBeFocused();
    await expect(brand).toHaveCSS('outline-style', 'solid');

    for (const name of ['Español', 'English']) {
      const link = header.getByRole('link', { name, exact: true });
      const box = await link.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
      await link.focus();
      await expect(link).toHaveCSS('outline-width', '3px');
      await expect(link).toHaveCSS('transition-duration', '0s');
    }

    await page
      .locator('.desktop-dock')
      .getByRole('link', { name: locale.experience, exact: true })
      .click();
    await expect(page).toHaveURL(/\/experience\/?$/);
    await expect(page.locator('#experience-title')).toBeInViewport();

    const image = page.locator('meta[property="og:image"]');
    const url = new URL((await image.getAttribute('content'))!);
    expect(url.hostname).toBe('www.alejandromira.com');
    const response = await request.get(new URL(url.pathname, page.url()).href);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/jpeg');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary');
  });
}

test.describe('compact mobile navigation', () => {
  test.use({ viewport: { width: 320, height: 400 }, hasTouch: true, isMobile: true });

  test('keeps the dock reachable and returns focus after minimizing', async ({ page }) => {
    await page.goto('/');
    const dock = page.locator('.desktop-dock');
    const toggle = dock.getByRole('button', { name: 'Asistente' });
    for (const item of await dock.locator(':is(a, button, summary):visible').all()) {
      const box = await item.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
      await expect(item).toBeInViewport();
    }

    await toggle.press('Enter');
    const minimize = page.getByRole('button', { name: 'Minimizar asistente' });
    await expect(minimize).toBeFocused();
    await expect(page.locator('#main-content')).toBeHidden();
    await minimize.press('Enter');
    await expect(toggle).toBeFocused();
    await expect(page.locator('#main-content')).toBeVisible();

    const more = dock.getByText('Más', { exact: true }).locator('..');
    const cv = dock.getByRole('link', { name: 'CV', exact: true });
    await expect(cv).toBeHidden();
    await more.press('Enter');
    await expect(cv).toBeInViewport();
    await cv.focus();
    await cv.press('Escape');
    await expect(more).toBeFocused();
    await expect(cv).toBeHidden();
    await more.press('Enter');
    await dock.getByRole('link', { name: 'Capacidades', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Capacidades', level: 1 })).toBeVisible();
    await more.press('Enter');
    await cv.press('Enter');
    await expect(page.getByRole('heading', { name: 'Currículum' })).toBeVisible();
  });
});

test('uses wide workspace space while keeping the profile and assistant bounded', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  const workspace = (await page.locator('.desktop-workspace').boundingBox())!;
  const profile = (await page.locator('.profile-card').boundingBox())!;
  const assistant = (await page.locator('.desktop-assistant').boundingBox())!;
  expect(workspace.width).toBeGreaterThan(1800);
  expect(profile.width).toBeLessThan(workspace.width);
  expect(assistant.width).toBeLessThanOrEqual(384);
  await page.goto('/contact');
  const contact = page.getByRole('main');
  await expect(contact).toHaveCSS('background-color', 'rgb(255, 250, 243)');
  const email = (await contact
    .getByRole('link', { name: 'miraabad.alejandro@gmail.com' })
    .boundingBox())!;
  const subject = (await contact
    .getByRole('textbox', { name: 'Asunto', exact: true })
    .boundingBox())!;
  expect(email.x + email.width).toBeLessThan(subject.x);
});

test('loads Inter for both languages and fits the main routes at 320 pixels', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });

  for (const route of [
    '/',
    '/en/',
    '/work',
    '/en/work',
    '/work/glio-ia',
    '/en/work/glio-ia',
    '/experience',
    '/skills',
    '/en/skills',
    '/contact',
    '/en/contact',
    '/en/cv',
  ]) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCSS(
      'font-family',
      /Inter Variable/,
    );
    const metrics = await page.evaluate(async () => {
      const faces = await document.fonts.load('760 36px "Inter Variable"', 'Formación e imágenes');
      return {
        fontLoaded: faces.some((face) => face.status === 'loaded'),
        width: document.documentElement.scrollWidth,
        panelFits: [...document.querySelectorAll('[data-desktop-content]')].every(
          (panel) => panel.scrollWidth <= panel.clientWidth + 1,
        ),
      };
    });
    expect(metrics, route).toEqual({ fontLoaded: true, width: 320, panelFits: true });
  }

  const italicLoaded = await page.evaluate(async () => {
    const faces = await document.fonts.load('italic 400 16px "Inter Variable"', 'Análisis');
    return faces.some((face) => face.status === 'loaded' && face.style === 'italic');
  });
  expect(italicLoaded).toBe(true);
});

test('keeps portfolio content and workspace controls usable at 200% text size', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });

  const routes = [
    '/',
    '/en/',
    '/contact',
    '/en/contact',
    '/experience',
    '/en/experience',
    '/skills',
    '/en/skills',
    '/work',
    '/en/work',
    '/work/neuroevolutionary-ai',
    '/en/work/neuroevolutionary-ai',
  ];

  for (const route of routes) {
    await page.goto(route);
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    await page.evaluate(() => document.fonts.ready);
    if (route.endsWith('/contact')) await expect(page.locator('.contact-form')).toBeVisible();

    const overflow = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const selectors = [
        '.desktop-menu-actions',
        '.desktop-window',
        '.desktop-dock > a',
        '.desktop-dock > button',
        '.desktop-dock > details',
        'main h1',
        '.profile-card-body',
        '.desktop-timeline .employer-link',
        '.capability',
        '.personal-card',
        '.catalogue-controls',
        '.contact-grid',
        '.contact-form',
        '.contact-form label',
        '.contact-form input',
        '.contact-form textarea',
        '.contact-form button',
        '[data-desktop-content]',
      ];
      return [...document.querySelectorAll<HTMLElement>(selectors.join(', '))]
        .filter((element) => element.getClientRects().length > 0)
        .filter((element) => {
          const { left, right } = element.getBoundingClientRect();
          return left < 0 || right > viewportWidth || element.scrollWidth > element.clientWidth + 1;
        })
        .map((element) => element.className);
    });
    expect(overflow, route).toEqual([]);

    const more = page.locator('.desktop-more');
    await more.locator('summary').press('Enter');
    const capabilities = more.getByRole('link', {
      name: route.startsWith('/en') ? 'Capabilities' : 'Capacidades',
      exact: true,
    });
    await expect(capabilities).toBeInViewport();
  }
});
