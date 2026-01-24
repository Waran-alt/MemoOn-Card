import { Request, Response, Router } from 'express';
import { DeckService } from '../services/deck.service';
import { CreateDeckRequest } from '../types/database';

const router = Router();
const deckService = new DeckService();

// Get user ID from request (for now, using a placeholder - will add auth later)
const getUserId = (req: Request): string => {
  // TODO: Extract from JWT token
  return (req.headers['x-user-id'] as string) || '00000000-0000-0000-0000-000000000000';
};

// Helper to safely extract string from params/query (Express 5 can return string | string[])
const getStringParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] || '';
  }
  return value || '';
};

/**
 * GET /api/decks
 * Get all decks for the current user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const decks = await deckService.getDecksByUserId(userId);
    return res.json({ success: true, data: decks });
  } catch (error) {
    console.error('Error getting decks:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/decks/:id
 * Get a specific deck
 */
router.get('/:id', async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = getUserId(req);
    const deckId = getStringParam(req.params.id);
    const deck = await deckService.getDeckById(deckId, userId);
    
    if (!deck) {
      return res.status(404).json({
        success: false,
        error: 'Deck not found',
      });
    }
    
    return res.json({ success: true, data: deck });
  } catch (error) {
    console.error('Error getting deck:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/decks
 * Create a new deck
 */
router.post('/', async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = getUserId(req);
    const data: CreateDeckRequest = req.body;
    
    if (!data.title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required',
      });
    }
    
    const deck = await deckService.createDeck(userId, data);
    return res.status(201).json({ success: true, data: deck });
  } catch (error) {
    console.error('Error creating deck:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/decks/:id
 * Update a deck
 */
router.put('/:id', async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = getUserId(req);
    const deckId = getStringParam(req.params.id);
    const deck = await deckService.updateDeck(deckId, userId, req.body);
    
    if (!deck) {
      return res.status(404).json({
        success: false,
        error: 'Deck not found',
      });
    }
    
    return res.json({ success: true, data: deck });
  } catch (error) {
    console.error('Error updating deck:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/decks/:id
 * Delete a deck
 */
router.delete('/:id', async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = getUserId(req);
    const deckId = getStringParam(req.params.id);
    const deleted = await deckService.deleteDeck(deckId, userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Deck not found',
      });
    }
    
    return res.json({ success: true, message: 'Deck deleted' });
  } catch (error) {
    console.error('Error deleting deck:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/decks/:id/stats
 * Get deck statistics
 */
router.get('/:id/stats', async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = getUserId(req);
    const deckId = getStringParam(req.params.id);
    const stats = await deckService.getDeckStats(deckId, userId);
    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting deck stats:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
