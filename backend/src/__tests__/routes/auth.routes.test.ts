/**
 * Tests for auth routes (register, login, refresh)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '@/routes/auth.routes';
import { errorHandler } from '@/middleware/errorHandler';
import { userService } from '@/services/user.service';
import { User } from '@/types/database';

vi.mock('@/config/env', () => ({
  NODE_ENV: 'test',
  JWT_SECRET: 'test-secret-minimum-32-characters-long',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
}));

vi.mock('@/services/user.service', () => ({
  userService: {
    createUser: vi.fn(),
    getUserById: vi.fn(),
    getUserByEmail: vi.fn(),
    verifyPassword: vi.fn(),
  },
}));

const mockUserId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const mockUser: User = {
  id: mockUserId,
  email: 'user@example.com',
  name: 'Test User',
  created_at: new Date(),
  updated_at: new Date(),
};

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

describe('Auth routes', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should return 201 with accessToken, refreshToken, and user', async () => {
      vi.mocked(userService.createUser).mockResolvedValueOnce(mockUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          password: 'password123',
          name: 'Test User',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        user: { id: mockUserId, email: 'user@example.com', name: 'Test User' },
      });
      expect(res.body.data.accessToken).toBeDefined();
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(res.body.data.refreshToken).toBeDefined();
      expect(userService.createUser).toHaveBeenCalledWith(
        'user@example.com',
        'password123',
        'Test User'
      );
    });

    it('should return error when email already exists', async () => {
      const { ConflictError: CE } = await import('@/utils/errors');
      vi.mocked(userService.createUser).mockRejectedValueOnce(
        new CE('An account with this email already exists')
      );

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          name: 'User',
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(userService.createUser).toHaveBeenCalledWith(
        'existing@example.com',
        'password123',
        'User'
      );
      if (res.body?.error || res.body?.message) {
        const errorMsg = (res.body.error ?? res.body.message) as string;
        expect(errorMsg).toMatch(/already exists|conflict|error/i);
      }
    });

    it('should return 400 when validation fails', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'short',
          name: 'User',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 with tokens and user when credentials valid', async () => {
      const userWithHash = { ...mockUser, password_hash: 'hashed' };
      vi.mocked(userService.getUserByEmail).mockResolvedValueOnce(userWithHash);
      vi.mocked(userService.verifyPassword).mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toEqual({
        id: mockUserId,
        email: 'user@example.com',
        name: 'Test User',
      });
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(userService.getUserByEmail).toHaveBeenCalledWith('user@example.com');
      expect(userService.verifyPassword).toHaveBeenCalledWith('password123', 'hashed');
    });

    it('should return error when user not found', async () => {
      vi.mocked(userService.getUserByEmail).mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown@example.com',
          password: 'password123',
        });

      expect(userService.getUserByEmail).toHaveBeenCalledWith('unknown@example.com');
      expect(res.status).toBeGreaterThanOrEqual(400);
      if (res.body?.error || res.body?.message) {
        const errorMsg = (res.body.error ?? res.body.message) as string;
        expect(errorMsg).toMatch(/invalid|email|password|unauthorized/i);
      }
    });

    it('should return error when password wrong', async () => {
      const userWithHash = { ...mockUser, password_hash: 'hashed' };
      vi.mocked(userService.getUserByEmail).mockResolvedValueOnce(userWithHash);
      vi.mocked(userService.verifyPassword).mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'wrongpassword',
        });

      expect(userService.verifyPassword).toHaveBeenCalledWith('wrongpassword', 'hashed');
      expect(res.status).toBeGreaterThanOrEqual(400);
      if (res.body?.error || res.body?.message) {
        const errorMsg = (res.body.error ?? res.body.message) as string;
        expect(errorMsg).toMatch(/invalid|email|password|unauthorized/i);
      }
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 200 with new tokens for valid refresh token', async () => {
      const jwt = await import('jsonwebtoken');
      const validRefreshToken = jwt.default.sign(
        { userId: mockUserId },
        'test-secret-minimum-32-characters-long',
        { expiresIn: '7d' }
      );

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(res.body.data.refreshToken).toBeDefined();
      expect(typeof res.body.data.refreshToken).toBe('string');
    });

    it('should return error for invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBeGreaterThanOrEqual(400);
      if (res.body?.error || res.body?.message) {
        const errorMsg = (res.body.error ?? res.body.message) as string;
        expect(errorMsg).toMatch(/invalid|expired|token|unauthorized/i);
      }
    });

    it('should return 401 when refreshToken missing', async () => {
      const res = await request(app).post('/api/auth/refresh').send({});

      expect(res.status).toBe(401);
    });
  });
});
