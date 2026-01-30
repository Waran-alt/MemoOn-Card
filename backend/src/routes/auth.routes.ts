/**
 * Auth Routes
 *
 * Register, login, refresh, and session endpoints. No auth middleware; no CSRF on these routes.
 * Refresh token is set in httpOnly cookie for SSR and XSS safety.
 */

import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { userService } from '@/services/user.service';
import { generateAccessToken, generateRefreshToken, JWTPayload } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest } from '@/middleware/validation';
import { RegisterSchema, LoginSchema, RefreshSchema } from '@/schemas/auth.schemas';
import { AuthenticationError } from '@/utils/errors';
import { JWT_SECRET } from '@/config/env';
import { NODE_ENV } from '@/config/env';
import { REFRESH_COOKIE } from '@/constants/http.constants';

const router = Router();

function toUserResponse(user: { id: string; email: string; name: string | null }) {
  return { id: user.id, email: user.email, name: user.name };
}

function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE.NAME, refreshToken, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: REFRESH_COOKIE.SAME_SITE,
    maxAge: REFRESH_COOKIE.MAX_AGE_MS,
    path: '/',
  });
}

/**
 * POST /api/auth/register
 * Create account and return tokens
 */
router.post(
  '/register',
  validateRequest(RegisterSchema),
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;
    const user = await userService.createUser(email, password, name);

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: toUserResponse(user),
      },
    });
  })
);

/**
 * POST /api/auth/login
 * Validate credentials and return tokens
 */
router.post(
  '/login',
  validateRequest(LoginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await userService.getUserByEmail(email);

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const valid = await userService.verifyPassword(password, user.password_hash);
    if (!valid) {
      throw new AuthenticationError('Invalid email or password');
    }

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    setRefreshCookie(res, refreshToken);

    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: toUserResponse(user),
      },
    });
  })
);

/**
 * POST /api/auth/refresh
 * Exchange refresh token (from httpOnly cookie or body) for new access + refresh tokens
 */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = (req.cookies as { refresh_token?: string } | undefined)?.refresh_token ?? req.body?.refreshToken;

    if (!token || typeof token !== 'string') {
      throw new AuthenticationError('Refresh token required (cookie or body)');
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    if (!decoded.userId) {
      throw new AuthenticationError('Invalid refresh token');
    }

    const user = await userService.getUserById(decoded.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    const accessToken = generateAccessToken(decoded.userId, user.email);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    setRefreshCookie(res, newRefreshToken);

    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        user: toUserResponse(user),
      },
    });
  })
);

/**
 * GET /api/auth/session
 * Return current user from httpOnly refresh cookie (for SSR). No auth header required.
 */
router.get(
  '/session',
  asyncHandler(async (req, res) => {
    const token = (req.cookies as { refresh_token?: string } | undefined)?.refresh_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session',
      });
    }

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session',
      });
    }

    const user = await userService.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.json({
      success: true,
      data: { user: toUserResponse(user) },
    });
  })
);

export default router;
