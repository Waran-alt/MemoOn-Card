import { defineConfig } from '@playwright/test';
import { getDefaultBaseUrl } from './e2e/config';

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  retries: process.env.CI ? 3 : 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [{ name: 'chromium', use: { channel: 'chromium' } }],
  use: {
    baseURL: getDefaultBaseUrl(),
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
