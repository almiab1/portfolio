// ABOUTME: Verifies that contact has its own localized app and a persistent launcher.
// ABOUTME: Covers the contact action in the assistant and the mobile menu bar.
import { expect, test } from '@playwright/test';

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
    await expect(contact.getByRole('link', { name: 'LinkedIn', exact: true })).toBeVisible();
    await expect(contact.getByRole('link', { name: 'GitHub', exact: true })).toBeVisible();
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
