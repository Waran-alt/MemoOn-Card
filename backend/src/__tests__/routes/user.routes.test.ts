/**
 * Tests for /api/user/change-password and settings wiring (auth stub).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import userRoutes from '@/routes/user.routes';
import { errorHandler } from '@/middleware/errorHandler';
import { userService } from '@/services/user.service';
import { refreshTokenService } from '@/services/refresh-token.service';
import { passwordResetService } from '@/services/password-reset.service';

vi.mock('@/services/user.service', () => ({
  userService: {
    getUserWithPasswordHashById: vi.fn(),
    verifyPassword: vi.fn(),
    updatePassword: vi.fn(),
  },
}));

vi.mock('@/services/refresh-token.service', () => ({
  refreshTokenService: {
    revokeAllActiveSessions: vi.fn(),
    createSession: vi.fn(),
  },
}));

vi.mock('@/services/password-reset.service', () => ({
  passwordResetService: {
    invalidateAllActiveTokensForUser: vi.fn(),
  },
}));

vi.mock('@/routes/auth-route.helpers', async () => {
  const actual = await vi.importActual<typeof import('@/routes/auth-route.helpers')>('@/routes/auth-route.helpers');
  return {
    ...actual,
    setRefreshCookie: vi.fn(),
  };
});

const mockUserId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use((req, _res, next) => {
    req.userId = mockUserId;
    next();
  });
  app.use('/api/user', userRoutes);
  app.use(errorHandler);
  return app;
}

describe('User routes', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/user/change-password', () => {
    it('returns 200 with new access token when current password is valid', async () => {
      vi.mocked(userService.getUserWithPasswordHashById).mockResolvedValueOnce({
        id: mockUserId,
        email: 'u@example.com',
        name: 'U',
        role: 'user',
        password_hash: 'hash',
        created_at: new Date(),
        updated_at: new Date(),
      });
      vi.mocked(userService.verifyPassword).mockResolvedValueOnce(true);
      vi.mocked(userService.updatePassword).mockResolvedValueOnce();
      vi.mocked(refreshTokenService.revokeAllActiveSessions).mockResolvedValueOnce();
      vi.mocked(passwordResetService.invalidateAllActiveTokensForUser).mockResolvedValueOnce();
      vi.mocked(refreshTokenService.createSession).mockResolvedValueOnce();

      const res = await request(app)
        .post('/api/user/change-password')
        .send({
          currentPassword: 'old-old-old',
          newPassword: 'new-new-new',
          trustDevice: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data?.accessToken).toBeDefined();
      expect(res.body.data?.user).toMatchObject({ id: mockUserId, email: 'u@example.com' });
      expect(userService.updatePassword).toHaveBeenCalledWith(mockUserId, 'new-new-new');
      expect(refreshTokenService.revokeAllActiveSessions).toHaveBeenCalledWith(mockUserId);
      expect(passwordResetService.invalidateAllActiveTokensForUser).toHaveBeenCalledWith(mockUserId);
    });

    it('returns 401 when current password is wrong', async () => {
      vi.mocked(userService.getUserWithPasswordHashById).mockResolvedValueOnce({
        id: mockUserId,
        email: 'u@example.com',
        name: null,
        role: 'user',
        password_hash: 'hash',
        created_at: new Date(),
        updated_at: new Date(),
      });
      vi.mocked(userService.verifyPassword).mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/api/user/change-password')
        .send({
          currentPassword: 'wrong',
          newPassword: 'new-new-new',
        });

      expect(res.status).toBe(401);
      expect(userService.updatePassword).not.toHaveBeenCalled();
    });

    it('returns 400 when new password equals current (Zod)', async () => {
      const res = await request(app)
        .post('/api/user/change-password')
        .send({
          currentPassword: 'same-same-same',
          newPassword: 'same-same-same',
        });

      expect(res.status).toBe(400);
      expect(userService.getUserWithPasswordHashById).not.toHaveBeenCalled();
    });
  });
});
