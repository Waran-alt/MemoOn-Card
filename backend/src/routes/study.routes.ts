import { Router } from 'express';
import { getUserId } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateParams, validateQuery, validateRequest } from '@/middleware/validation';
import {
  JourneyConsistencyQuerySchema,
  StudyEventsBatchSchema,
  StudySessionDetailQuerySchema,
  StudySessionHistoryQuerySchema,
  StudySessionIdParamSchema,
} from '@/schemas/card.schemas';
import { CardJourneyService } from '@/services/card-journey.service';
import { StudyEventsService } from '@/services/study-events.service';

const router = Router();
const studyEventsService = new StudyEventsService();
const cardJourneyService = new CardJourneyService();

type RequestWithValidatedQuery = Express.Request & {
  validatedQuery?: {
    days?: number;
    limit?: number;
    offset?: number;
    eventLimit?: number;
    sampleLimit?: number;
  };
};
type RequestWithValidatedParams = Express.Request & {
  validatedParams?: { sessionId?: string };
};

/**
 * POST /api/study/events
 * Persist study action events (append-only, idempotent with client_event_id)
 */
router.post(
  '/events',
  validateRequest(StudyEventsBatchSchema),
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const { events } = req.body;
    await studyEventsService.logEvents(userId, events);
    return res.status(202).json({ success: true, accepted: events.length });
  })
);

router.get(
  '/sessions',
  validateQuery(StudySessionHistoryQuerySchema),
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const query = req as RequestWithValidatedQuery;
    const days = query.validatedQuery?.days ?? 30;
    const limit = query.validatedQuery?.limit ?? 50;
    const offset = query.validatedQuery?.offset ?? 0;
    const rows = await studyEventsService.getSessionHistory(userId, { days, limit, offset });
    return res.json({ success: true, data: { days, limit, offset, rows } });
  })
);

router.get(
  '/sessions/:sessionId',
  validateParams(StudySessionIdParamSchema),
  validateQuery(StudySessionDetailQuerySchema),
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const params = req as RequestWithValidatedParams;
    const query = req as RequestWithValidatedQuery;
    const rawSessionId = params.validatedParams?.sessionId ?? req.params.sessionId;
    const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;
    const eventLimit = query.validatedQuery?.eventLimit ?? 300;
    const detail = await studyEventsService.getSessionDetail(userId, sessionId, { eventLimit });
    if (!detail) {
      return res.status(404).json({ success: false, message: 'Study session not found' });
    }
    return res.json({ success: true, data: detail });
  })
);

router.get(
  '/journey-consistency',
  validateQuery(JourneyConsistencyQuerySchema),
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const query = req as RequestWithValidatedQuery;
    const report = await cardJourneyService.getJourneyConsistencyReport(userId, {
      days: query.validatedQuery?.days,
      sampleLimit: query.validatedQuery?.sampleLimit,
    });
    return res.json({ success: true, data: report });
  })
);

export default router;
