// ABOUTME: Checks shared project visuals and localized catalogue statistics.
// ABOUTME: Exercises the case outline, reading progress, and reduced-motion behavior.
import { expect, test } from '@playwright/test';

for (const locale of [
  {
    prefix: '',
    chart: 'Proyectos por tipo',
    outline: 'En esta ficha',
    flow: 'Flujo de datos de GLIO-IA',
    inputs: ['Datos clínicos', 'Imágenes médicas', 'Datos ómicos'],
  },
  {
    prefix: '/en',
    chart: 'Projects by type',
    outline: 'On this page',
    flow: 'GLIO-IA data flow',
    inputs: ['Clinical data', 'Medical images', 'Omics data'],
  },
]) {
  test(`shares the artwork and published project counts in ${locale.prefix ? 'English' : 'Spanish'}`, async ({
    page,
  }) => {
    await page.goto(`${locale.prefix}/work`);
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

    const rows = page.locator('[data-project-id]');
    const types = await rows.evaluateAll((items) =>
      items.map((item) => item.getAttribute('data-type')!),
    );
    const catalogueCounts = types.reduce<Record<string, number>>((counts, type) => {
      counts[type] = (counts[type] ?? 0) + 1;
      return counts;
    }, {});
    expect(chartCounts).toEqual(catalogueCounts);

    await expect(page.getByRole('link', { name: /HealthDashboard/ })).toBeVisible();
    await chart.locator('[data-project-type="ai"] a').click();
    await expect(page).toHaveURL(/\/work\?type=ai$/);
    await expect(page.locator('select[name="type"]')).toHaveValue('ai');
    await expect(rows.filter({ visible: true })).toHaveCount(catalogueCounts.ai);
    await expect(rows.filter({ visible: true }).and(page.locator('[data-type="ai"]'))).toHaveCount(
      catalogueCounts.ai,
    );

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
    await expect(section).toHaveAttribute('aria-current', 'location');
    await expect(outline.locator('..')).toHaveCSS('position', 'sticky');
    await expect(outline).toBeInViewport();

    await page
      .locator('[data-desktop-content]')
      .evaluate((element) => element.scrollTo(0, element.scrollHeight));
    await expect(outline.getByRole('link').last()).toHaveAttribute('aria-current', 'location');
    await expect(outline.locator('[aria-current="location"]')).toHaveCount(1);
    await expect.poll(() => decodeURIComponent(new URL(page.url()).hash)).toBe(target);

    await page.goto(`${locale.prefix}/work/glio-ia`);
    const diagram = page.getByRole('figure', { name: locale.flow });
    await expect(diagram.getByRole('listitem')).toHaveText(locale.inputs);
  });
}

test('draws the project flow and tracks reading progress only with motion enabled', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 280 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/work/glio-ia');

  const progress = page.locator('.case-progress');
  const diagram = page.locator('glio-flow');
  const flow = diagram.locator('[data-flow]').first();
  await expect(progress).toHaveCSS('animation-name', 'project-read-progress');
  await expect(progress).toHaveCSS('transform', 'matrix(0, 0, 0, 1, 0, 0)');
  await expect(diagram).toHaveAttribute('data-awaiting', '');
  await expect(flow).toHaveCSS('animation-name', 'none');
  await flow.evaluate((path) => {
    let starts = 0;
    path.addEventListener('animationstart', () =>
      path.setAttribute('data-starts', String(++starts)),
    );
  });
  await diagram.scrollIntoViewIfNeeded();
  await expect(diagram).toHaveAttribute('data-draw', '');
  await expect(flow).toHaveCSS('animation-name', 'project-flow-draw');
  await expect(flow).toHaveAttribute('data-starts', '1');
  await expect(flow).toHaveCSS('stroke-dashoffset', '0px');
  await page.locator('[data-desktop-content]').evaluate((element) => element.scrollTo(0, 0));
  await expect(diagram).not.toBeInViewport();
  await diagram.scrollIntoViewIfNeeded();
  await expect(flow).toHaveCSS('stroke-dashoffset', '0px');
  await expect(flow).toHaveAttribute('data-starts', '1');
  await page.getByRole('navigation', { name: 'En esta ficha' }).getByRole('link').last().click();
  await expect
    .poll(() =>
      progress.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a),
    )
    .toBeGreaterThan(0.3);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(progress).toBeHidden();
  await expect(flow).toHaveCSS('animation-name', 'none');
  await page.reload();
  await expect(diagram).not.toHaveAttribute('data-awaiting');
  await expect(diagram).not.toHaveAttribute('data-draw');
  await expect(flow).toHaveCSS('stroke-dashoffset', '0px');
});
