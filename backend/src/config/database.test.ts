import { afterEach, describe, expect, it, vi } from 'vitest';

const loggerInfo = vi.hoisted(() => vi.fn());
const loggerError = vi.hoisted(() => vi.fn());
const serializeError = vi.hoisted(() => vi.fn((err: unknown) => ({ message: String(err) })));

async function loadDatabaseModule() {
  vi.resetModules();
  loggerInfo.mockClear();
  loggerError.mockClear();
  serializeError.mockClear();

  const eventHandlers = new Map<string, (...args: unknown[]) => unknown>();
  const mockPool = {
    on: vi.fn((event: string, handler: (...args: unknown[]) => unknown) => {
      eventHandlers.set(event, handler);
      return mockPool;
    }),
    connect: vi.fn(),
    end: vi.fn().mockResolvedValue(undefined),
  };
  const Pool = vi.fn(() => mockPool);

  vi.doMock('pg', () => ({ Pool }));
  vi.doMock('@/config/env', () => ({
    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: 5432,
    POSTGRES_DB: 'memoon_card_db',
    POSTGRES_USER: 'postgres',
    POSTGRES_PASSWORD: 'postgres',
  }));
  vi.doMock('@/utils/logger', () => ({
    logger: {
      info: loggerInfo,
      error: loggerError,
    },
    serializeError,
  }));

  const processOnSpy = vi.spyOn(process, 'on').mockImplementation(
    ((..._args: unknown[]) => process) as unknown as typeof process.on
  );

  const mod = await import('./database');
  return { mod, mockPool, Pool, eventHandlers, processOnSpy };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('database config', () => {
  it('creates pool and registers handlers', async () => {
    const { Pool, eventHandlers, processOnSpy } = await loadDatabaseModule();

    expect(Pool).toHaveBeenCalledTimes(1);
    expect(eventHandlers.has('connect')).toBe(true);
    expect(eventHandlers.has('error')).toBe(true);
    expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
  });

  it('testConnection returns true on successful connection', async () => {
    const { mod, mockPool } = await loadDatabaseModule();
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [{ now: '2026-01-01T00:00:00.000Z' }] }),
      release: vi.fn(),
    };
    mockPool.connect.mockResolvedValue(client);

    const ok = await mod.testConnection();

    expect(ok).toBe(true);
    expect(client.query).toHaveBeenCalledWith('SELECT NOW()');
    expect(client.release).toHaveBeenCalledTimes(1);
    expect(loggerInfo).toHaveBeenCalledWith(
      'Database connection test successful',
      expect.objectContaining({ now: expect.anything() })
    );
  });

  it('testConnection returns false and logs on failure', async () => {
    const { mod, mockPool } = await loadDatabaseModule();
    mockPool.connect.mockRejectedValue(new Error('connection failed'));

    const ok = await mod.testConnection();

    expect(ok).toBe(false);
    expect(serializeError).toHaveBeenCalled();
    expect(loggerError).toHaveBeenCalledWith(
      'Database connection test failed',
      expect.objectContaining({ error: expect.any(Object) })
    );
  });
});
