// ABOUTME: Verifies direct English route rendering and localized URL metadata.
// ABOUTME: Covers the English home, workspace pages, and every project detail route.
import { expect, test } from '@playwright/test';
import { readdirSync } from 'node:fs';

const SITE_URL = 'https://alejandromira.com';
const projectSlugs = readdirSync('src/content/projects/en')
  .filter((filename) => filename.endsWith('.mdx'))
  .map((filename) => filename.slice(0, -4));

const englishRoutes = [
  '/en',
  '/en/',
  '/en/work',
  '/en/experience',
  '/en/skills',
  '/en/cv',
  '/en/contact',
  ...projectSlugs.map((slug) => `/en/work/${slug}`),
];

for (const route of englishRoutes) {
  test(`${route} serves English content with localized metadata`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.ok()).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    const spanishPath = route.slice('/en'.length);
    const expectedEnglishUrl = `${SITE_URL}${route.replace(/\/$/, '')}/`;
    const expectedSpanishUrl = `${SITE_URL}${spanishPath.replace(/\/$/, '')}/`;
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', expectedEnglishUrl);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      'href',
      expectedEnglishUrl,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute(
      'href',
      expectedSpanishUrl,
    );

    const heading = await page.getByRole('heading', { level: 1 }).innerText();
    expect(heading.trim().length).toBeGreaterThan(0);
    if (route === '/en/experience') expect(heading).toContain('Professional experience');
    if (route === '/en/contact') expect(heading).toContain('Contact');
  });
}

test('switches language from an English project detail to its Spanish translation', async ({
  page,
}) => {
  await page.goto('/en/work/cookobot');
  await page.getByRole('link', { name: 'Español', exact: true }).click();
  await expect(page).toHaveURL(/\/work\/cookobot\/?$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Cookobot');
});
