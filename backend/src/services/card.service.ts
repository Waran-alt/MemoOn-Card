import { pool } from '../config/database';
import {
  Card,
  CreateCardRequest,
  UpdateCardRequest,
  CardWithState,
} from '../types/database';
import { FSRSState } from '../services/fsrs.service';

export class CardService {
  /**
   * Get all cards in a deck
   */
  async getCardsByDeckId(
    deckId: string,
    userId: string
  ): Promise<Card[]> {
    const result = await pool.query<Card>(
      'SELECT * FROM cards WHERE deck_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [deckId, userId]
    );
    return result.rows;
  }

  /**
   * Get a card by ID
   */
  async getCardById(cardId: string, userId: string): Promise<Card | null> {
    const result = await pool.query<Card>(
      'SELECT * FROM cards WHERE id = $1 AND user_id = $2',
      [cardId, userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new card
   */
  async createCard(
    deckId: string,
    userId: string,
    data: CreateCardRequest
  ): Promise<Card> {
    const result = await pool.query<Card>(
      `INSERT INTO cards (
        user_id, deck_id, recto, verso, comment,
        recto_image, verso_image, recto_formula, verso_formula, reverse
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        userId,
        deckId,
        data.recto,
        data.verso,
        data.comment || null,
        data.recto_image || null,
        data.verso_image || null,
        data.recto_formula || false,
        data.verso_formula || false,
        data.reverse !== undefined ? data.reverse : true,
      ]
    );
    return result.rows[0];
  }

  /**
   * Update a card
   */
  async updateCard(
    cardId: string,
    userId: string,
    data: UpdateCardRequest
  ): Promise<Card | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.recto !== undefined) {
      updates.push(`recto = $${paramCount++}`);
      values.push(data.recto);
    }
    if (data.verso !== undefined) {
      updates.push(`verso = $${paramCount++}`);
      values.push(data.verso);
    }
    if (data.comment !== undefined) {
      updates.push(`comment = $${paramCount++}`);
      values.push(data.comment);
    }
    if (data.recto_image !== undefined) {
      updates.push(`recto_image = $${paramCount++}`);
      values.push(data.recto_image);
    }
    if (data.verso_image !== undefined) {
      updates.push(`verso_image = $${paramCount++}`);
      values.push(data.verso_image);
    }
    if (data.recto_formula !== undefined) {
      updates.push(`recto_formula = $${paramCount++}`);
      values.push(data.recto_formula);
    }
    if (data.verso_formula !== undefined) {
      updates.push(`verso_formula = $${paramCount++}`);
      values.push(data.verso_formula);
    }
    if (data.reverse !== undefined) {
      updates.push(`reverse = $${paramCount++}`);
      values.push(data.reverse);
    }

    if (updates.length === 0) {
      return this.getCardById(cardId, userId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(cardId, userId);

    const result = await pool.query<Card>(
      `UPDATE cards
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND user_id = $${paramCount++}
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a card
   */
  async deleteCard(cardId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM cards WHERE id = $1 AND user_id = $2',
      [cardId, userId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Update card FSRS state
   */
  async updateCardState(
    cardId: string,
    userId: string,
    state: FSRSState
  ): Promise<Card | null> {
    const result = await pool.query<Card>(
      `UPDATE cards
       SET stability = $1,
           difficulty = $2,
           last_review = $3,
           next_review = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [
        state.stability,
        state.difficulty,
        state.lastReview,
        state.nextReview,
        cardId,
        userId,
      ]
    );
    return result.rows[0] || null;
  }

  /**
   * Get due cards for a deck
   */
  async getDueCards(deckId: string, userId: string): Promise<Card[]> {
    const result = await pool.query<Card>(
      `SELECT * FROM cards
       WHERE deck_id = $1 AND user_id = $2
         AND next_review <= CURRENT_TIMESTAMP
       ORDER BY next_review ASC`,
      [deckId, userId]
    );
    return result.rows;
  }

  /**
   * Get new cards (not yet reviewed)
   */
  async getNewCards(
    deckId: string,
    userId: string,
    limit: number = 20
  ): Promise<Card[]> {
    const result = await pool.query<Card>(
      `SELECT * FROM cards
       WHERE deck_id = $1 AND user_id = $2
         AND stability IS NULL
       ORDER BY created_at ASC
       LIMIT $3`,
      [deckId, userId, limit]
    );
    return result.rows;
  }

  /**
   * Reset card stability (treat as new)
   */
  async resetCardStability(cardId: string, userId: string): Promise<Card | null> {
    const result = await pool.query<Card>(
      `UPDATE cards
       SET stability = NULL,
           difficulty = NULL,
           last_review = NULL,
           next_review = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [cardId, userId]
    );
    return result.rows[0] || null;
  }
}
