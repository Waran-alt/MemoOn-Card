import { afterEach, describe, expect, it, vi } from 'vitest';

async function importLoggerWithEnv(nodeEnv: 'development' | 'production' | 'test') {
  vi.resetModules();
  vi.doMock('@/config/env', () => ({
    NODE_ENV: nodeEnv,
  }));
  return import('./logger');
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('logger', () => {
  it('writes JSON to stdout for info logs in production', async () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { logger } = await importLoggerWithEnv('production');
    logger.info('server started', { port: 4002 });

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const line = String(stdoutSpy.mock.calls[0][0]);
    expect(line).toContain('"level":"info"');
    expect(line).toContain('"message":"server started"');
    expect(line).toContain('"port":4002');
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('uses console.warn and console.error for warn/error in production', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { logger } = await importLoggerWithEnv('production');
    logger.warn('slow request', { ms: 900 });
    logger.error('boom', { requestId: 'req-1' });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain('"level":"warn"');
    expect(String(errorSpy.mock.calls[0][0])).toContain('"level":"error"');
  });
});

describe('serializeError', () => {
  it('includes stack only in development for Error instances', async () => {
    const devModule = await importLoggerWithEnv('development');
    const prodModule = await importLoggerWithEnv('production');

    const err = new Error('broken');
    const dev = devModule.serializeError(err);
    const prod = prodModule.serializeError(err);

    expect(dev).toMatchObject({ name: 'Error', message: 'broken' });
    expect(typeof dev.stack).toBe('string');
    expect(prod).toMatchObject({ name: 'Error', message: 'broken', stack: undefined });
  });

  it('serializes non-Error values as string messages', async () => {
    const { serializeError } = await importLoggerWithEnv('test');
    expect(serializeError('boom')).toEqual({ message: 'boom' });
    expect(serializeError(42)).toEqual({ message: '42' });
  });
});
