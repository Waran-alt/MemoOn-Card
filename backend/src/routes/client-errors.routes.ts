/**
 * Ingest browser errors for self-hosted log pipelines (stdout JSON → Promtail → Loki).
 * Public, no auth; CSRF applies (mounted under /api after csrfProtection). Tight rate limit.
 */
import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest } from '@/middleware/validation';
import { ClientErrorReportSchema, type ClientErrorReport } from '@/schemas/client-errors.schemas';
import { logger } from '@/utils/logger';

const router = Router();

const ingestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  message: { success: false, error: 'Too many client error reports' },
  standardHeaders: true,
  legacyHeaders: false,
});

function stripUrlForLog(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url.slice(0, 256);
  }
}

router.post(
  '/',
  ingestLimiter,
  validateRequest(ClientErrorReportSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as ClientErrorReport;
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.warn('Client error report', {
      event: 'client_error',
      requestId,
      source: body.source,
      message: body.message,
      ...(body.stack ? { stack: body.stack } : {}),
      ...(body.pageUrl ? { pageUrl: stripUrlForLog(body.pageUrl) } : {}),
      ...(body.componentStack ? { componentStack: body.componentStack.slice(0, 4000) } : {}),
    });
    res.status(204).end();
  })
);

export default router;
