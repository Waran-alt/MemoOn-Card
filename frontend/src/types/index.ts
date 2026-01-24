/**
 * Frontend type definitions
 */

export interface Deck {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  user_id: string;
  deck_id: string;
  recto: string;
  verso: string;
  comment: string | null;
  recto_image: string | null;
  verso_image: string | null;
  recto_formula: boolean;
  verso_formula: boolean;
  reverse: boolean;
  stability: number | null;
  difficulty: number | null;
  last_review: string | null;
  next_review: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewResult {
  state: {
    stability: number;
    difficulty: number;
    lastReview: string | null;
    nextReview: string;
  };
  retrievability: number;
  interval: number;
  message: string;
}

export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy
