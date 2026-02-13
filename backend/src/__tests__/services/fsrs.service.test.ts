import { describe, expect, it } from 'vitest';
import { FSRS, createFSRS, type FSRSState } from '@/services/fsrs.service';

describe('FSRS service', () => {
  it('creates scheduler with defaults via factory', () => {
    const fsrs = createFSRS();
    expect(fsrs).toBeInstanceOf(FSRS);
  });

  it('throws when weights are fewer than 21', () => {
    expect(() => new FSRS({ weights: [1, 2, 3], targetRetention: 0.9 })).toThrow(
      /requires exactly 21 weights/i
    );
  });

  it('reviews a new card and returns interval and message', () => {
    const fsrs = createFSRS();
    const result = fsrs.reviewCard(null, 3);

    expect(result.state.lastReview).toBeInstanceOf(Date);
    expect(result.state.nextReview).toBeInstanceOf(Date);
    expect(result.interval).toBeGreaterThan(0);
    expect(typeof result.message).toBe('string');
    expect(result.message.length).toBeGreaterThan(0);
  });

  it('returns due cards sorted by lowest retrievability first', () => {
    const fsrs = createFSRS({ targetRetention: 0.9 });
    const now = Date.now();
    const cards: Array<{ id: string; state: FSRSState }> = [
      {
        id: 'recent',
        state: {
          stability: 10,
          difficulty: 5,
          lastReview: new Date(now - 1 * 24 * 60 * 60 * 1000),
          nextReview: new Date(now + 8 * 24 * 60 * 60 * 1000),
        },
      },
      {
        id: 'old',
        state: {
          stability: 3,
          difficulty: 5,
          lastReview: new Date(now - 7 * 24 * 60 * 60 * 1000),
          nextReview: new Date(now - 1 * 24 * 60 * 60 * 1000),
        },
      },
    ];

    const due = fsrs.getDueCards(cards);
    expect(due.length).toBeGreaterThan(0);
    expect(due[0].id).toBe('old');
    expect(due[0].retrievability).toBeLessThanOrEqual(0.9);
  });

  it('does not apply management penalty for short reveal or far due cards', () => {
    const fsrs = createFSRS();
    const base: FSRSState = {
      stability: 5,
      difficulty: 4,
      lastReview: new Date(Date.now() - 24 * 60 * 60 * 1000),
      nextReview: new Date(Date.now() + 72 * 60 * 60 * 1000),
    };

    const shortReveal = fsrs.applyManagementPenalty(base, 1);
    expect(shortReveal.nextReview.getTime()).toBe(base.nextReview.getTime());

    const longRevealButFarDue = fsrs.applyManagementPenalty(base, 30);
    expect(longRevealButFarDue.nextReview.getTime()).toBe(base.nextReview.getTime());
  });

  it('detects significant and reset-worthy content changes', () => {
    const fsrs = createFSRS();
    const unchanged = fsrs.detectContentChange('same content', 'same content');
    expect(unchanged).toEqual({ changePercent: 0, isSignificant: false, shouldReset: false });

    const changed = fsrs.detectContentChange('short', 'completely different and much longer text');
    expect(changed.changePercent).toBeGreaterThan(30);
    expect(changed.isSignificant).toBe(true);
  });
});
