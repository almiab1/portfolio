// ABOUTME: E2E checks for the project filter island on the work pages.
// ABOUTME: Verifies text search and tag selection hide and restore the server-rendered cards.
import { test, expect } from '@playwright/test';

const cards = '[data-project-id]';

test.describe('project filter', () => {
  test('search narrows the visible cards and clearing restores them', async ({ page }) => {
    await page.goto('/work');
    const all = page.locator(cards);
    const total = await all.count();
    expect(total).toBeGreaterThan(1);

    const search = page.getByRole('textbox');
    await search.fill('cookobot');
    await expect(page.locator(`${cards}:visible`)).toHaveCount(1);
    await expect(page.locator('[data-project-id="es/cookobot"]')).toBeVisible();

    await search.fill('');
    await expect(page.locator(`${cards}:visible`)).toHaveCount(total);
  });

  test('selecting a tag shows only projects with that tag', async ({ page }) => {
    await page.goto('/en/work');
    const total = await page.locator(cards).count();

    await page.getByRole('button', { name: 'Robotics', exact: true }).click();
    const visible = page.locator(`${cards}:visible`);
    await expect(visible).not.toHaveCount(total);
    await expect(page.locator('[data-project-id="en/cookobot"]')).toBeVisible();
  });
});
