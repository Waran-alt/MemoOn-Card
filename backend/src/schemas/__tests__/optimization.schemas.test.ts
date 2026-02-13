import { describe, expect, it } from 'vitest';
import { OptimizeWeightsSchema } from '../optimization.schemas';

describe('OptimizeWeightsSchema', () => {
  it('accepts empty body', () => {
    const result = OptimizeWeightsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({});
    }
  });

  it('accepts valid optional fields', () => {
    const result = OptimizeWeightsSchema.safeParse({
      timezone: 'Europe/Paris',
      dayStart: 4,
      targetRetention: 0.9,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        timezone: 'Europe/Paris',
        dayStart: 4,
        targetRetention: 0.9,
      });
    }
  });

  it('rejects dayStart out of range', () => {
    expect(OptimizeWeightsSchema.safeParse({ dayStart: -1 }).success).toBe(false);
    expect(OptimizeWeightsSchema.safeParse({ dayStart: 24 }).success).toBe(false);
  });

  it('rejects targetRetention out of range', () => {
    expect(OptimizeWeightsSchema.safeParse({ targetRetention: 0.4 }).success).toBe(false);
    expect(OptimizeWeightsSchema.safeParse({ targetRetention: 1 }).success).toBe(false);
  });

  it('accepts targetRetention at boundaries', () => {
    expect(OptimizeWeightsSchema.safeParse({ targetRetention: 0.5 }).success).toBe(true);
    expect(OptimizeWeightsSchema.safeParse({ targetRetention: 0.99 }).success).toBe(true);
  });
});
