/**
 * Tests for `ensureDevUser` startup helper.
 *
 * `devEnv` is `vi.hoisted` so the `@/config/env` mock can return a live object whose properties
 * we mutate between tests. `ensureDevUser` reads those properties when the module is loaded, so each
 * scenario calls `loadEnsureDevUser()` after setting `devEnv.*` to pick up the right values.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Mutable stand-in for process env fragment; Vitest mock returns this object by reference. */
const devEnv = vi.hoisted(() => ({
  DEV_EMAIL: undefined as string | undefined,
  DEV_PASSWORD: undefined as string | undefined,
  DEV_USERNAME: undefined as string | undefined,
}));

const getUserByEmail = vi.fn();
const updateUserToDev = vi.fn();
const createUser = vi.fn();
const loggerInfo = vi.fn();

vi.mock('@/config/env', () => devEnv);

vi.mock('@/services/user.service', () => ({
  userService: {
    getUserByEmail,
    updateUserToDev,
    createUser,
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: { info: loggerInfo },
}));

/** Force a fresh module instance so imported DEV_* match current devEnv. */
async function loadEnsureDevUser() {
  vi.resetModules();
  return import('./ensureDevUser');
}

describe('ensureDevUser', () => {
  beforeEach(() => {
    devEnv.DEV_EMAIL = undefined;
    devEnv.DEV_PASSWORD = undefined;
    devEnv.DEV_USERNAME = undefined;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('no-ops when DEV_EMAIL or DEV_PASSWORD is unset', async () => {
    const { ensureDevUser } = await loadEnsureDevUser();
    await ensureDevUser();
    expect(loggerInfo).toHaveBeenCalledWith('Dev account skipped (DEV_EMAIL or DEV_PASSWORD not set)');
    expect(getUserByEmail).not.toHaveBeenCalled();
  });

  it('updates existing user when DEV_* are set', async () => {
    devEnv.DEV_EMAIL = 'dev@example.com';
    devEnv.DEV_PASSWORD = 'secret-pass';
    devEnv.DEV_USERNAME = 'Dev';
    getUserByEmail.mockResolvedValueOnce({ id: 'u1', email: 'dev@example.com' });
    updateUserToDev.mockResolvedValueOnce(undefined);

    const { ensureDevUser } = await loadEnsureDevUser();
    await ensureDevUser();

    expect(updateUserToDev).toHaveBeenCalledWith('u1', 'secret-pass', 'Dev');
    expect(loggerInfo).toHaveBeenCalledWith('Dev account updated', { email: 'dev@example.com' });
    expect(createUser).not.toHaveBeenCalled();
  });

  it('creates user when email not found', async () => {
    devEnv.DEV_EMAIL = 'newdev@example.com';
    devEnv.DEV_PASSWORD = 'pw';
    devEnv.DEV_USERNAME = undefined;
    getUserByEmail.mockResolvedValueOnce(null);
    createUser.mockResolvedValueOnce(undefined);

    const { ensureDevUser } = await loadEnsureDevUser();
    await ensureDevUser();

    // Fourth arg `'dev'` is the role assigned to the bootstrap account.
    expect(createUser).toHaveBeenCalledWith('newdev@example.com', 'pw', null, 'dev');
    expect(loggerInfo).toHaveBeenCalledWith('Dev account created', { email: 'newdev@example.com' });
  });
});
