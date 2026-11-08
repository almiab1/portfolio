// ABOUTME: Checks app transitions and arrow feedback in the portfolio.
// ABOUTME: Covers pointer, keyboard, and reduced-motion behavior in Chromium.
import { expect, test } from '@playwright/test';

test('moves between apps and opens the assistant with reduced-motion support', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const dock = page.locator('.desktop-dock');
  const toggle = dock.getByRole('button', { name: 'Asistente' });
  const panel = page.getByRole('complementary', { name: 'Asistente' });
  await toggle.click();
  await expect(panel).toBeVisible();
  await expect(panel).toHaveCSS('animation-name', 'desktop-app-enter');
  await panel.getByRole('button', { name: 'Minimizar asistente' }).click();

  await dock.getByRole('link', { name: 'Proyectos', exact: true }).click();
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Proyectos');
  await expect(main).toHaveCSS('animation-name', 'desktop-app-enter');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(main).toHaveCSS('animation-name', 'none');
  await toggle.click();
  await expect(panel).toHaveCSS('animation-name', 'none');
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
