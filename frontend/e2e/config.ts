/**
 * E2E config: single source for defaults. Prefer env (E2E_BASE_URL, FRONTEND_PORT, E2E_TEST_PASSWORD).
 * Load frontend .env so E2E_BASE_URL etc. are set when running Playwright (test runner does not load Next.js env).
 */
import path from 'path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(__dirname, '..', '.env') });

const DEFAULT_FRONTEND_PORT = 3002;
const DEFAULT_TEST_PASSWORD = 'Test1234!';

export function getDefaultBaseUrl(): string {
  if (process.env.E2E_BASE_URL) return process.env.E2E_BASE_URL;
  const port = process.env.FRONTEND_PORT ?? process.env.PORT ?? String(DEFAULT_FRONTEND_PORT);
  return `http://localhost:${port}`;
}

export function getTestPassword(): string {
  return process.env.E2E_TEST_PASSWORD ?? DEFAULT_TEST_PASSWORD;
}

/** Unique email per call to avoid 409 "email already exists" with parallel runs or retries. */
export function getRandomEmail(): string {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `e2e+${Date.now()}-${suffix}@example.com`;
}
