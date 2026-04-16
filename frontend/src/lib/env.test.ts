import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_BACKEND_URL, getClientApiBaseUrl } from './env';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getClientApiBaseUrl', () => {
  it('uses default backend URL when NEXT_PUBLIC_API_URL is undefined', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', undefined as unknown as string);
    expect(getClientApiBaseUrl()).toBe(DEFAULT_BACKEND_URL);
  });

  it('returns empty string when env is set empty (same-origin / nginx)', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    expect(getClientApiBaseUrl()).toBe('');
  });

  it('trims whitespace from configured URL', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '  https://api.example  ');
    expect(getClientApiBaseUrl()).toBe('https://api.example');
  });
});
