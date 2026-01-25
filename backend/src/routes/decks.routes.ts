import { Router } from 'express';
import { DeckService } from '../services/deck.service';
import { getUserId } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, validateParams } from '../middleware/validation';
import { CreateDeckSchema, UpdateDeckSchema, DeckIdSchema } from '../schemas/deck.schemas';
import { NotFoundError } from '../utils/errors';

const router = Router();
const deckService = new DeckService();

/**
 * GET /api/decks
 * Get all decks for the current user
 */
router.get('/', asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const decks = await deckService.getDecksByUserId(userId);
  return res.json({ success: true, data: decks });
}));

/**
 * GET /api/decks/:id
 * Get a specific deck
 */
router.get('/:id', validateParams(DeckIdSchema), asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const deckId = String(req.params.id);
  const deck = await deckService.getDeckById(deckId, userId);
  
  if (!deck) {
    throw new NotFoundError('Deck');
  }
  
  return res.json({ success: true, data: deck });
}));

/**
 * POST /api/decks
 * Create a new deck
 */
router.post('/', validateRequest(CreateDeckSchema), asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const deck = await deckService.createDeck(userId, req.body);
  return res.status(201).json({ success: true, data: deck });
}));

/**
 * PUT /api/decks/:id
 * Update a deck
 */
router.put('/:id', validateParams(DeckIdSchema), validateRequest(UpdateDeckSchema), asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const deckId = String(req.params.id);
  const deck = await deckService.updateDeck(deckId, userId, req.body);
  
  if (!deck) {
    throw new NotFoundError('Deck');
  }
  
  return res.json({ success: true, data: deck });
}));

/**
 * DELETE /api/decks/:id
 * Delete a deck
 */
router.delete('/:id', validateParams(DeckIdSchema), asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const deckId = String(req.params.id);
  const deleted = await deckService.deleteDeck(deckId, userId);
  
  if (!deleted) {
    throw new NotFoundError('Deck');
  }
  
  return res.json({ success: true, message: 'Deck deleted' });
}));

/**
 * GET /api/decks/:id/stats
 * Get deck statistics
 */
router.get('/:id/stats', validateParams(DeckIdSchema), asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const deckId = String(req.params.id);
  const stats = await deckService.getDeckStats(deckId, userId);
  return res.json({ success: true, data: stats });
}));

export default router;
