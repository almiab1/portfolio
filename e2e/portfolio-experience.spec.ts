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

    for (const company of ['GuruSup', 'CONVOTIS Iberia', 'AIJU']) {
      await expect(main.getByRole('heading', { name: company, level: 2 })).toBeVisible();
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
