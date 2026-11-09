// ABOUTME: Checks the first screen at representative laptop browser sizes.
// ABOUTME: Keeps the profile flush with its pane and the project rows ahead of the controls.
import { expect, test } from '@playwright/test';

const LAPTOP_VIEWPORTS = [
  { width: 1024, height: 600 },
  { width: 1280, height: 650 },
  { width: 1366, height: 650 },
  { width: 1440, height: 780 },
];

for (const locale of [
  { prefix: '', search: 'Buscar proyectos', type: 'Tipo de proyecto' },
  { prefix: '/en', search: 'Search projects', type: 'Project type' },
]) {
  test(`fits the profile and catalogue in laptop panes on ${locale.prefix || '/'}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const viewport of LAPTOP_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto(locale.prefix + '/');
      const pane = page.locator('[data-desktop-content]');
      const profile = page.locator('.profile-card');
      const photo = profile.getByRole('img');
      const intro = profile.locator('.profile-card-body');
      for (const item of [
        profile.getByRole('heading', { level: 1 }),
        profile.locator('.profile-card-bio'),
        profile.locator('.desktop-current-role'),
        profile.locator('.profile-card-actions'),
        photo,
        page.locator('.assistant-composer input'),
        page.locator('.assistant-composer button'),
        page.locator('[data-assistant-minimize]'),
      ]) {
        await expect(item).toBeInViewport({ ratio: 0.98 });
      }

      const bounds = (await pane.boundingBox())!;
      const sheet = (await profile.boundingBox())!;
      const text = (await intro.boundingBox())!;
      const portrait = (await photo.boundingBox())!;
      expect(sheet.x).toBeCloseTo(bounds.x, 0);
      expect(sheet.width).toBeCloseTo(bounds.width, 0);
      expect(text.x + text.width).toBeLessThanOrEqual(portrait.x + 1);
      expect(text.width).toBeGreaterThan(portrait.width);
      expect(
        await pane.evaluate(({ clientWidth, scrollWidth }) => scrollWidth - clientWidth),
      ).toBeLessThanOrEqual(1);

      await page.goto(locale.prefix + '/work');
      const toolbar = page.locator('.catalogue-toolbar');
      const search = toolbar.getByRole('searchbox', { name: locale.search });
      const type = toolbar.getByRole('combobox', { name: locale.type });
      await expect(search).toBeEnabled();
      await expect(type).toBeEnabled();
      expect((await toolbar.boundingBox())!.height).toBeLessThanOrEqual(56);
      const rows = page.locator('.catalogue-row');
      for (let index = 0; index < 3; index++) {
        await expect(rows.nth(index)).toBeInViewport({ ratio: 0.98 });
      }
      expect(
        await pane.evaluate(({ clientWidth, scrollWidth }) => scrollWidth - clientWidth),
      ).toBeLessThanOrEqual(1);
    }
  });
}
