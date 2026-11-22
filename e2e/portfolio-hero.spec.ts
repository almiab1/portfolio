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
    skills: 'Ver capacidades',
    capabilities: 'Capacidades',
    capabilityTitles: [
      'Ingeniería de agentes de IA',
      'Ingeniería de software y producto',
      'Evaluación de sistemas de IA',
    ],
    education: 'Formación',
    cv: 'Ver currículum',
  },
  {
    home: '/en/',
    prefix: '/en',
    role: 'AI and software engineer',
    portrait: 'Portrait of Alejandro Mira',
    experience: 'View experience',
    skills: 'View capabilities',
    capabilities: 'Capabilities',
    capabilityTitles: [
      'AI agent engineering',
      'Software and product engineering',
      'AI system evaluation',
    ],
    education: 'Education',
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
    await expect(page.locator('#gurusup')).toContainText('Pydantic AI');
    const education = page.getByRole('region', { name: locale.education });
    await expect(education.getByRole('heading', { level: 3 })).toHaveCount(2);
    await expect(education).toContainText('Universidad Internacional Menéndez Pelayo');
    await expect(education).toContainText('Universitat Politècnica de València');
    await expect(page.locator('.capabilities')).toHaveCount(0);
    await page.goBack();
    await skills.click();
    await expect(page.getByRole('heading', { name: locale.capabilities, level: 1 })).toBeVisible();
    const cards = page.locator('.capabilities > li');
    await expect(cards.getByRole('heading', { level: 2 })).toHaveText(locale.capabilityTitles);
    await expect(cards.first()).toContainText('Model Context Protocol (MCP)');
    const artwork = page.locator('.capability img');
    await expect(artwork).toHaveCount(3);
    for (const image of await artwork.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth))
        .toBeGreaterThan(0);
    }
    await expect(page.getByRole('region', { name: locale.education })).toHaveCount(0);
    const evidence = page.locator('.capabilities');
    for (const [name, path, hash, target] of [
      ['GuruSup', '/experience', '#gurusup', '#gurusup'],
      ['GLIO-IA', '/work/glio-ia', '', 'h1'],
      ['HealthDashboard', '/work', '#health-dashboard', '#health-dashboard'],
    ]) {
      await evidence.getByRole('link', { name: new RegExp(name) }).click();
      await expect(page).toHaveURL(
        (url) => url.pathname.replace(/\/$/, '') === locale.prefix + path && url.hash === hash,
      );
      await expect(page.locator(target)).toContainText(name);
      await page.goBack();
    }
    await page.goBack();
    await cv.click();
    await expect(page.locator('.desktop-cv')).toBeVisible();
  });
}
