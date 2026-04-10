/**
 * Smoke checks for a running stack (yarn docker:up, yarn dev, or CI E2E job).
 * Verifies Next.js, API rewrite/proxy, and backend health on the host port.
 */
import { test, expect } from '@playwright/test';

const backendBase = (process.env.E2E_BACKEND_URL || 'http://127.0.0.1:4002').replace(/\/$/, '');

test.describe('Stack health', () => {
  test('Next.js serves locale home', async ({ page }) => {
    const res = await page.goto('/en');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('GET /api/version returns JSON', async ({ request }) => {
    const res = await request.get('/api/version');
    expect(res.ok(), `expected 200, got ${res.status()}`).toBeTruthy();
    const json = (await res.json()) as { version?: unknown };
    expect(json).toHaveProperty('version');
    expect(typeof json.version).toBe('string');
  });

  test('backend GET /health returns healthy', async ({ request }) => {
    const res = await request.get(`${backendBase}/health`);
    expect(res.ok(), `backend health at ${backendBase}/health failed: ${res.status()}`).toBeTruthy();
    const json = (await res.json()) as { status?: string };
    expect(json.status).toBe('healthy');
  });

  test('API route via frontend origin (session unauthenticated)', async ({ request }) => {
    const res = await request.get('/api/auth/session');
    expect([401, 403]).toContain(res.status());
  });
});
