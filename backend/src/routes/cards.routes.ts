import { Router } from 'express';
import { CardService } from '../services/card.service';
import { ReviewService } from '../services/review.service';
import { getUserId } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, validateParams, validateQuery } from '../middleware/validation';
import {
  CreateCardSchema,
  UpdateCardSchema,
  ReviewCardSchema,
  CardIdSchema,
  DeckIdParamSchema,
  GetCardsQuerySchema,
} from '../schemas/card.schemas';
import { NotFoundError, ValidationError } from '../utils/errors';
import { API_LIMITS } from '../constants/app.constants';

const router = Router();
const cardService = new CardService();
const reviewService = new ReviewService();

/**
 * GET /api/decks/:deckId/cards
 * Get all cards in a deck
 */
router.get('/decks/:deckId/cards', validateParams(DeckIdParamSchema), asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const deckId = String(req.params.deckId);
  const cards = await cardService.getCardsByDeckId(deckId, userId);
  return res.json({ success: true, data: cards });
}));

/**
 * GET /api/decks/:deckId/cards/due
 * Get due cards for a deck
 */
router.get('/decks/:deckId/cards/due', validateParams(DeckIdParamSchema), asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const deckId = String(req.params.deckId);
  const cards = await cardService.getDueCards(deckId, userId);
  return res.json({ success: true, data: cards });
}));

/**
 * GET /api/decks/:deckId/cards/new
 * Get new cards (not yet reviewed)
 */
router.get('/decks/:deckId/cards/new', validateParams(DeckIdParamSchema), validateQuery(GetCardsQuerySchema), asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const deckId = String(req.params.deckId);
  const limit = typeof req.query.limit === 'number' ? req.query.limit : API_LIMITS.DEFAULT_CARD_LIMIT;
  const cards = await cardService.getNewCards(deckId, userId, limit);
  return res.json({ success: true, data: cards });
}));

/**
 * POST /api/decks/:deckId/cards
 * Create a new card
 */
router.post('/decks/:deckId/cards', validateParams(DeckIdParamSchema), validateRequest(CreateCardSchema), asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const deckId = String(req.params.deckId);
  const card = await cardService.createCard(deckId, userId, req.body);
  return res.status(201).json({ success: true, data: card });
}));

/**
 * GET /api/cards/:id
 * Get a specific card
 */
router.get('/:id', validateParams(CardIdSchema), asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const cardId = String(req.params.id);
  const card = await cardService.getCardById(cardId, userId);
  
  if (!card) {
    throw new NotFoundError('Card');
  }
  
  return res.json({ success: true, data: card });
}));

/**
 * PUT /api/cards/:id
 * Update a card
 */
router.put('/:id', validateParams(CardIdSchema), validateRequest(UpdateCardSchema), asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const cardId = String(req.params.id);
  const card = await cardService.updateCard(cardId, userId, req.body);
  
  if (!card) {
    throw new NotFoundError('Card');
  }
  
  return res.json({ success: true, data: card });
}));

/**
 * DELETE /api/cards/:id
 * Delete a card
 */
router.delete('/:id', validateParams(CardIdSchema), asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const cardId = String(req.params.id);
  const deleted = await cardService.deleteCard(cardId, userId);
  
  if (!deleted) {
    throw new NotFoundError('Card');
  }
  
  return res.json({ success: true, message: 'Card deleted' });
}));

/**
 * POST /api/cards/:id/review
 * Review a card (update FSRS state)
 */
router.post('/:id/review', validateParams(CardIdSchema), validateRequest(ReviewCardSchema), asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const cardId = String(req.params.id);
  const rating = req.body.rating;
  
  if (![1, 2, 3, 4].includes(rating)) {
    throw new ValidationError('Valid rating (1-4) is required');
  }
  
  const result = await reviewService.reviewCard(cardId, userId, rating);
  
  if (!result) {
    throw new NotFoundError('Card');
  }
  
  return res.json({ success: true, data: result });
}));

/**
 * POST /api/cards/:id/reset-stability
 * Reset card stability (treat as new)
 */
router.post('/:id/reset-stability', validateParams(CardIdSchema), asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const cardId = String(req.params.id);
  const card = await cardService.resetCardStability(cardId, userId);
  
  if (!card) {
    throw new NotFoundError('Card');
  }
  
  return res.json({ success: true, data: card });
}));

export default router;
