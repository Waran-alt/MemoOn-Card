import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnv = {
  BACKEND_URL: process.env.BACKEND_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  process.env.BACKEND_URL = originalEnv.BACKEND_URL;
  process.env.NEXT_PUBLIC_API_URL = originalEnv.NEXT_PUBLIC_API_URL;
  vi.unstubAllEnvs();
});

describe('getSession', () => {
  it('uses BACKEND_URL when present', async () => {
    process.env.BACKEND_URL = 'http://backend.internal:7777';
    process.env.NEXT_PUBLIC_API_URL = 'http://public.example:9999';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { user: { id: '1', email: 'a@b.com' } } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { getSession } = await import('./auth');
    const result = await getSession({
      getAll: () => [{ name: 'refreshToken', value: 'abc' }],
    });

    expect(fetchMock).toHaveBeenCalledWith('http://backend.internal:7777/api/auth/session', {
      headers: { Cookie: 'refreshToken=abc' },
      cache: 'no-store',
    });
    expect(result).toEqual({ user: { id: '1', email: 'a@b.com' } });
  });

  it('falls back to default URL when NEXT_PUBLIC_API_URL is empty', async () => {
    process.env.BACKEND_URL = '';
    process.env.NEXT_PUBLIC_API_URL = '   ';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { user: { id: '2', email: 'b@c.com' } } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { getSession } = await import('./auth');
    await getSession({ getAll: () => [] });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4002/api/auth/session', {
      headers: {},
      cache: 'no-store',
    });
  });

  it('returns null when backend response is not ok', async () => {
    process.env.BACKEND_URL = 'http://backend.internal:7777';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      })
    );

    const { getSession } = await import('./auth');
    const result = await getSession({ getAll: () => [] });

    expect(result).toBeNull();
  });

  it('returns null and logs warning in development on fetch error', async () => {
    process.env.BACKEND_URL = 'http://backend.internal:7777';
    vi.stubEnv('NODE_ENV', 'development');

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { getSession } = await import('./auth');
    const result = await getSession({ getAll: () => [] });

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });
});
