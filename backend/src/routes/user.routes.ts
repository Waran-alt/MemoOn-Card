/**
 * User routes: settings (study preferences, knowledge, etc.), change-password.
 * Identity is always `getUserId(req)` from the JWT; the body must not name another user (admin overrides use admin routes).
 */

import { Router } from 'express';
import { generateAccessToken, generateRefreshToken, getUserId } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest } from '@/middleware/validation';
import {
  getStudySessionSettings,
  updateKnowledgeEnabled,
  updateUiTheme,
} from '@/services/user-settings.service';
import { UpdateUserSettingsSchema } from '@/schemas/user-settings.schemas';
import { ChangePasswordSchema } from '@/schemas/auth.schemas';
import { userService } from '@/services/user.service';
import { refreshTokenService } from '@/services/refresh-token.service';
import { passwordResetService } from '@/services/password-reset.service';
import { AuthenticationError } from '@/utils/errors';
import { getSessionMeta, setRefreshCookie, toUserResponse } from '@/routes/auth-route.helpers';
import { changePasswordLimiter } from '@/routes/auth/authLimiters';

const router = Router();

router.get(
  '/settings',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const settings = await getStudySessionSettings(userId);
    return res.json({ success: true, data: settings });
  })
);

router.post(
  '/change-password',
  changePasswordLimiter,
  validateRequest(ChangePasswordSchema),
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const { currentPassword, newPassword, trustDevice } = req.body as {
      currentPassword: string;
      newPassword: string;
      trustDevice: boolean;
    };

    const user = await userService.getUserWithPasswordHashById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    const valid = await userService.verifyPassword(currentPassword, user.password_hash);
    if (!valid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    await userService.updatePassword(userId, newPassword);
    await refreshTokenService.revokeAllActiveSessions(userId);
    await passwordResetService.invalidateAllActiveTokensForUser(userId);

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(userId, { trustedDevice: trustDevice });
    await refreshTokenService.createSession(userId, refreshToken, getSessionMeta(req));
    setRefreshCookie(req, res, refreshToken);

    return res.json({
      success: true,
      message: 'Password updated. Other devices were signed out; this session stays active.',
      data: {
        accessToken,
        user: toUserResponse({ id: user.id, email: user.email, name: user.name, role: user.role }),
      },
    });
  })
);

router.patch(
  '/settings',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const parsed = UpdateUserSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid body',
        details: parsed.error.flatten(),
      });
    }
    const data = parsed.data;
    if (data.knowledge_enabled !== undefined) {
      await updateKnowledgeEnabled(userId, data.knowledge_enabled);
    }
    if (data.ui_theme !== undefined) {
      await updateUiTheme(userId, data.ui_theme);
    }
    const settings = await getStudySessionSettings(userId);
    return res.json({ success: true, data: settings });
  })
);

export default router;
