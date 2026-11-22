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

for (const path of ['/', '/en']) {
  test(`${path} profile social feedback keeps the link hit area stable`, async ({ page }) => {
    await page.goto(path);

    for (const name of ['GitHub', 'LinkedIn', 'X · @alexmiira']) {
      const link = page.locator('.profile-card-social').getByRole('link', { name, exact: true });
      const icon = link.locator('svg');
      const box = await link.boundingBox();
      const defaultColor = await icon.evaluate((element) => getComputedStyle(element).color);

      await link.hover();
      await expect(icon).not.toHaveCSS('color', defaultColor);
      await expect(icon).not.toHaveCSS('transform', 'none');
      expect(await link.boundingBox()).toEqual(box);

      await page.mouse.down();
      await expect(icon).toHaveCSS('transform', 'matrix(0.92, 0, 0, 0.92, 0, 0)');
      await page.mouse.move(0, 0);
      await page.mouse.up();
    }
  });
}

test('profile social feedback respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const link = page.locator('.profile-card-social').getByRole('link', { name: 'GitHub', exact: true });
  const icon = link.locator('svg');
  const defaultColor = await icon.evaluate((element) => getComputedStyle(element).color);

  await link.hover();
  await expect(icon).not.toHaveCSS('color', defaultColor);
  await expect(icon).toHaveCSS('transform', 'none');
  await page.mouse.down();
  await expect(icon).toHaveCSS('transform', 'none');
  await page.mouse.move(0, 0);
  await page.mouse.up();
});
