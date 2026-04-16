/**
 * Ensures a dev user exists from env (DEV_EMAIL, DEV_PASSWORD, DEV_USERNAME).
 *
 * When to call: once the database pool is ready (e.g. after migrations), typically from `index.ts`
 * startup in controlled environments.
 *
 * Behavior:
 * - No-op (with info log) if DEV_EMAIL or DEV_PASSWORD is missing — avoids accidental dev accounts in prod.
 * - If a user with DEV_EMAIL exists: promote/update via `updateUserToDev` (password + name + role `dev`).
 * - Otherwise: `createUser(..., 'dev')` plus default settings row via user service path.
 *
 * Security: treat DEV_PASSWORD as a secret; role `dev` may unlock elevated routes (see grid 1.7 in audit doc).
 */
import { userService } from '@/services/user.service';
import { DEV_EMAIL, DEV_PASSWORD, DEV_USERNAME } from '@/config/env';
import { logger } from '@/utils/logger';

export async function ensureDevUser(): Promise<void> {
  const email = DEV_EMAIL;
  const password = DEV_PASSWORD;
  // Both required: partial config would be ambiguous (email without password or vice versa).
  if (!email || !password) {
    logger.info('Dev account skipped (DEV_EMAIL or DEV_PASSWORD not set)');
    return;
  }

  const name = DEV_USERNAME ?? null;
  const existing = await userService.getUserByEmail(email);
  if (existing) {
    await userService.updateUserToDev(existing.id, password, name);
    logger.info('Dev account updated', { email });
    return;
  }

  await userService.createUser(email, password, name, 'dev');
  logger.info('Dev account created', { email });
}
