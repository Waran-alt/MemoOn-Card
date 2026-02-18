import { z } from 'zod';

export const AdminFlagKeyParamSchema = z.object({
  flagKey: z.string().regex(/^[a-z_][a-z0-9_]{2,63}$/),
});

export const AdminUserIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

export const AdminUpdateFeatureFlagSchema = z.object({
  enabled: z.boolean(),
  rolloutPercentage: z.number().int().min(0).max(100),
  description: z.string().max(255).optional().nullable(),
});

export const AdminUpsertFeatureFlagOverrideSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().max(128).optional().nullable(),
});

export const AdminOverridesQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(
    z.number().int().min(1).max(200)
  ).optional(),
});
