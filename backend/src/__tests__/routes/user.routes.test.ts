/**
 * Tests for authenticated `/api/user/*` routes (settings + change-password).
 *
 * The real app mounts these after `authMiddleware`; here we inject `req.userId` in a small Express
 * stack so JWT verification is not duplicated in tests.
 *
 * Mocks:
 * - `userService` / `refreshTokenService` / `passwordResetService` — isolate HTTP contract from DB.
 * - `user-settings.service` — GET/PATCH settings without Liquibase/Postgres.
 * - `setRefreshCookie` from auth-route helpers — we only assert password/session side effects on services.
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
import {
  getStudySessionSettings,
  updateKnowledgeEnabled,
  updateUiTheme,
} from '@/services/user-settings.service';

vi.mock('@/services/user-settings.service', () => ({
  getStudySessionSettings: vi.fn(),
  updateKnowledgeEnabled: vi.fn(),
  updateUiTheme: vi.fn(),
}));

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

/** Stable UUID reused as JWT subject in mocks. */
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

    it('returns 401 when user record is missing', async () => {
      vi.mocked(userService.getUserWithPasswordHashById).mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/user/change-password')
        .send({
          currentPassword: 'old-old-old',
          newPassword: 'new-new-new',
        });

      expect(res.status).toBe(401);
      expect(userService.updatePassword).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/user/settings', () => {
    it('returns study session settings', async () => {
      const settings = {
        knowledge_enabled: true,
        learning_min_interval_minutes: 1,
        fsrs_weights_default: Array(21).fill(1),
        target_retention_default: 0.9,
      };
      vi.mocked(getStudySessionSettings).mockResolvedValueOnce(settings as Awaited<
        ReturnType<typeof getStudySessionSettings>
      >);

      const res = await request(app).get('/api/user/settings');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(settings);
      expect(getStudySessionSettings).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('PATCH /api/user/settings', () => {
    /**
     * Route handler calls `updateKnowledgeEnabled` then `getStudySessionSettings` for the response body.
     * Both return `StudySessionSettings`; we mock both with the same object so TypeScript matches the
     * real service signatures (they return the updated snapshot from DB).
     */
    it('updates knowledge_enabled and returns fresh settings', async () => {
      const fresh = {
        knowledge_enabled: false,
        learning_min_interval_minutes: 1,
        fsrs_weights_default: Array(21).fill(1),
        target_retention_default: 0.9,
      };
      const asSettings = fresh as Awaited<ReturnType<typeof getStudySessionSettings>>;
      vi.mocked(updateKnowledgeEnabled).mockResolvedValueOnce(asSettings);
      vi.mocked(getStudySessionSettings).mockResolvedValueOnce(asSettings);

      const res = await request(app)
        .patch('/api/user/settings')
        .send({ knowledge_enabled: false });

      expect(res.status).toBe(200);
      expect(updateKnowledgeEnabled).toHaveBeenCalledWith(mockUserId, false);
      expect(res.body.data).toEqual(fresh);
    });

    it('returns 400 when body is invalid', async () => {
      const res = await request(app).patch('/api/user/settings').send({ knowledge_enabled: 'nope' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(updateKnowledgeEnabled).not.toHaveBeenCalled();
    });

    it('updates ui_theme when provided', async () => {
      const fresh = {
        ui_theme: 'dark' as const,
        knowledge_enabled: true,
        learning_min_interval_minutes: 1,
        fsrs_weights_default: Array(21).fill(1),
        target_retention_default: 0.9,
      };
      const asSettings = fresh as Awaited<ReturnType<typeof getStudySessionSettings>>;
      vi.mocked(updateUiTheme).mockResolvedValueOnce(asSettings);
      vi.mocked(getStudySessionSettings).mockResolvedValueOnce(asSettings);

      const res = await request(app).patch('/api/user/settings').send({ ui_theme: 'dark' });

      expect(res.status).toBe(200);
      expect(updateUiTheme).toHaveBeenCalledWith(mockUserId, 'dark');
    });
  });
});
