// ABOUTME: Covers the localized catalogue-to-assistant-to-case round trip.
// ABOUTME: Checks that the query, type and pane scroll survive each return action.
import { expect, test } from '@playwright/test';

for (const locale of [
  {
    prefix: '',
    assistant: 'Asistente',
    ask: '¿Qué ha hecho en IA médica?',
    caseLink: 'Leer el caso GLIO-IA',
    back: 'Volver a proyectos',
    close: 'Cerrar pestaña activa',
  },
  {
    prefix: '/en',
    assistant: 'Assistant',
    ask: 'What has Alex built in medical AI?',
    caseLink: 'Read the GLIO-IA case study',
    back: 'Back to projects',
    close: 'Close active tab',
  },
]) {
  test(`returns from an assistant case to the same filtered catalogue in ${locale.prefix || 'es'}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 480 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const cataloguePath = locale.prefix + '/work';
    const filters = '?q=Python&type=ai';
    await page.goto(cataloguePath);
    const catalogue = page.locator('project-catalog');
    const search = catalogue.getByRole('searchbox');
    const type = catalogue.getByRole('combobox');
    const pane = page.locator('[data-desktop-content]');
    const assistant = page.getByRole('complementary', { name: locale.assistant });
    const readPosition = () => pane.evaluate((element) => element.scrollTop);

    await search.fill('Python');
    await type.selectOption('ai');
    await expect(page).toHaveURL(cataloguePath + filters);
    await assistant.getByRole('button', { name: locale.ask, exact: true }).click();
    const action = assistant.getByRole('link', { name: locale.caseLink, exact: true });

    for (const returnBy of ['link', 'browser', 'tab'] as const) {
      await pane.evaluate((element) => {
        element.scrollTop = 175;
      });
      const position = await readPosition();
      expect(position).toBeGreaterThan(100);
      await action.click();
      await expect(page).toHaveURL(cataloguePath + '/glio-ia' + filters);

      if (returnBy === 'link') {
        await page.getByRole('link', { name: locale.back, exact: true }).click();
      } else if (returnBy === 'browser') {
        await page.goBack();
      } else {
        await page.getByRole('button', { name: locale.close, exact: true }).click();
      }

      await expect(page).toHaveURL(cataloguePath + filters);
      await expect(search).toHaveValue('Python');
      await expect(type).toHaveValue('ai');
      await expect.poll(readPosition).toBe(position);
      await expect(action).toBeVisible();
    }
  });

  test(`indexes the personal project in ${locale.prefix || 'es'}`, async ({ page }) => {
    await page.goto(locale.prefix + '/work');
    const catalogue = page.locator('project-catalog');
    const search = catalogue.getByRole('searchbox');
    const type = catalogue.getByRole('combobox');
    const health = catalogue.getByRole('link', { name: /HealthDashboard/ });
    await search.fill('HealthDashboard');
    await expect(catalogue.locator('[data-project-id]:visible')).toHaveCount(1);
    await expect(health).toHaveAttribute('href', 'https://github.com/almiab1/HealthDashboard');
    await type.selectOption('ai');
    await expect(catalogue.locator('[data-project-id]:visible')).toHaveCount(0);
    await expect(health).toBeHidden();
    await type.selectOption('web');
    await expect(health).toBeVisible();
  });
}
