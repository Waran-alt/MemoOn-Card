/**
 * JWT algorithm pinned for sign/verify (defense in depth vs algorithm confusion).
 */

import type { SignOptions, VerifyOptions } from 'jsonwebtoken';

export const JWT_SIGN_OPTIONS_BASE: Pick<SignOptions, 'algorithm'> = {
  algorithm: 'HS256',
};

export const JWT_VERIFY_OPTIONS: VerifyOptions = {
  algorithms: ['HS256'],
};
