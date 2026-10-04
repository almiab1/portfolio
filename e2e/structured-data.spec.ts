// ABOUTME: E2E checks that every page type ships parseable JSON-LD structured data.
// ABOUTME: Guards against JSON-LD rendering as literal template text instead of JSON.
import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/', types: ['Person', 'WebSite'] },
  { path: '/en', types: ['Person', 'WebSite'] },
  { path: '/work/cookobot', types: ['CreativeWork'] },
  { path: '/en/work/cookobot', types: ['CreativeWork'] },
];

for (const { path, types } of PAGES) {
  test(`${path} ships valid JSON-LD`, async ({ page }) => {
    await page.goto(path);
    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => nodes.map((n) => n.textContent ?? ''));

    expect(blocks.length).toBeGreaterThan(0);
    const parsed = blocks.map((text) => JSON.parse(text) as { '@type'?: string });
    const found = parsed.map((p) => p['@type']);
    for (const type of types) expect(found).toContain(type);
  });
}
