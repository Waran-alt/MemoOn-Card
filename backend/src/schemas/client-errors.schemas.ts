import { z } from 'zod';

/** Browser-reported errors; sizes capped for log safety (Loki / PII). */
export const ClientErrorReportSchema = z
  .object({
    source: z.enum(['window', 'unhandledrejection', 'react']),
    message: z.string().min(1).max(500),
    stack: z.string().max(12000).optional(),
    pageUrl: z.string().max(2048).optional(),
    componentStack: z.string().max(8000).optional(),
  })
  .strict();

export type ClientErrorReport = z.infer<typeof ClientErrorReportSchema>;
