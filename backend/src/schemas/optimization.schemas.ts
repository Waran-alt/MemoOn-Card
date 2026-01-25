/**
 * Optimization Validation Schemas
 */

import { z } from 'zod';

export const OptimizeWeightsSchema = z.object({
  timezone: z.string().optional(),
  dayStart: z.number().int().min(0).max(23).optional(),
  targetRetention: z.number().min(0.5).max(0.99).optional(),
});
