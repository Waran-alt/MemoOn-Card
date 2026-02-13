import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card } from '@/types/database';
import { ReviewService } from '@/services/review.service';
import { pool } from '@/config/database';
import * as fsrsModule from '@/services/fsrs.service';
import { FSRS_CONSTANTS, FSRS_V6_DEFAULT_WEIGHTS } from '@/constants/fsrs.constants';

vi.mock('@/config/database', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('ReviewService', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const cardId = '22222222-2222-4222-8222-222222222222';
  let service: ReviewService;

  beforeEach(() => {
    service = new ReviewService();
    vi.clearAllMocks();
  });

  it('returns default settings when user settings do not exist', async () => {
    (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows: [] });

    const result = await service.getUserSettings(userId);

    expect(result.targetRetention).toBe(FSRS_CONSTANTS.DEFAULT_TARGET_RETENTION);
    expect(result.weights).toEqual(FSRS_V6_DEFAULT_WEIGHTS);
  });

  it('pads weights to 21 when user has fewer weights', async () => {
    (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [
        {
          fsrs_weights: [1, 2, 3],
          target_retention: 0.92,
        },
      ],
    });

    const result = await service.getUserSettings(userId);

    expect(result.targetRetention).toBe(0.92);
    expect(result.weights).toHaveLength(21);
    expect(result.weights.slice(0, 3)).toEqual([1, 2, 3]);
    expect(result.weights[20]).toBe(1);
  });

  it('returns null when card is not found', async () => {
    const serviceAccess = service as unknown as {
      cardService: { getCardById: (cardId: string, userId: string) => Promise<Card | null> };
    };
    serviceAccess.cardService = {
      getCardById: vi.fn().mockResolvedValue(null),
    };

    const result = await service.reviewCard(cardId, userId, 3);
    expect(result).toBeNull();
  });

  it('reviews card, updates state, and logs review', async () => {
    const card: Card = {
      id: cardId,
      deck_id: '33333333-3333-4333-8333-333333333333',
      user_id: userId,
      recto: 'Q',
      verso: 'A',
      comment: null,
      recto_image: null,
      verso_image: null,
      recto_formula: false,
      verso_formula: false,
      reverse: true,
      stability: 2,
      difficulty: 5,
      last_review: new Date(Date.now() - 86400000),
      next_review: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    const mockedReview = {
      state: {
        stability: 3,
        difficulty: 4.5,
        lastReview: new Date(),
        nextReview: new Date(Date.now() + 86400000),
      },
      interval: 3,
      retrievability: 0.8,
    };

    const serviceAccess = service as unknown as {
      cardService: {
        getCardById: (cardId: string, userId: string) => Promise<Card | null>;
        updateCardState: (cardId: string, userId: string, state: unknown) => Promise<void>;
      };
    };
    serviceAccess.cardService = {
      getCardById: vi.fn().mockResolvedValue(card),
      updateCardState: vi.fn().mockResolvedValue(undefined),
    };
    vi.spyOn(service, 'getUserSettings').mockResolvedValue({
      weights: [...FSRS_V6_DEFAULT_WEIGHTS],
      targetRetention: 0.9,
    });
    vi.spyOn(fsrsModule, 'createFSRS').mockReturnValue({
      reviewCard: vi.fn().mockReturnValue(mockedReview),
      calculateRetrievability: vi.fn().mockReturnValue(0.9),
    } as unknown as ReturnType<typeof fsrsModule.createFSRS>);
    (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });

    const result = await service.reviewCard(cardId, userId, 3);

    expect(result).toEqual(mockedReview);
    expect(serviceAccess.cardService.updateCardState).toHaveBeenCalledWith(cardId, userId, mockedReview.state);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO review_logs'),
      expect.arrayContaining([cardId, userId, 3, 3])
    );
  });

  it('batchReview processes all cards and preserves order', async () => {
    const reviewSpy = vi
      .spyOn(service, 'reviewCard')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        state: {
          stability: 2,
          difficulty: 4,
          lastReview: new Date(),
          nextReview: new Date(),
        },
        interval: 2,
        retrievability: 0.7,
        message: 'ok',
      });

    const result = await service.batchReview(
      [
        { cardId: 'card-1', rating: 1 },
        { cardId: 'card-2', rating: 4 },
      ],
      userId
    );

    expect(reviewSpy).toHaveBeenNthCalledWith(1, 'card-1', userId, 1);
    expect(reviewSpy).toHaveBeenNthCalledWith(2, 'card-2', userId, 4);
    expect(result).toHaveLength(2);
    expect(result[0].cardId).toBe('card-1');
    expect(result[1].cardId).toBe('card-2');
  });
});
