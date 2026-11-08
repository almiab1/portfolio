// ABOUTME: Checks that the opening identifies Alex and his work at mobile and desktop sizes.
// ABOUTME: Verifies that the hero links lead to the localized catalogue and featured case.
import { expect, test } from '@playwright/test';

for (const locale of [
  {
    home: '/',
    work: '/work',
    role: 'Ingeniero de IA y software',
    specialty: 'Desarrollo agentes de IA para atención al cliente.',
    portrait: 'Retrato de Alejandro Mira',
    projects: 'Ver proyectos',
  },
  {
    home: '/en/',
    work: '/en/work',
    role: 'AI and software engineer',
    specialty: 'I build AI agents for customer support.',
    portrait: 'Portrait of Alejandro Mira',
    projects: 'View projects',
  },
]) {
  test(`presents a complete professional introduction on ${locale.home}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto(locale.home);
    const hero = page.getByRole('region', { name: 'Alejandro Mira.', exact: true });
    const projects = hero.getByRole('link', { name: locale.projects, exact: true });

    for (const item of [
      hero.getByRole('heading', { level: 1 }),
      hero.getByText(locale.role, { exact: true }),
      hero.getByText(locale.specialty, { exact: true }),
      hero.getByText(/GuruSup.*(?:producción|production)/),
      projects,
    ]) {
      await expect(item).toBeInViewport({ ratio: 1 });
    }
    const portrait = hero.getByRole('img', { name: locale.portrait });
    await expect(portrait).toBeInViewport({ ratio: 0.99 });
    await expect
      .poll(() => portrait.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);

    const experience = hero.getByRole('link', { name: /GuruSup.*CONVOTIS Iberia.*AIJU/ });
    const featured = hero.getByRole('link', { name: /GLIO-IA/ });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(projects).toBeInViewport({ ratio: 1 });
    await experience.scrollIntoViewIfNeeded();
    await expect(experience).toBeInViewport({ ratio: 1 });
    await featured.scrollIntoViewIfNeeded();
    await expect(featured).toBeInViewport({ ratio: 0.99 });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('[data-desktop-content]').evaluate((element) => element.scrollTo(0, 0));
    await expect(experience).toBeInViewport({ ratio: 1 });
    await expect(featured).toBeInViewport({ ratio: 1 });
    await expect(experience).toHaveAttribute('href', /\/experience\/?$/);

    await featured.click();
    await expect(page).toHaveURL(`${locale.work}/glio-ia`);
    await expect(page.getByRole('heading', { name: 'GLIO-IA', level: 1 })).toBeVisible();
    await page.goBack();
    await projects.click();
    await expect(page).toHaveURL(locale.work);
    await expect(page.locator('project-catalog')).toBeVisible();
  });
}
