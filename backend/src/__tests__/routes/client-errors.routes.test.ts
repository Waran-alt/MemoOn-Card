import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { csrfProtection } from '@/middleware/csrf';
import { errorHandler } from '@/middleware/errorHandler';
import { requestIdMiddleware } from '@/middleware/requestId';
import clientErrorsRoutes from '@/routes/client-errors.routes';

const loggerWarn = vi.fn();

vi.mock('@/utils/logger', () => ({
  logger: {
    warn: (...args: unknown[]) => loggerWarn(...args),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const CSRF_OK = { 'X-Requested-With': 'XMLHttpRequest' } as const;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(requestIdMiddleware);
  app.use('/api', csrfProtection);
  app.use('/api/client-errors', clientErrorsRoutes);
  app.use(errorHandler);
  return app;
}

describe('POST /api/client-errors', () => {
  const app = createApp();

  beforeEach(() => {
    loggerWarn.mockClear();
  });

  it('returns 204 and logs structured client_error with CSRF header', async () => {
    const res = await request(app)
      .post('/api/client-errors')
      .set(CSRF_OK)
      .send({
        source: 'window',
        message: 'Test error',
        stack: 'Error: Test\n  at x.js:1:1',
        pageUrl: 'https://example.com/en/app',
      });
    expect(res.status).toBe(204);
    expect(loggerWarn).toHaveBeenCalledTimes(1);
    const [msg, meta] = loggerWarn.mock.calls[0] as [string, Record<string, unknown>];
    expect(msg).toBe('Client error report');
    expect(meta.event).toBe('client_error');
    expect(meta.source).toBe('window');
    expect(meta.message).toBe('Test error');
    expect(meta.pageUrl).toBe('https://example.com/en/app');
  });

  it('returns 403 without CSRF safeguards', async () => {
    const res = await request(app).post('/api/client-errors').send({
      source: 'window',
      message: 'x',
    });
    expect(res.status).toBe(403);
    expect(loggerWarn).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid body', async () => {
    const res = await request(app)
      .post('/api/client-errors')
      .set(CSRF_OK)
      .send({ source: 'invalid', message: 'x' });
    expect(res.status).toBe(400);
    expect(loggerWarn).not.toHaveBeenCalled();
  });
});
