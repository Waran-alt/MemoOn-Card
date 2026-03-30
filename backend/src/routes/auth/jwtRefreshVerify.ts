import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/config/env';
import { JWT_VERIFY_OPTIONS } from '@/constants/security-jwt.constants';
import type { JWTPayload } from '@/middleware/auth';

export function verifyRefreshJwt(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET, JWT_VERIFY_OPTIONS) as unknown as JWTPayload;
}
