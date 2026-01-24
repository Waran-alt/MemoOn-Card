import { Request, Response, Router } from 'express';
import { CardService } from '../services/card.service';
import { ReviewService } from '../services/review.service';
import { CreateCardRequest, ReviewCardRequest, UpdateCardRequest } from '../types/database';

const router = Router();
const cardService = new CardService();
const reviewService = new ReviewService();

// Get user ID from request (for now, using a placeholder - will add auth later)
const getUserId = (req: Request): string => {
  // TODO: Extract from JWT token
  return (req.headers['x-user-id'] as string) || '00000000-0000-0000-0000-000000000000';
};

// Helper to safely extract string from query parameters (handles ParsedQs type)
const getStringParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] || '';
  }
  return value || '';
};

/**
 * GET /api/decks/:deckId/cards
 * Get all cards in a deck
 */
router.get('/decks/:deckId/cards', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const deckId = getStringParam(req.params.deckId);
    const cards = await cardService.getCardsByDeckId(deckId, userId);
    return res.json({ success: true, data: cards });
  } catch (error) {
    console.error('Error getting cards:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/decks/:deckId/cards/due
 * Get due cards for a deck
 */
router.get('/decks/:deckId/cards/due', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const deckId = getStringParam(req.params.deckId);
    const cards = await cardService.getDueCards(deckId, userId);
    return res.json({ success: true, data: cards });
  } catch (error) {
    console.error('Error getting due cards:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/decks/:deckId/cards/new
 * Get new cards (not yet reviewed)
 */
router.get('/decks/:deckId/cards/new', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const deckId = getStringParam(req.params.deckId);
    const limitStr = getStringParam(req.query.limit as string | string[] | undefined);
    const limit = parseInt(limitStr) || 20;
    const cards = await cardService.getNewCards(deckId, userId, limit);
    return res.json({ success: true, data: cards });
  } catch (error) {
    console.error('Error getting new cards:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/decks/:deckId/cards
 * Create a new card
 */
router.post('/decks/:deckId/cards', async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = getUserId(req);
    const data: CreateCardRequest = req.body;
    
    if (!data.recto || !data.verso) {
      return res.status(400).json({
        success: false,
        error: 'Recto and verso are required',
      });
    }
    
    const deckId = getStringParam(req.params.deckId);
    const card = await cardService.createCard(deckId, userId, data);
    return res.status(201).json({ success: true, data: card });
  } catch (error) {
    console.error('Error creating card:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/cards/:id
 * Get a specific card
 */
router.get('/:id', async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = getUserId(req);
    const cardId = getStringParam(req.params.id);
    const card = await cardService.getCardById(cardId, userId);
    
    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found',
      });
    }
    
    return res.json({ success: true, data: card });
  } catch (error) {
    console.error('Error getting card:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/cards/:id
 * Update a card
 */
router.put('/:id', async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = getUserId(req);
    const cardId = getStringParam(req.params.id);
    const data: UpdateCardRequest = req.body;
    const card = await cardService.updateCard(cardId, userId, data);
    
    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found',
      });
    }
    
    return res.json({ success: true, data: card });
  } catch (error) {
    console.error('Error updating card:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/cards/:id
 * Delete a card
 */
router.delete('/:id', async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = getUserId(req);
    const cardId = getStringParam(req.params.id);
    const deleted = await cardService.deleteCard(cardId, userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Card not found',
      });
    }
    
    return res.json({ success: true, message: 'Card deleted' });
  } catch (error) {
    console.error('Error deleting card:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/cards/:id/review
 * Review a card (update FSRS state)
 */
router.post('/:id/review', async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = getUserId(req);
    const data: ReviewCardRequest = req.body;
    
    if (!data.rating || ![1, 2, 3, 4].includes(data.rating)) {
      return res.status(400).json({
        success: false,
        error: 'Valid rating (1-4) is required',
      });
    }
    
    const cardId = getStringParam(req.params.id);
    const result = await reviewService.reviewCard(cardId, userId, data.rating);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Card not found',
      });
    }
    
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error reviewing card:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/cards/:id/reset-stability
 * Reset card stability (treat as new)
 */
router.post('/:id/reset-stability', async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = getUserId(req);
    const cardId = getStringParam(req.params.id);
    const card = await cardService.resetCardStability(cardId, userId);
    
    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found',
      });
    }
    
    return res.json({ success: true, data: card });
  } catch (error) {
    console.error('Error resetting card stability:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
