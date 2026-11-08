// ABOUTME: Checks shared project visuals and localized catalogue statistics.
// ABOUTME: Exercises the case outline, reading progress, and reduced-motion behavior.
import { expect, test } from '@playwright/test';

for (const locale of [
  { prefix: '', chart: 'Proyectos por tipo', outline: 'En esta ficha' },
  { prefix: '/en', chart: 'Projects by type', outline: 'On this page' },
]) {
  test(`shares the artwork and published project counts in ${locale.prefix ? 'English' : 'Spanish'}`, async ({
    page,
  }) => {
    await page.goto(`${locale.prefix}/`);
    const chart = page.getByRole('region', { name: locale.chart });
    await expect(chart).toBeVisible();
    const chartCounts = await chart
      .getByRole('listitem')
      .evaluateAll((items) =>
        Object.fromEntries(
          items.map((item) => [
            item.getAttribute('data-project-type'),
            Number(item.querySelector('strong')?.textContent),
          ]),
        ),
      );

    await page.goto(`${locale.prefix}/work`);
    const rows = page.locator('[data-project-id]');
    const types = await rows.evaluateAll((items) =>
      items.map((item) => item.getAttribute('data-type')!),
    );
    const catalogueCounts = types.reduce<Record<string, number>>((counts, type) => {
      counts[type] = (counts[type] ?? 0) + 1;
      return counts;
    }, {});
    expect(chartCounts).toEqual(catalogueCounts);

    const row = page.locator(`[data-case-path="${locale.prefix}/work/cookobot"]`);
    const thumbnail = row.locator('[data-visual-kind="illustration"] img');
    const artworkUrl = await thumbnail.getAttribute('src');
    expect(artworkUrl).toBeTruthy();
    await row.click();
    const cover = page.locator('.case-cover [data-visual-kind="illustration"] img');
    await expect(cover).toHaveAttribute('src', artworkUrl!);
    await expect
      .poll(() => cover.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);

    const outline = page.getByRole('navigation', { name: locale.outline });
    const section = outline.getByRole('link').first();
    const target = await section.getAttribute('href');
    expect(target).toMatch(/^#.+/);
    await section.click();
    await expect.poll(() => decodeURIComponent(new URL(page.url()).hash)).toBe(target);
    await expect(page.locator(target!)).toBeInViewport();
  });
}

test('draws the project flow and tracks reading progress only with motion enabled', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/work/glio-ia');

  const progress = page.locator('.case-progress');
  const flow = page.locator('.case-cover [data-flow]').first();
  await expect(flow).toHaveCSS('animation-name', 'project-flow-draw');
  await expect(progress).toHaveCSS('animation-name', 'project-read-progress');
  await expect(progress).toHaveCSS('transform', 'matrix(0, 0, 0, 1, 0, 0)');
  await page.getByRole('navigation', { name: 'En esta ficha' }).getByRole('link').last().click();
  await expect
    .poll(() =>
      progress.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a),
    )
    .toBeGreaterThan(0.3);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(progress).toBeHidden();
  await expect(flow).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.case-cover .project-visual')).toHaveCSS('animation-name', 'none');
});
