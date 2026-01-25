/**
 * Authentication Middleware
 * 
 * JWT token verification and user authentication
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_ACCESS_EXPIRES_IN, JWT_EXPIRES_IN } from '../config/env';
import { AuthenticationError } from '../utils/errors';
import { HTTP_HEADERS } from '../constants/http.constants';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      requestId?: string;
    }
  }
}

export interface JWTPayload {
  userId: string;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware
 * Verifies JWT token and extracts user ID
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }
    
    const token = authHeader.substring(HTTP_HEADERS.BEARER_PREFIX_LENGTH); // Remove 'Bearer ' prefix
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token is required',
      });
      return;
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      if (!decoded.userId) {
        res.status(401).json({
          success: false,
          error: 'Invalid token payload',
        });
        return;
      }
      
      // Attach user ID to request
      req.userId = decoded.userId;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Token has expired',
        });
        return;
      } else if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
        });
        return;
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
      return;
    }
    
    // Unexpected error
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user ID if token is present, but doesn't require it
 */
export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(HTTP_HEADERS.BEARER_PREFIX_LENGTH);
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        if (decoded.userId) {
          req.userId = decoded.userId;
        }
      } catch {
        // Ignore invalid tokens in optional auth
      }
    }
    
    next();
  } catch {
    // Continue without authentication
    next();
  }
}

/**
 * Helper to get user ID from request
 * Throws error if not authenticated
 */
export function getUserId(req: Request): string {
  if (!req.userId) {
    throw new AuthenticationError('User not authenticated');
  }
  return req.userId;
}

/**
 * Generate JWT access token for user (short-lived)
 */
export function generateAccessToken(userId: string, email?: string): string {
  const payload: JWTPayload = {
    userId,
    email,
  };
  
  // Use JWT_ACCESS_EXPIRES_IN, fallback to legacy JWT_EXPIRES_IN, then default
  const expiresIn = JWT_ACCESS_EXPIRES_IN || JWT_EXPIRES_IN || '15m';
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
  } as jwt.SignOptions);
}

/**
 * Generate JWT refresh token for user (long-lived)
 */
export function generateRefreshToken(userId: string): string {
  const payload: JWTPayload = {
    userId,
  };
  
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
  } as jwt.SignOptions);
}

/**
 * Generate JWT token for user (legacy - use generateAccessToken instead)
 * @deprecated Use generateAccessToken() for new code
 */
export function generateToken(userId: string, email?: string): string {
  return generateAccessToken(userId, email);
}
