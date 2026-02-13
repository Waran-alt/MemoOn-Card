import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OptimizationService } from '@/services/optimization.service';
import { pool } from '@/config/database';
import { logger } from '@/utils/logger';
import { OPTIMIZER_CONFIG } from '@/constants/optimization.constants';
import { ValidationError } from '@/utils/errors';

vi.mock('@/config/database', () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
  serializeError: (error: unknown) => ({ message: String(error) }),
}));

describe('OptimizationService', () => {
  let service: OptimizationService;
  let serviceAccess: {
    parseOptimizerOutput: (stdout: string, stderr: string) => number[] | null;
    getUserSettings: (userId: string) => Promise<{ last_optimized_at: Date | null }>;
    getNewReviewsSinceLast: (userId: string, lastOptimizedAt: Date | null) => Promise<number>;
  };
  const userId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    service = new OptimizationService();
    serviceAccess = service as unknown as typeof serviceAccess;
    vi.clearAllMocks();
  });

  it('rejects invalid user id in exportReviewLogsToCSV', async () => {
    await expect(service.exportReviewLogsToCSV('invalid-user-id', '/tmp/revlog.csv')).rejects.toBeInstanceOf(
      ValidationError
    );
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('parses 21 weights from JSON-like optimizer output', () => {
    const weights = Array.from({ length: 21 }, (_, i) => Number((i + 0.1).toFixed(2)));
    const stdout = `Optimizer done. Weights=${JSON.stringify(weights)}`;
    const parsed = serviceAccess.parseOptimizerOutput(stdout, '');
    expect(parsed).toEqual(weights);
  });

  it('returns null and logs when optimizer output cannot be parsed', () => {
    const parsed = serviceAccess.parseOptimizerOutput('no weights here', 'still no weights');
    expect(parsed).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });

  it('returns min review thresholds based on optimization history', () => {
    expect(service.getMinReviewCount(false)).toBe(OPTIMIZER_CONFIG.MIN_REVIEW_COUNT_FIRST);
    expect(service.getMinReviewCount(true)).toBe(OPTIMIZER_CONFIG.MIN_REVIEW_COUNT_SUBSEQUENT);
  });

  it('reports NOT_READY eligibility on first run when total reviews are below first threshold', async () => {
    vi.spyOn(serviceAccess, 'getUserSettings').mockResolvedValue({
      last_optimized_at: null,
    });
    (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ count: String(OPTIMIZER_CONFIG.MIN_REVIEW_COUNT_FIRST - 1) }],
    });

    const result = await service.getOptimizationEligibility(userId);
    expect(result.status).toBe('NOT_READY');
    expect(result.totalReviews).toBe(OPTIMIZER_CONFIG.MIN_REVIEW_COUNT_FIRST - 1);
    expect(result.newReviewsSinceLast).toBe(OPTIMIZER_CONFIG.MIN_REVIEW_COUNT_FIRST - 1);
  });

  it('reports OPTIMIZED when recent optimization has insufficient new reviews and days', async () => {
    const lastOptimizedAt = new Date(Date.now() - 2 * OPTIMIZER_CONFIG.MS_PER_DAY);
    vi.spyOn(serviceAccess, 'getUserSettings').mockResolvedValue({ last_optimized_at: lastOptimizedAt });
    vi.spyOn(serviceAccess, 'getNewReviewsSinceLast').mockResolvedValue(
      OPTIMIZER_CONFIG.MIN_REVIEW_COUNT_SUBSEQUENT - 1
    );
    (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ count: String(OPTIMIZER_CONFIG.MIN_REVIEW_COUNT_FIRST + 20) }],
    });

    const result = await service.getOptimizationEligibility(userId);
    expect(result.status).toBe('OPTIMIZED');
    expect(result.newReviewsSinceLast).toBe(OPTIMIZER_CONFIG.MIN_REVIEW_COUNT_SUBSEQUENT - 1);
    expect(result.daysSinceLast).toBeLessThan(OPTIMIZER_CONFIG.MIN_DAYS_SINCE_LAST_OPT);
  });
});
