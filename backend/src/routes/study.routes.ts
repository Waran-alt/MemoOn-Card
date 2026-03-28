import { Router } from 'express';
import { getUserId } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateQuery } from '@/middleware/validation';
import {
  JourneyConsistencyQuerySchema,
  StudyHealthDashboardQuerySchema,
  StudyStatsQuerySchema,
} from '@/schemas/card.schemas';
import { CardJourneyService } from '@/services/card-journey.service';
import { AppError } from '@/utils/errors';
import { StudyHealthAlertsService } from '@/services/study-health-alerts.service';
import { StudyHealthDashboardService } from '@/services/study-health-dashboard.service';
import { FsrsMetricsService } from '@/services/fsrs-metrics.service';
import { CategoryService } from '@/services/category.service';

const router = Router();
const cardJourneyService = new CardJourneyService();
const studyHealthDashboardService = new StudyHealthDashboardService();
const studyHealthAlertsService = new StudyHealthAlertsService();
const fsrsMetricsService = new FsrsMetricsService();
const categoryService = new CategoryService();

type RequestWithValidatedQuery = Express.Request & {
  validatedQuery?: {
    days?: number;
    limit?: number;
    offset?: number;
    eventLimit?: number;
    sampleLimit?: number;
  };
};

router.get(
  '/journey-consistency',
  validateQuery(JourneyConsistencyQuerySchema),
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const startMs = Date.now();
    let statusCode = 200;
    const query = req as RequestWithValidatedQuery;
    try {
      const report = await cardJourneyService.getJourneyConsistencyReport(userId, {
        days: query.validatedQuery?.days,
        sampleLimit: query.validatedQuery?.sampleLimit,
      });
      return res.json({ success: true, data: report });
    } catch (error) {
      statusCode = error instanceof AppError ? error.statusCode : 500;
      throw error;
    } finally {
      void studyHealthDashboardService.recordStudyApiMetric({
        userId,
        route: '/api/study/journey-consistency',
        statusCode,
        durationMs: Date.now() - startMs,
      });
    }
  })
);

router.get(
  '/health-dashboard',
  validateQuery(StudyHealthDashboardQuerySchema),
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const query = req as RequestWithValidatedQuery;
    const days = query.validatedQuery?.days ?? 30;
    const dashboard = await studyHealthDashboardService.getDashboard(userId, days);
    return res.json({ success: true, data: dashboard });
  })
);

router.get(
  '/health-alerts',
  validateQuery(StudyHealthDashboardQuerySchema),
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const query = req as RequestWithValidatedQuery;
    const days = query.validatedQuery?.days ?? 30;
    const alerts = await studyHealthAlertsService.getAlerts(userId, days);
    return res.json({ success: true, data: alerts });
  })
);

/**
 * GET /api/study/stats
 * User-facing study stats: summary, daily breakdown, learning vs graduated counts.
 * Optional categoryId: filter to reviews of cards in that category.
 */
router.get(
  '/stats',
  validateQuery(StudyStatsQuerySchema),
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const query = req as RequestWithValidatedQuery & { validatedQuery?: { days?: number; categoryId?: string } };
    const days = query.validatedQuery?.days ?? 30;
    const categoryId = query.validatedQuery?.categoryId;

    if (categoryId) {
      const category = await categoryService.getById(categoryId, userId);
      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }
      const stats = await fsrsMetricsService.getStudyStatsByCategory(userId, days, categoryId);
      return res.json({
        success: true,
        data: {
          days,
          categoryId,
          categoryName: category.name,
          summary: stats.summary,
          daily: stats.daily,
          learningVsGraduated: stats.learningVsGraduated,
        },
      });
    }

    const [summary, daily, learningVsGraduated] = await Promise.all([
      fsrsMetricsService.getSummary(userId, days),
      fsrsMetricsService.getDailyMetrics(userId, days),
      fsrsMetricsService.getLearningVsGraduatedCounts(userId, days),
    ]);
    return res.json({
      success: true,
      data: {
        days,
        summary,
        daily,
        learningVsGraduated,
      },
    });
  })
);

export default router;
