// ABOUTME: Verifies that contact has its own localized app and a persistent launcher.
// ABOUTME: Covers contact navigation, input validation, and the email draft in both languages.
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
    subject: 'Asunto',
    message: 'Mensaje',
    openDraft: 'Abrir borrador de correo',
    emptyMessage: 'Escribe algo en este campo.',
  },
  {
    prefix: '/en',
    contact: 'Contact',
    projects: 'Projects',
    assistant: 'Assistant',
    question: 'How can I email Alex?',
    subject: 'Subject',
    message: 'Message',
    openDraft: 'Open email draft',
    emptyMessage: 'Enter some text in this field.',
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

  test(`opens a validated email draft in ${locale.prefix || 'es'}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    const path = locale.prefix + '/contact';
    await page.goto(path);

    const subject = page.getByRole('textbox', { name: locale.subject, exact: true });
    const message = page.getByRole('textbox', { name: locale.message, exact: true });
    const openDraft = page.getByRole('button', { name: locale.openDraft });
    const directEmail = page.getByRole('link', { name: 'miraabad.alejandro@gmail.com' });
    const drafts: string[] = [];
    await page.exposeFunction('recordContactDraft', (href: string) => drafts.push(href));
    await page.evaluate(() => {
      document.addEventListener('click', (event) => {
        if (!(event.target instanceof HTMLAnchorElement) || event.target.protocol !== 'mailto:')
          return;
        event.preventDefault();
        const browser = window as Window & { recordContactDraft: (href: string) => void };
        browser.recordContactDraft(event.target.href);
      });
    });

    await expect(directEmail).toHaveAttribute('href', 'mailto:miraabad.alejandro@gmail.com');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    await openDraft.click();
    await expect(subject).toBeFocused();
    expect(drafts).toHaveLength(0);

    await subject.fill('Diseño & desarrollo?');
    await message.fill('  ');
    await openDraft.click();
    await expect(message).toBeFocused();
    await expect(message).toHaveJSProperty('validationMessage', locale.emptyMessage);
    expect(drafts).toHaveLength(0);

    const body = 'Hola + gracias!\nSegunda línea.';
    await message.fill(body);
    await openDraft.click();
    await expect
      .poll(() => drafts)
      .toEqual([
        'mailto:miraabad.alejandro@gmail.com?subject=Dise%C3%B1o%20%26%20desarrollo%3F&body=Hola%20%2B%20gracias!%0D%0ASegunda%20l%C3%ADnea.',
      ]);
    await expect(page).toHaveURL(path);
    await expect(message).toHaveValue(body);
  });
}

test.describe('contact without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps the direct email link available', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('link', { name: 'miraabad.alejandro@gmail.com' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir borrador de correo' })).toBeHidden();
  });
});
