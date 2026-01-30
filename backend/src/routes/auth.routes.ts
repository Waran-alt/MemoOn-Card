/**
 * Auth Routes
 *
 * Register, login, and refresh token endpoints. No auth middleware; no CSRF on these routes.
 */

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { userService } from '@/services/user.service';
import { generateAccessToken, generateRefreshToken, JWTPayload } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest } from '@/middleware/validation';
import { RegisterSchema, LoginSchema, RefreshSchema } from '@/schemas/auth.schemas';
import { AuthenticationError } from '@/utils/errors';
import { JWT_SECRET } from '@/config/env';

const router = Router();

function toUserResponse(user: { id: string; email: string; name: string | null }) {
  return { id: user.id, email: user.email, name: user.name };
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
 * Exchange refresh token for new access (and refresh) tokens
 */
router.post(
  '/refresh',
  validateRequest(RefreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET) as JWTPayload;
    } catch {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    if (!decoded.userId) {
      throw new AuthenticationError('Invalid refresh token');
    }

    const accessToken = generateAccessToken(decoded.userId, decoded.email);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  })
);

export default router;
