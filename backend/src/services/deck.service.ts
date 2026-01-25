import { pool } from '../config/database';
import { Deck, CreateDeckRequest } from '../types/database';
import { sanitizeHtml } from '../utils/sanitize';

export class DeckService {
  /**
   * Get all decks for a user
   */
  async getDecksByUserId(userId: string): Promise<Deck[]> {
    const result = await pool.query<Deck>(
      'SELECT * FROM decks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  /**
   * Get a deck by ID
   */
  async getDeckById(deckId: string, userId: string): Promise<Deck | null> {
    const result = await pool.query<Deck>(
      'SELECT * FROM decks WHERE id = $1 AND user_id = $2',
      [deckId, userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new deck
   */
  async createDeck(userId: string, data: CreateDeckRequest): Promise<Deck> {
    // Sanitize HTML content to prevent XSS
    const sanitizedTitle = sanitizeHtml(data.title);
    const sanitizedDescription = data.description ? sanitizeHtml(data.description) : null;

    const result = await pool.query<Deck>(
      `INSERT INTO decks (user_id, title, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, sanitizedTitle, sanitizedDescription]
    );
    return result.rows[0];
  }

  /**
   * Update a deck
   */
  async updateDeck(
    deckId: string,
    userId: string,
    data: Partial<CreateDeckRequest>
  ): Promise<Deck | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(sanitizeHtml(data.title)); // Sanitize HTML
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description ? sanitizeHtml(data.description) : null); // Sanitize HTML
    }

    if (updates.length === 0) {
      return this.getDeckById(deckId, userId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(deckId, userId);

    const result = await pool.query<Deck>(
      `UPDATE decks
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND user_id = $${paramCount++}
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a deck
   */
  async deleteDeck(deckId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM decks WHERE id = $1 AND user_id = $2',
      [deckId, userId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get deck statistics
   */
  async getDeckStats(deckId: string, userId: string): Promise<{
    totalCards: number;
    dueCards: number;
    newCards: number;
    reviewedToday: number;
  }> {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total_cards,
        COUNT(CASE WHEN next_review <= CURRENT_TIMESTAMP THEN 1 END) as due_cards,
        COUNT(CASE WHEN stability IS NULL THEN 1 END) as new_cards,
        COUNT(CASE WHEN last_review >= $1 THEN 1 END) as reviewed_today
       FROM cards
       WHERE deck_id = $2 AND user_id = $3`,
      [todayStart, deckId, userId]
    );

    const row = stats.rows[0];
    return {
      totalCards: parseInt(row.total_cards, 10),
      dueCards: parseInt(row.due_cards, 10),
      newCards: parseInt(row.new_cards, 10),
      reviewedToday: parseInt(row.reviewed_today, 10),
    };
  }
}
