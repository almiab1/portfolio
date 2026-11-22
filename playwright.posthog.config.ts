// ABOUTME: Runs PostHog browser tests on a production build with fake public configuration.
// ABOUTME: Serves the build locally and intercepts the simulated HTTPS preview and collector.
import { defineConfig, devices } from '@playwright/test';

const port = 4350;
const previewHost = 'portfolio.example.test';

export const POSTHOG_SITE_SERVER = `http://127.0.0.1:${port}`;
export const POSTHOG_COLLECTOR = 'https://collector.example.test';
export const POSTHOG_TEST_TOKEN = 'phc_portfolio_playwright';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'portfolio-posthog.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `https://${previewHost}`,
    serviceWorkers: 'block',
  },
  webServer: {
    command: `pnpm run build && pnpm exec astro preview --host 127.0.0.1 --port ${port} --ignore-lock`,
    url: POSTHOG_SITE_SERVER,
    env: {
      PUBLIC_POSTHOG_PROJECT_TOKEN: POSTHOG_TEST_TOKEN,
      PUBLIC_POSTHOG_HOST: POSTHOG_COLLECTOR,
      VERCEL_ENV: 'preview',
      VERCEL_URL: previewHost,
      PUBLIC_PORTFOLIO_ASSISTANT_PREVIEW: '1',
      PUBLIC_PORTFOLIO_TURNSTILE_SITE_KEY: 'portfolio-playwright-site-key',
    },
    timeout: 180_000,
  },
});
