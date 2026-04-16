/**
 * Unit tests for small auth-route helpers (no Express server).
 * `resolvePasswordResetBaseUrl` depends on CORS allowlist — we override `getAllowedOrigins` via partial mock.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

const getAllowedOriginsMock = vi.hoisted(() =>
  vi.fn(() => ['http://localhost:3002', 'https://allowed.example.com'])
);

vi.mock('@/config/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config/env')>();
  return {
    ...actual,
    CORS_ORIGIN: 'http://localhost:3002',
    getAllowedOrigins: getAllowedOriginsMock,
  };
});

import {
  maskEmail,
  resolvePasswordResetBaseUrl,
  toUserResponse,
  getSessionMeta,
} from '@/routes/auth-route.helpers';
import type { Request } from 'express';

describe('maskEmail', () => {
  it('redacts local part after first two chars', () => {
       expect(maskEmail('alice@example.com')).toBe('al***@example.com');
  });

  it('normalizes case and whitespace', () => {
    expect(maskEmail('  BOB@Example.COM  ')).toBe('bo*@example.com');
  });

  it('returns placeholder for invalid email', () => {
    expect(maskEmail('not-an-email')).toBe('invalid-email');
  });
});

describe('resolvePasswordResetBaseUrl', () => {
  beforeEach(() => {
    getAllowedOriginsMock.mockReturnValue(['http://localhost:3002', 'https://allowed.example.com']);
  });

  it('returns CORS_ORIGIN without trailing slash when client omits suggestion', () => {
    expect(resolvePasswordResetBaseUrl(undefined)).toBe('http://localhost:3002');
    expect(resolvePasswordResetBaseUrl('   ')).toBe('http://localhost:3002');
  });

  it('returns normalized origin when suggestion matches allowlist', () => {
    expect(resolvePasswordResetBaseUrl('https://allowed.example.com/fr/reset')).toBe(
      'https://allowed.example.com'
    );
  });

  it('falls back when suggestion is not in allowlist (open-redirect mitigation)', () => {
    expect(resolvePasswordResetBaseUrl('https://evil.com')).toBe('http://localhost:3002');
  });

  it('falls back on malformed URL', () => {
    expect(resolvePasswordResetBaseUrl(':::not-a-url')).toBe('http://localhost:3002');
  });
});

describe('toUserResponse', () => {
  it('picks public user fields only', () => {
    expect(
      toUserResponse({
        id: 'u1',
        email: 'a@b.com',
        name: 'N',
        role: 'admin',
      })
    ).toEqual({ id: 'u1', email: 'a@b.com', name: 'N', role: 'admin' });
  });
});

describe('getSessionMeta', () => {
  it('extracts user-agent and ip from request', () => {
    const req = {
      get: (h: string) => (h === 'user-agent' ? 'vitest' : undefined),
      ip: '127.0.0.1',
    } as unknown as Request;
    expect(getSessionMeta(req)).toEqual({ userAgent: 'vitest', ipAddress: '127.0.0.1' });
  });
});
