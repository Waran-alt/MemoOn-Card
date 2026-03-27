import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

/** Load frontend/.env whether `yarn test:e2e` runs from repo root or from `frontend/`. */
function loadFrontendDotenv() {
  const cwd = process.cwd();
  const candidates = [path.join(cwd, 'frontend', '.env'), path.join(cwd, '.env')];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  }
}

loadFrontendDotenv();

/**
 * Playwright base URL: PLAYWRIGHT_BASE_URL wins, else E2E_BASE_URL from .env, else localhost dev.
 * Bare hostnames (e.g. memoon-card.localhost) get https://; localhost / 127.0.0.1 get http://.
 */
function resolvePlaywrightBaseURL(): string {
  const raw = (process.env.PLAYWRIGHT_BASE_URL || process.env.E2E_BASE_URL || '').trim();
  if (!raw) return 'http://localhost:3002';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw)) return `http://${raw}`;
  return `https://${raw}`;
}

const baseURL = resolvePlaywrightBaseURL();

export default defineConfig({
  testDir: './e2e',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    // Align with /en/ routes and English copy from public/locales/en (middleware uses Accept-Language).
    locale: 'en-US',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
