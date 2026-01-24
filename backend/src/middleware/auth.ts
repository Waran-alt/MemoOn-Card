import { Request, Response, NextFunction } from 'express';

/**
 * Authentication middleware (placeholder)
 * 
 * TODO: Implement JWT token verification
 * For now, this extracts user ID from header or uses a default
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // TODO: Extract and verify JWT token
  // For now, allow x-user-id header for development
  const userId = req.headers['x-user-id'] as string;
  
  if (!userId) {
    // In development, allow requests without auth
    // In production, this should return 401
    if (process.env.NODE_ENV === 'production') {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }
  }
  
  // Attach user ID to request for use in routes
  (req as any).userId = userId || '00000000-0000-0000-0000-000000000000';
  next();
}

/**
 * Helper to get user ID from request
 */
export function getUserId(req: Request): string {
  return (req as any).userId || '00000000-0000-0000-0000-000000000000';
}
