// ABOUTME: Checks the bilingual portfolio desktop as an app workspace.
// ABOUTME: Covers tab state, PDF editions, and the persistent simulated assistant.
import { expect, test } from '@playwright/test';

for (const lang of ['es', 'en'] as const) {
  const prefix = lang === 'en' ? '/en' : '';
  const projects = lang === 'en' ? 'Projects' : 'Proyectos';
  const career = lang === 'en' ? 'Experience' : 'Trayectoria';
  const close = lang === 'en' ? 'Close active tab' : 'Cerrar pestaña activa';

  test(`${lang} closes case tabs and restores the open project catalogue`, async ({ page }) => {
    await page.goto(prefix + '/');
    const dock = page.locator('.desktop-dock');
    const tabs = page.locator('[data-desktop-tabs]');
    await expect(tabs.getByRole('link')).toHaveCount(1);
    await dock.getByRole('link', { name: projects, exact: true }).click();
    const search = page.getByRole('searchbox');
    const type = page.getByRole('combobox');
    await search.fill('PyTorch');
    await type.selectOption('ai');
    await page
      .locator('project-catalog')
      .getByRole('link', { name: /GLIO-IA/ })
      .click();
    await expect(tabs.getByRole('link', { name: 'GLIO-IA', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await page.getByRole('button', { name: close }).click();
    await expect(tabs.getByRole('link', { name: 'GLIO-IA', exact: true })).toHaveCount(0);
    await expect(search).toHaveValue('PyTorch');
    await expect(type).toHaveValue('ai');
    await expect(tabs.getByRole('link', { name: projects, exact: true })).toBeFocused();

    await dock.getByRole('link', { name: career, exact: true }).click();
    const timeline = page.locator('.desktop-timeline');
    await expect(timeline.locator('time')).toHaveText(['2026', '2025', '2021']);
    await expect(timeline.getByRole('heading')).toHaveText(['GuruSup', 'CONVOTIS Iberia', 'AIJU']);
    await page.getByRole('button', { name: close }).click();
    await expect(tabs.getByRole('link', { name: career, exact: true })).toHaveCount(0);
    await expect(dock.getByRole('link', { name: career, exact: true })).toBeVisible();
    await expect(search).toHaveValue('PyTorch');
    await expect(type).toHaveValue('ai');
  });

  test(`${lang} previews and downloads both distinct CV editions`, async ({ page, request }) => {
    await page.goto(prefix + '/cv');
    const cv = page.locator('.desktop-cv');
    const bytes = [];
    for (const folder of ['esp', 'eng']) {
      const download = cv.locator(`a[download][href^="/cv/${folder}/"]`);
      const link = (await download.getAttribute('href'))!;
      const response = await request.get(link);
      expect(response.ok()).toBe(true);
      expect(response.headers()['content-type']).toContain('application/pdf');
      bytes.push(await response.body());
      const downloadEvent = page.waitForEvent('download');
      await download.click();
      expect((await downloadEvent).suggestedFilename()).toMatch(/\.pdf$/);
    }
    expect(bytes[0].equals(bytes[1])).toBe(false);

    for (const code of ['es', 'en']) {
      await cv.locator(`label[for="cv-${code}"]`).click();
      await expect(cv.locator(`#cv-${code}`)).toBeChecked();
      await expect(cv.locator(`[data-edition="${code}"] img`)).toBeVisible();
      await expect
        .poll(() =>
          cv
            .locator(`[data-edition="${code}"] img`)
            .evaluate((image: HTMLImageElement) => image.naturalWidth),
        )
        .toBeGreaterThan(0);
      await expect(cv.locator('.desktop-cv-preview:visible')).toHaveCount(1);
    }
  });
}

test('the desktop assistant retains chat and avatar when minimized and across app navigation', async ({
  page,
}) => {
  await page.goto('/');
  const assistant = page.getByRole('complementary', { name: 'Asistente' });
  const log = assistant.getByRole('log');
  await assistant.getByRole('button', { name: '¿Qué ha hecho en IA médica?' }).click();
  await expect(log).toContainText('En AIJU, Alex diseñó GLIO-IA');
  await log.getByRole('link', { name: 'Leer el caso GLIO-IA' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('GLIO-IA');
  await expect(log).toContainText('¿Qué ha hecho en IA médica?');

  await assistant.getByLabel('Personalizar avatar', { exact: true }).first().click();
  await assistant.getByRole('button', { name: 'Píxel', exact: true }).click();
  await expect(assistant.locator('.assistant-badge [data-avatar]')).toHaveAttribute(
    'data-avatar',
    'pixel',
  );
  await assistant.getByRole('button', { name: 'Minimizar asistente' }).click();
  await expect(assistant).toBeHidden();
  await page.locator('.desktop-dock').getByRole('button', { name: 'Asistente' }).click();
  await expect(log).toContainText('En AIJU, Alex diseñó GLIO-IA');
  await expect(assistant.locator('.assistant-badge [data-avatar]')).toHaveAttribute(
    'data-avatar',
    'pixel',
  );
  await page.reload();
  await expect(assistant.locator('.assistant-badge [data-avatar]')).toHaveAttribute(
    'data-avatar',
    'pixel',
  );
});

test('the mobile English assistant directs the user to a CV and keeps the thread', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 690 });
  await page.goto('/en/');
  const toggle = page.locator('.desktop-dock').getByRole('button', { name: 'Assistant' });
  const assistant = page.getByRole('complementary', { name: 'Assistant' });
  await expect(assistant).toBeHidden();
  await toggle.click();
  const input = assistant.getByRole('textbox', { name: 'Type a question' });
  await input.fill('Can I download the English CV?');
  await input.press('Enter');
  await assistant.getByRole('link', { name: 'View résumé' }).click();
  await expect(page).toHaveURL(/\/en\/cv\/?$/);
  await expect(assistant).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Résumé' })).toBeVisible();
  await toggle.click();
  await expect(assistant.getByRole('log')).toContainText('Can I download the English CV?');
});
