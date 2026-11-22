// ABOUTME: Tests the PostHog assistant flag against a production Astro build.
// ABOUTME: Intercepts flag and chat requests to cover enabled, disabled, and failed lookups.
import { defineConfig, devices } from '@playwright/test';

const port = 4352;
const origin = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: 'assistant-flag.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: origin,
  },
  webServer: {
    command: `PORTFOLIO_ASSISTANT_FLAG_CHECK=1 PUBLIC_PORTFOLIO_ASSISTANT_PREVIEW=1 pnpm run build && pnpm exec astro preview --host 127.0.0.1 --port ${port} --ignore-lock`,
    url: origin,
    env: { PUBLIC_PORTFOLIO_ASSISTANT_PREVIEW: '1' },
    timeout: 180_000,
  },
});
