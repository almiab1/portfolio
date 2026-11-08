// ABOUTME: Checks localized catalogue search and return paths in the production routes.
// ABOUTME: Verifies shareable filters through browser Back, case links, and language changes.
import { test, expect } from '@playwright/test';

for (const config of [
  {
    home: '/',
    catalogue: '/work',
    detail: '/work/glio-ia',
    projects: 'Proyectos',
    search: 'Buscar proyectos',
    type: 'Tipo de proyecto',
    one: '1 proyecto',
    none: '0 proyectos',
    clear: 'Limpiar filtros',
    back: 'Volver a proyectos',
    language: 'English',
    alternate: '/en/work',
    alternateSearch: 'Search projects',
  },
  {
    home: '/en',
    catalogue: '/en/work',
    detail: '/en/work/glio-ia',
    projects: 'Projects',
    search: 'Search projects',
    type: 'Project type',
    one: '1 project',
    none: '0 projects',
    clear: 'Clear filters',
    back: 'Back to projects',
    language: 'Español',
    alternate: '/work',
    alternateSearch: 'Buscar proyectos',
  },
]) {
  test(`${config.catalogue} restores filters after a case and keeps them across languages`, async ({
    page,
  }) => {
    await page.goto(config.home);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Alejandro Mira.');
    await expect(page.getByRole('heading', { name: 'GuruSup', exact: true })).toBeVisible();
    await page
      .getByRole('navigation')
      .getByRole('link', { name: config.projects, exact: true })
      .filter({ visible: true })
      .click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(config.projects);
    const all = page.locator('[data-project-id]');
    const total = await all.count();
    expect(total).toBeGreaterThan(1);

    const search = page.getByRole('searchbox', { name: config.search });
    const type = page.getByRole('combobox', { name: config.type });
    const results = page.getByRole('status');
    await search.fill('PyTorch');
    await type.selectOption('iot');
    await expect(results).toHaveText(config.none);
    await type.selectOption('ai');
    await expect(results).toHaveText(config.one);
    const filteredUrl = `${config.catalogue}?q=PyTorch&type=ai`;
    await expect(page).toHaveURL((url) => url.pathname + url.search === filteredUrl);

    const caseLink = page.getByRole('link', { name: /GLIO-IA/ });
    await caseLink.click();
    await expect(page).toHaveURL(
      (url) => url.pathname + url.search === `${config.detail}?q=PyTorch&type=ai`,
    );
    await page.getByRole('link', { name: config.back, exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname + url.search === filteredUrl);
    await expect(search).toHaveValue('PyTorch');
    await expect(type).toHaveValue('ai');

    await caseLink.click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('GLIO-IA');
    await page.goBack();
    await expect(search).toHaveValue('PyTorch');
    await expect(type).toHaveValue('ai');

    await page
      .getByRole('link', { name: config.language, exact: true })
      .filter({ visible: true })
      .click();
    await expect(page).toHaveURL(
      (url) => url.pathname + url.search === `${config.alternate}?q=PyTorch&type=ai`,
    );
    await expect(page.getByRole('searchbox', { name: config.alternateSearch })).toHaveValue(
      'PyTorch',
    );

    await page.goBack();
    await page.getByRole('button', { name: config.clear }).click();
    await expect(search).toBeFocused();
    await expect(all.filter({ visible: true })).toHaveCount(total);
    await expect(page).toHaveURL((url) => url.pathname === config.catalogue && !url.search);
  });
}

test('a direct case visit returns to the unfiltered catalogue', async ({ page }) => {
  await page.goto('/work/cookobot');
  const back = page.getByRole('link', { name: 'Volver a proyectos', exact: true });
  await expect(back).toHaveAttribute('href', '/work');
  await back.click();
  await expect(page.getByRole('searchbox')).toHaveValue('');
  await expect(page.getByRole('combobox')).toHaveValue('');
});
