/**
 * Tests for authentication middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, generateAccessToken, generateRefreshToken, getUserId, JWTPayload } from '@/middleware/auth';
import { JWT_VERIFY_OPTIONS } from '@/constants/security-jwt.constants';
import { AuthenticationError } from '@/utils/errors';

// Mock JWT_SECRET
vi.mock('@/config/env', () => ({
  JWT_SECRET: 'test-secret-key-minimum-32-characters-long',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  JWT_REFRESH_TRUSTED_EXPIRES_IN: '30d',
}));

vi.mock('@/config/database', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('authMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  it('should reject request without Authorization header', () => {
    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    expect((mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0].message).toBe('No token provided');
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should reject request with invalid Authorization format', () => {
    mockRequest.headers = {
      authorization: 'InvalidFormat token123',
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    expect((mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0].message).toBe('No token provided');
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should reject request with empty token', () => {
    mockRequest.headers = {
      authorization: 'Bearer ',
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    expect((mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0].message).toBe('Token is required');
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should reject request with invalid token', () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid-token',
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    expect((mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0].message).toBe('Invalid token');
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should accept valid token and attach userId', () => {
    const userId = 'user-123';
    const token = generateAccessToken(userId);

    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.userId).toBe(userId);
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should reject expired token', () => {
    const userId = 'user-123';
    const token = jwt.sign(
      { userId },
      'test-secret-key-minimum-32-characters-long',
      { expiresIn: '-1h' }
    );

    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    expect((mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0].message).toBe('Token has expired');
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should reject token without userId', () => {
    const token = jwt.sign(
      {},
      'test-secret-key-minimum-32-characters-long',
      { expiresIn: '15m' }
    );

    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    expect((mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0].message).toBe('Invalid token payload');
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});

describe('generateAccessToken', () => {
  it('should generate valid JWT token', () => {
    const userId = 'user-123';
    const token = generateAccessToken(userId);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = jwt.verify(
      token,
      'test-secret-key-minimum-32-characters-long',
      JWT_VERIFY_OPTIONS
    ) as JWTPayload;
    expect(decoded.userId).toBe(userId);
  });

  it('should include email if provided', () => {
    const userId = 'user-123';
    const email = 'test@example.com';
    const token = generateAccessToken(userId, email);

    const decoded = jwt.verify(
      token,
      'test-secret-key-minimum-32-characters-long',
      JWT_VERIFY_OPTIONS
    ) as JWTPayload;
    expect(decoded.email).toBe(email);
  });
});

describe('generateRefreshToken', () => {
  it('should generate valid refresh token', () => {
    const userId = 'user-123';
    const token = generateRefreshToken(userId);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = jwt.verify(
      token,
      'test-secret-key-minimum-32-characters-long',
      JWT_VERIFY_OPTIONS
    ) as JWTPayload;
    expect(decoded.userId).toBe(userId);
    expect(decoded.td).toBeUndefined();
  });

  it('should set td claim and longer expiry when trustedDevice', () => {
    const userId = 'user-123';
    const shortTok = generateRefreshToken(userId);
    const longTok = generateRefreshToken(userId, { trustedDevice: true });
    const shortDecoded = jwt.decode(shortTok) as JWTPayload;
    const longDecoded = jwt.decode(longTok) as JWTPayload;
    expect(longDecoded.td).toBe(true);
    expect(shortDecoded.exp && longDecoded.exp && longDecoded.exp > shortDecoded.exp).toBe(true);
  });
});

describe('getUserId', () => {
  it('should return userId from request', () => {
    const mockRequest = {
      userId: 'user-123',
    } as Request;

    expect(getUserId(mockRequest)).toBe('user-123');
  });

  it('should throw AuthenticationError if userId not present', () => {
    const mockRequest = {} as Request;

    expect(() => getUserId(mockRequest)).toThrow(AuthenticationError);
    expect(() => getUserId(mockRequest)).toThrow('User not authenticated');
  });
});
