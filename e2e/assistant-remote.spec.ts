// ABOUTME: Verifies Python-produced chat messages and localized destinations in a real browser.
// ABOUTME: Checks both zero-inference suggestions and free-form conversation through the proxy.
import { expect, test } from '@playwright/test';

for (const lang of ['es', 'en'] as const) {
  test(`remote assistant publishes localized replies in ${lang}`, async ({ page }) => {
    await page.goto(lang === 'es' ? '/' : '/en/');
    const chat = page
      .locator('astro-island:not([ssr])')
      .filter({ has: page.locator('#assistant-question') });
    await expect(chat).toBeVisible();
    const log = chat.getByRole('log');
    await expect(
      page.getByText(lang === 'es' ? 'Vista previa del asistente' : 'Assistant preview'),
    ).toBeVisible();
    const request = page.waitForRequest((req) => req.url().endsWith('/api/chat'));
    await chat
      .getByRole('button', { name: lang === 'es' ? '¿Puedo ver su CV?' : 'Can I see his résumé?' })
      .click();
    expect((await request).postDataJSON()).toMatchObject({ lang, preset: 'cv' });
    await expect(log.getByRole('link')).toHaveAttribute('href', lang === 'es' ? '/cv' : '/en/cv');
    await page
      .locator('#assistant-question')
      .fill(lang === 'es' ? '¿Cuánto duró GLIO-IA?' : 'How long did GLIO-IA last?');
    await page.locator('#assistant-question').press('Enter');
    await expect(log).toContainText(lang === 'es' ? '24 meses' : '24 months');
  });
}
