// ABOUTME: Checks portfolio keyboard focus, compact navigation, and profile hierarchy.
// ABOUTME: Verifies share imagery for the Spanish and English profile pages.
import { expect, test } from '@playwright/test';

for (const locale of [
  { path: '/', experience: 'Experiencia' },
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
    await expect(brand).toHaveCSS('transition-property', 'color');

    for (const name of ['Español', 'English']) {
      const link = header.getByRole('link', { name, exact: true });
      const box = await link.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
      await link.focus();
      await expect(link).toHaveCSS('outline-width', '3px');
      await expect(link).toHaveCSS('transition-duration', '0s');
    }

    await header.getByRole('link', { name: locale.experience, exact: true }).click();
    await expect(page).toHaveURL(/#about$/);
    await expect(page.locator('#experience-title')).toBeInViewport();

    const image = page.locator('meta[property="og:image"]');
    const url = new URL((await image.getAttribute('content'))!);
    expect(url.hostname).toBe('alejandromira.com');
    const response = await request.get(new URL(url.pathname, page.url()).href);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/jpeg');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary');
  });
}

test.describe('compact mobile navigation', () => {
  test.use({ viewport: { width: 320, height: 400 }, hasTouch: true, isMobile: true });

  test('keeps menu controls large and the last link reachable on a short viewport', async ({
    page,
  }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /^(Abrir|Cerrar) menú$/ });
    const box = await toggle.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);

    await toggle.press('Enter');
    await expect(toggle).toHaveCSS('outline-width', '3px');
    const panel = page.locator('#mobile-nav');
    await expect(panel).toBeVisible();
    const dimensions = await panel.evaluate(({ clientHeight, scrollHeight }) => ({
      clientHeight,
      scrollHeight,
    }));
    expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight);

    const cv = panel.getByRole('link', { name: /Descargar CV/ });
    await cv.focus();
    await expect(cv).toBeInViewport({ ratio: 0.95 });
    await expect(cv).toHaveCSS('outline-width', '3px');
  });
});

test('aligns the paired profile sections and keeps their subheadings consistent', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');
  const columns = [
    '.profile-distribution',
    '.credentials-grid > section:nth-child(2)',
    '.personal-grid > li:nth-child(2)',
  ];
  const positions = await Promise.all(
    columns.map(async (selector) => (await page.locator(selector).boundingBox())!.x),
  );
  expect(new Set(positions).size).toBe(1);
  const sizes = await page
    .locator('.portfolio-section h3')
    .evaluateAll((headings) => headings.map((heading) => getComputedStyle(heading).fontSize));
  expect(new Set(sizes).size).toBe(1);
  await expect(page.locator('a.portfolio-contact-email')).toHaveCSS(
    'background-color',
    'rgb(255, 247, 238)',
  );
});

test('loads Inter for both languages and fits the main routes at 320 pixels', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });

  for (const route of ['/', '/en/', '/work', '/en/work', '/work/glio-ia', '/en/work/glio-ia']) {
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
      };
    });
    expect(metrics, route).toEqual({ fontLoaded: true, width: 320 });
  }

  const italicLoaded = await page.evaluate(async () => {
    const faces = await document.fonts.load('italic 400 16px "Inter Variable"', 'Análisis');
    return faces.some((face) => face.status === 'loaded' && face.style === 'italic');
  });
  expect(italicLoaded).toBe(true);
});
