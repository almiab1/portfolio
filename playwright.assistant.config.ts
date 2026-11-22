// ABOUTME: Exercises the browser transport against the Python fixture through Astro's development proxy.
// ABOUTME: Uses isolated ports and local-only processes for both locales.
import { defineConfig, devices } from '@playwright/test';

const webPort = Number(process.env.ASSISTANT_E2E_WEB_PORT ?? 4348);
const apiPort = Number(process.env.ASSISTANT_E2E_API_PORT ?? 8108);
const origin = `http://127.0.0.1:${webPort}`;
const api = `http://127.0.0.1:${apiPort}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: 'assistant-remote.spec.ts',
  use: { ...devices['Desktop Chrome'], baseURL: origin },
  webServer: [
    {
      command: `python -m uvicorn api.chat:app --host 127.0.0.1 --port ${apiPort}`,
      port: apiPort,
      env: { PORTFOLIO_ASSISTANT_MODE: 'fixture', PORTFOLIO_ASSISTANT_LOCAL_ORIGIN: origin },
    },
    {
      command: `pnpm exec astro dev --ignore-lock --host 127.0.0.1 --port ${webPort}`,
      url: origin,
      env: { PORTFOLIO_ASSISTANT_LOCAL_URL: api, PUBLIC_PORTFOLIO_ASSISTANT_PREVIEW: '1' },
    },
  ],
});
