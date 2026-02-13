import { afterEach, describe, expect, it, vi } from 'vitest';
import apiClient, { getApiErrorMessage, isRequestCancelled } from './api';
import { useAuthStore } from '@/store/auth.store';

afterEach(() => {
  vi.restoreAllMocks();
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isHydrated: false,
  });
});

describe('api helpers', () => {
  it('detects cancelled requests', () => {
    expect(isRequestCancelled({ name: 'CanceledError' })).toBe(true);
    expect(isRequestCancelled({ name: 'AbortError' })).toBe(true);
    expect(isRequestCancelled({ code: 'ERR_CANCELED' })).toBe(true);
    expect(isRequestCancelled({ name: 'OtherError' })).toBe(false);
    expect(isRequestCancelled(null)).toBe(false);
  });

  it('extracts API error message when present', () => {
    const msg = getApiErrorMessage(
      { response: { data: { error: 'Request failed in backend' } } },
      'fallback'
    );
    expect(msg).toBe('Request failed in backend');
    expect(getApiErrorMessage({}, 'fallback')).toBe('fallback');
  });
});

describe('api interceptors', () => {
  it('adds auth and ajax headers for write requests', async () => {
    useAuthStore.setState({ accessToken: 'token-123' });

    const requestHandler = (apiClient.interceptors.request as unknown as {
      handlers: Array<{ fulfilled: (config: any) => any }>;
    }).handlers[0].fulfilled;

    const cfg = await requestHandler({ method: 'post', headers: {} });

    expect(cfg.headers.Authorization).toBe('Bearer token-123');
    expect(cfg.headers['X-Requested-With']).toBe('XMLHttpRequest');
    expect(cfg.headers['X-Forwarded-Host']).toBe(window.location.host);
  });

  it('does not retry when 401 refresh returns null', async () => {
    const refreshSpy = vi.fn().mockResolvedValue(null);
    useAuthStore.setState({ refreshAccess: refreshSpy } as unknown as Parameters<
      typeof useAuthStore.setState
    >[0]);

    const rejectedHandler = (apiClient.interceptors.response as unknown as {
      handlers: Array<{ rejected: (error: any) => Promise<unknown> }>;
    }).handlers[0].rejected;

    const error = {
      response: { status: 401 },
      config: { headers: {}, method: 'get', _retry: false },
    };

    await expect(rejectedHandler(error)).rejects.toBe(error);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });
});
