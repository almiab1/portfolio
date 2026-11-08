// ABOUTME: Checks input-specific menu motion and arrow feedback in the portfolio.
// ABOUTME: Covers pointer, keyboard, and reduced-motion behavior in Chromium.
import { expect, test } from '@playwright/test';

test.describe('mobile menu', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('animates a touch opening and keeps keyboard activation immediate', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /(?:Abrir|Cerrar) menú/ });
    const panel = page.locator('#mobile-nav');

    await toggle.tap();
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('data-menu-entry', 'pointer');
    await expect(panel).toHaveCSS('transition-property', 'opacity, transform');
    await expect(panel).toHaveCSS('transition-duration', '0.18s, 0.18s');
    await toggle.tap();
    await expect(panel).toHaveCount(0);

    await toggle.press('Enter');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('data-menu-entry', 'keyboard');
    await expect(panel).toHaveCSS('transition-duration', '0s');
    await expect(toggle).toBeFocused();
    await toggle.press('Space');
    await expect(panel).toHaveCount(0);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await toggle.tap();
    await expect(panel).toHaveCSS('transition-property', 'opacity');
    await expect(panel).toHaveCSS('transition-duration', '0.08s');
    await expect(panel).toHaveCSS('transform', 'none');
  });
});

test('hover nudges only the directional arrows and uses opacity with reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const career = page.locator('.career-summary');
  const down = career.locator(':scope > svg');
  await career.hover();
  await expect(down).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 2)');

  await page.goto('/work');
  const row = page.locator('.catalogue-row').first();
  const arrow = row.locator('.catalogue-arrow');
  await row.hover();
  await expect(row).toHaveCSS('transform', 'none');
  await expect(arrow).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 2, -2)');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.mouse.move(0, 0);
  await expect(arrow).toHaveCSS('opacity', '0.85');
  await row.hover();
  await expect(arrow).toHaveCSS('opacity', '1');
  await expect(arrow).toHaveCSS('transform', 'none');
});
