/**
 * Tests for user_settings reads/updates with a mocked DB pool (no Postgres).
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

const queryMock = vi.hoisted(() => vi.fn());

vi.mock('@/config/database', () => ({
  pool: { query: queryMock },
}));

import {
  getStudySessionSettings,
  updateKnowledgeEnabled,
  updateUiTheme,
} from '@/services/user-settings.service';
import { FSRS_V6_DEFAULT_WEIGHTS, FSRS_CONSTANTS } from '@/constants/fsrs.constants';

describe('user-settings.service', () => {
  const userId = 'user-uuid-1';

  beforeEach(() => {
    queryMock.mockReset();
  });

  it('getStudySessionSettings returns defaults when no row', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const s = await getStudySessionSettings(userId);
    expect(s.knowledge_enabled).toBe(false);
    expect(s.ui_theme).toBeNull();
    expect(s.learning_min_interval_minutes).toBeGreaterThan(0);
    expect(s.fsrs_weights_default).toHaveLength(FSRS_V6_DEFAULT_WEIGHTS.length);
    expect(s.target_retention_default).toBe(FSRS_CONSTANTS.DEFAULT_TARGET_RETENTION);
    expect(s.fsrs_weights).toBeUndefined();
  });

  it('maps valid ui_theme and coerces invalid theme to null', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ knowledge_enabled: false, learning_min_interval_minutes: null, fsrs_weights: null, target_retention: null, ui_theme: 'dark' }],
    });
    const s = await getStudySessionSettings(userId);
    expect(s.ui_theme).toBe('dark');

    queryMock.mockResolvedValueOnce({
      rows: [{ knowledge_enabled: false, learning_min_interval_minutes: null, fsrs_weights: null, target_retention: null, ui_theme: 'hacker' }],
    });
    const s2 = await getStudySessionSettings(userId);
    expect(s2.ui_theme).toBeNull();
  });

  it('clamps learning_min_interval to allowed range', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ knowledge_enabled: false, learning_min_interval_minutes: 99999, fsrs_weights: null, target_retention: null, ui_theme: null }],
    });
    const s = await getStudySessionSettings(userId);
    expect(s.learning_min_interval_minutes).not.toBe(99999);
  });

  it('includes fsrs_weights when row has full FSRS weight vector', async () => {
    const weights = Array.from({ length: FSRS_V6_DEFAULT_WEIGHTS.length }, (_, i) => i * 0.1);
    queryMock.mockResolvedValueOnce({
      rows: [{ knowledge_enabled: true, learning_min_interval_minutes: 1, fsrs_weights: weights, target_retention: 0.85, ui_theme: null }],
    });
    const s = await getStudySessionSettings(userId);
    expect(s.fsrs_weights).toHaveLength(FSRS_V6_DEFAULT_WEIGHTS.length);
    expect(s.knowledge_enabled).toBe(true);
    expect(s.target_retention).toBe(0.85);
    expect(s.fsrs_weights_delta).toHaveLength(FSRS_V6_DEFAULT_WEIGHTS.length);
  });

  it('omits fsrs_weights_delta when stored vector is shorter than defaults', async () => {
    const weights = Array.from({ length: 21 }, (_, i) => i * 0.1);
    queryMock.mockResolvedValueOnce({
      rows: [{ knowledge_enabled: false, learning_min_interval_minutes: 1, fsrs_weights: weights, target_retention: null, ui_theme: null }],
    });
    const s = await getStudySessionSettings(userId);
    expect(s.fsrs_weights).toHaveLength(21);
    expect(s.fsrs_weights_delta).toBeUndefined();
  });

  it('updateKnowledgeEnabled ensures row, updates, returns snapshot', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ knowledge_enabled: true, learning_min_interval_minutes: 1, fsrs_weights: null, target_retention: null, ui_theme: null }],
      });
    const s = await updateKnowledgeEnabled(userId, true);
    expect(queryMock).toHaveBeenCalledTimes(3);
    expect(s.knowledge_enabled).toBe(true);
  });

  it('updateUiTheme ensures row, updates, returns snapshot', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ knowledge_enabled: false, learning_min_interval_minutes: 1, fsrs_weights: null, target_retention: null, ui_theme: 'monokai' }],
      });
    const s = await updateUiTheme(userId, 'monokai');
    expect(queryMock).toHaveBeenCalledTimes(3);
    expect(s.ui_theme).toBe('monokai');
  });
});
