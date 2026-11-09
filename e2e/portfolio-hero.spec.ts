// ABOUTME: Checks the compact professional profile on phone and desktop viewports.
// ABOUTME: Verifies that profile navigation leads to the distinct bilingual apps.
import { expect, test } from '@playwright/test';

for (const locale of [
  {
    home: '/',
    prefix: '',
    role: 'Ingeniero de IA y software',
    portrait: 'Retrato de Alejandro Mira',
    experience: 'Ver trayectoria',
    skills: 'Ver habilidades',
    cv: 'Ver currículum',
  },
  {
    home: '/en/',
    prefix: '/en',
    role: 'AI and software engineer',
    portrait: 'Portrait of Alejandro Mira',
    experience: 'View experience',
    skills: 'View skills',
    cv: 'View résumé',
  },
]) {
  test(`presents a compact professional introduction on ${locale.home}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto(locale.home);
    const profile = page.getByRole('region', { name: 'Alejandro Mira.', exact: true });
    const experience = profile.getByRole('link', { name: locale.experience });
    const skills = profile.getByRole('link', { name: locale.skills });
    const cv = profile.getByRole('link', { name: locale.cv });
    const portrait = profile.getByRole('img', { name: locale.portrait });
    for (const item of [
      profile.getByRole('heading', { level: 1 }),
      profile.getByText(locale.role, { exact: true }),
      profile.locator('.profile-card-bio'),
      profile.locator('.desktop-current-role'),
      portrait,
      experience,
      skills,
      cv,
    ]) {
      await expect(item).toBeInViewport({ ratio: 0.98 });
    }
    await expect(profile.locator('.desktop-current-role')).toContainText('GuruSup');
    await expect
      .poll(() => portrait.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
    await expect(page.getByRole('main').locator('section')).toHaveCount(1);

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1000 },
    ]) {
      await page.setViewportSize(viewport);
      await expect(profile).toBeInViewport({ ratio: 0.98 });
    }

    await experience.click();
    await expect(page).toHaveURL(
      (url) => url.pathname.replace(/\/$/, '') === locale.prefix + '/experience',
    );
    await expect(page.locator('.desktop-timeline')).toBeVisible();
    await expect(page.locator('.skill-app-grid')).toHaveCount(0);
    await page.goBack();
    await skills.click();
    await expect(page.locator('.skill-app-grid > li')).toHaveCount(3);
    await expect(page.locator('#education-title')).toBeVisible();
    await expect(
      page.locator('.skill-app-grid').getByRole('link', { name: /GLIO-IA/ }),
    ).toHaveAttribute('href', /\/work\/glio-ia\/?$/);
    await page.goBack();
    await cv.click();
    await expect(page.locator('.desktop-cv')).toBeVisible();
  });
}
