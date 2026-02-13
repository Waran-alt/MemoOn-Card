import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTranslation } from '../useTranslation';

describe('useTranslation', () => {
  it('loads default namespace and resolves a known key', async () => {
    const { result } = renderHook(() => useTranslation('common', 'en'));

    await waitFor(() => {
      expect(result.current.t('signIn')).toBe('Sign in');
    });
    expect(result.current.locale).toBe('en');
  });

  it('supports interpolation and returns key for missing translations', async () => {
    const { result } = renderHook(() => useTranslation('common', 'en'));

    await waitFor(() => {
      expect(result.current.t('passwordMinLength', { vars: { count: 8 } })).toContain('8');
    });
    expect(result.current.t('missing')).toBe('missing');
    expect(result.current.t('missing', { fallback: 'Fallback text' })).toBe('missing');
  });

  it('supports pluralization for flat keys', async () => {
    const { result } = renderHook(() => useTranslation('app', 'en-US'));

    await waitFor(() => {
      expect(result.current.t('reviewedCount', { count: 1 })).toBe('You reviewed 1 card.');
    });
    expect(result.current.t('reviewedCount', { count: 2 })).toBe('You reviewed 2 cards.');
  });
});
