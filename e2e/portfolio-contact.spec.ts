// ABOUTME: Verifies that contact has its own localized app and a persistent launcher.
// ABOUTME: Covers the contact action in the assistant and the mobile menu bar.
import { expect, test } from '@playwright/test';

const SOCIAL_LINKS = [
  { name: 'GitHub', href: 'https://github.com/almiab1' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/alejandro-mira/' },
  { name: 'X · @alexmiira', href: 'https://x.com/alexmiira' },
];

for (const locale of [
  {
    prefix: '',
    contact: 'Contacto',
    projects: 'Proyectos',
    assistant: 'Asistente',
    question: '¿Cómo puedo contactar con Alex?',
  },
  {
    prefix: '/en',
    contact: 'Contact',
    projects: 'Projects',
    assistant: 'Assistant',
    question: 'How can I email Alex?',
  },
]) {
  test(`keeps contact available throughout the workspace in ${locale.prefix || 'es'}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 780 });
    await page.goto(locale.prefix + '/');
    const profile = page.getByRole('main');
    for (const { name, href } of SOCIAL_LINKS) {
      const link = profile.getByRole('link', { name, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', href);
      await expect(link).toHaveAttribute('title', name);
      await expect(link).not.toHaveAttribute('target', '_blank');
    }
    await page.goto(locale.prefix + '/skills');
    const shortcut = page
      .locator('.desktop-menu')
      .getByRole('link', { name: locale.contact, exact: true });
    await expect(shortcut).toBeInViewport();
    await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(0);
    await shortcut.click();

    const path = locale.prefix + '/contact';
    const contact = page.getByRole('main');
    await expect(page).toHaveURL(path);
    await expect(contact.getByRole('heading', { name: locale.contact, exact: true })).toBeVisible();
    await expect(contact.locator('a[href^="mailto:"]')).toBeVisible();
    for (const { name, href } of SOCIAL_LINKS) {
      const link = contact.getByRole('link', { name, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveText(name);
      await expect(link).toHaveAttribute('href', href);
      await expect(link).toHaveAttribute('target', '_blank');
    }
    await expect(shortcut).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-desktop-tabs] a[aria-current="page"]')).toHaveText(
      locale.contact,
    );

    await page.setViewportSize({ width: 320, height: 740 });
    const dock = page.locator('.desktop-dock');
    await dock.getByRole('link', { name: locale.projects, exact: true }).click();
    await expect(shortcut).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);

    await dock.getByRole('button', { name: locale.assistant, exact: true }).click();
    await expect(shortcut).toBeInViewport();
    const assistant = page.getByRole('complementary', { name: locale.assistant });
    const question = assistant.getByRole('textbox');
    await question.fill(locale.question);
    await question.press('Enter');
    await assistant.getByRole('link', { name: locale.contact, exact: true }).click();
    await expect(page).toHaveURL(path);
    await expect(contact.getByRole('heading', { name: locale.contact, exact: true })).toBeVisible();
  });
}
