// ABOUTME: E2E checks that the hero social links render their brand icons in both locales.
// ABOUTME: Guards the local GitHub/LinkedIn icon components that replace lucide brand icons.
import { test, expect } from '@playwright/test';

for (const path of ['/', '/en']) {
  test(`${path} hero shows GitHub and LinkedIn icons`, async ({ page }) => {
    await page.goto(path);

    for (const [name, iconClass] of [
      ['GitHub', 'lucide-github'],
      ['LinkedIn', 'lucide-linkedin'],
    ]) {
      const link = page.getByRole('link', { name, exact: true }).first();
      await expect(link).toBeVisible();
      const icon = link.locator(`svg.${iconClass}`);
      await expect(icon).toBeVisible();
      const box = await icon.boundingBox();
      expect(box?.width).toBeGreaterThan(0);
    }
  });
}
