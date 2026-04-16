/**
 * Password reset (forgot-password) flow. Tokens stored as SHA-256 only; plain token exists only in email/link.
 * Email: set BREVO_API_KEY + BREVO_SENDER_EMAIL (verified sender in Brevo). Without them, production logs a warning;
 * development logs a token-redacted link (grid 1.5 / 8.1).
 */

import crypto from 'crypto';
import { pool } from '@/config/database';
import {
  BREVO_API_KEY,
  BREVO_SENDER_EMAIL,
  BREVO_SENDER_NAME,
  NODE_ENV,
} from '@/config/env';
import { logger } from '@/utils/logger';
import { sendBrevoTransactionalEmail } from '@/services/brevo-smtp.service';

const TOKEN_BYTES = 32;
const DEFAULT_EXPIRY_MINUTES = 60;

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

export class PasswordResetService {
  /**
   * Create a reset token for the user. Returns the plain token (to send in link)
   * and expiresAt. Caller should send the link to the user (email or dev log).
   */
  async createToken(userId: string, expiryMinutes: number = DEFAULT_EXPIRY_MINUTES): Promise<{ token: string; expiresAt: Date }> {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const tokenHash = hashToken(token);
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );
    return { token, expiresAt };
  }

  /**
   * Find user_id for a valid, unused, non-expired token. Returns null if invalid.
   */
  async getUserIdForToken(token: string): Promise<string | null> {
    const tokenHash = hashToken(token);
    const result = await pool.query<{ user_id: string }>(
      `SELECT user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP
       LIMIT 1`,
      [tokenHash]
    );
    return result.rows[0]?.user_id ?? null;
  }

  /**
   * Invalidate all unused reset tokens for a user (e.g. after in-app password change).
   * Prevents a stale email link from resetting the password after the user already changed it.
   */
  async invalidateAllActiveTokensForUser(userId: string): Promise<void> {
    await pool.query(
      `UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND used_at IS NULL`,
      [userId]
    );
  }

  /**
   * Mark token as used so it cannot be reused.
   */
  async consumeToken(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    await pool.query(
      `UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token_hash = $1`,
      [tokenHash]
    );
  }

  /**
   * Send password reset email via Brevo when configured; otherwise dev log or warn.
   */
  async sendResetEmail(email: string, resetLink: string): Promise<void> {
    const maskedEmail = email.replace(/(?<=.{2}).(?=@)/g, '*');
    const safeLink = resetLink.replace(/([?&]token=)[^&]+/i, '$1[REDACTED]');

    if (BREVO_API_KEY && BREVO_SENDER_EMAIL) {
      const senderName = BREVO_SENDER_NAME?.trim() || 'MemoOn Card';
      const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #0f172a;">
 <p>You requested a password reset for your MemoOn Card account.</p>
  <p><a href="${escapeHtmlAttr(resetLink)}">Reset your password</a></p>
  <p style="font-size: 0.875rem; color: #64748b;">This link expires in about one hour. If you did not request this, you can ignore this email.</p>
</body>
</html>`.trim();

      try {
        await sendBrevoTransactionalEmail({
          apiKey: BREVO_API_KEY,
          senderEmail: BREVO_SENDER_EMAIL,
          senderName,
          toEmail: email,
          subject: 'Reset your MemoOn Card password',
          htmlContent,
        });
        logger.info('Password reset email sent via Brevo', { email: maskedEmail });
      } catch (err) {
        logger.error('Brevo password reset send failed', {
          email: maskedEmail,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      if (NODE_ENV === 'development') {
        logger.info('Password reset link (dev reference, token redacted)', {
          email: maskedEmail,
          resetLink: safeLink,
        });
      }
      return;
    }

    if (NODE_ENV === 'development') {
      logger.info('Password reset link (dev only; set BREVO_API_KEY and BREVO_SENDER_EMAIL to send email)', {
        email: maskedEmail,
        resetLink: safeLink,
      });
      return;
    }

    logger.warn('Password reset email not sent: set BREVO_API_KEY and BREVO_SENDER_EMAIL', {
      email: maskedEmail,
    });
  }
}

export const passwordResetService = new PasswordResetService();
