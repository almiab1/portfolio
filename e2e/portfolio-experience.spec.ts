// ABOUTME: Checks official organization marks and programme links on the experience page.
// ABOUTME: Covers the bilingual routes at a phone-width viewport.
import { expect, test } from '@playwright/test';

for (const locale of [
  { lang: 'es', prefix: '', education: 'Formación', bachelorPath: '' },
  { lang: 'en', prefix: '/en', education: 'Education', bachelorPath: 'indexi.html' },
]) {
  test(`shows employers and links to the official degrees in ${locale.lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(`${locale.prefix}/experience`);
    const main = page.getByRole('main');

    for (const [company, es, en] of [
      ['GuruSup', 'https://gurusup.com/es', 'https://gurusup.com/'],
      ['CONVOTIS Iberia', 'https://www.convotis.com/es/', 'https://www.convotis.com/en/'],
      ['AIJU', 'https://www.aiju.es/', 'https://www.aiju.es/en/'],
    ]) {
      const link = main.getByRole('heading', { name: company, level: 2 }).getByRole('link');
      await expect(link).toHaveAttribute('href', locale.lang === 'es' ? es : en);
      await expect(link.locator('img')).toBeVisible();
    }

    const education = main.getByRole('region', { name: locale.education });
    const degreeLinks = education.getByRole('heading', { level: 3 }).getByRole('link');
    await expect(degreeLinks).toHaveCount(2);
    await expect(degreeLinks.nth(0)).toHaveAttribute(
      'href',
      `https://www.uimp.es/postgrado/estudios/fichaestudio.php?any=2026-27&lan=${locale.lang}&plan=P04C&verasi=N`,
    );
    await expect(degreeLinks.nth(1)).toHaveAttribute(
      'href',
      `https://www.upv.es/titulaciones/GTI/${locale.bachelorPath}`,
    );

    const headings = main.locator('h2.organization-name, h3.organization-name');
    for (const width of [320, 1575]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(headings).toHaveCount(5);
      for (const heading of await headings.all()) {
        const mark = await heading.locator('img').boundingBox();
        const title = await heading.locator('.employer-link span, .degree-link').boundingBox();
        expect(mark!.x + mark!.width).toBeLessThan(title!.x);
        expect(Math.abs(mark!.y + mark!.height / 2 - title!.y - title!.height / 2)).toBeLessThan(2);
      }
    }
    const marks = main.locator('img.organization-mark');
    await expect(marks).toHaveCount(5);
    for (const mark of await marks.all()) {
      await expect(mark).toHaveAttribute('alt', '');
      await expect(mark).toBeVisible();
      await expect
        .poll(() =>
          mark.evaluate((image: HTMLImageElement) => {
            const source = new URL(image.currentSrc);
            const bundled =
              source.origin === location.origin || source.href.startsWith('data:image/');
            return bundled && image.complete && image.naturalWidth > 0;
          }),
        )
        .toBe(true);
    }
  });
}
