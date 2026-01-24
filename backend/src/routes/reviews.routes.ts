import { Request, Response, Router } from 'express';
import { ReviewService } from '../services/review.service';

const router = Router();
const reviewService = new ReviewService();

// Get user ID from request (for now, using a placeholder - will add auth later)
const getUserId = (req: Request): string => {
  // TODO: Extract from JWT token
  return (req.headers['x-user-id'] as string) || '00000000-0000-0000-0000-000000000000';
};

/**
 * POST /api/reviews/batch
 * Batch review multiple cards
 */
router.post('/batch', async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = getUserId(req);
    const reviews = req.body.reviews as Array<{ cardId: string; rating: 1 | 2 | 3 | 4 }>;
    
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Reviews array is required',
      });
    }
    
    // Validate each review
    for (const review of reviews) {
      if (!review.cardId || ![1, 2, 3, 4].includes(review.rating)) {
        return res.status(400).json({
          success: false,
          error: 'Each review must have cardId and valid rating (1-4)',
        });
      }
    }
    
    const results = await reviewService.batchReview(reviews, userId);
    return res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error batch reviewing cards:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
