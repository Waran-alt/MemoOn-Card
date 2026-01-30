/**
 * Tests for HTTP constants (e.g. REFRESH_COOKIE vs JWT refresh expiry)
 */

import { describe, it, expect, vi } from 'vitest';
import ms, { type StringValue } from 'ms';
import { REFRESH_COOKIE } from '@/constants/http.constants';

vi.mock('@/config/env', () => ({
  JWT_REFRESH_EXPIRES_IN: '7d',
}));

import { JWT_REFRESH_EXPIRES_IN } from '@/config/env';

describe('http.constants', () => {
  describe('REFRESH_COOKIE', () => {
    it('MAX_AGE_MS matches JWT_REFRESH_EXPIRES_IN (cookie and refresh token expiry stay in sync)', () => {
      const refreshExpiryMs = ms(JWT_REFRESH_EXPIRES_IN as StringValue);
      expect(REFRESH_COOKIE.MAX_AGE_MS).toBe(refreshExpiryMs);
    });
  });
});
