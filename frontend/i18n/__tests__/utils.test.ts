import { describe, expect, it } from 'vitest';
import {
  getBestLocale,
  getFallbackLocale,
  getLanguageName,
  getNativeLanguageName,
  getPluralCategory,
  isSupportedLocale,
} from '../utils';

describe('i18n utils', () => {
  it('resolves language names and native names', () => {
    expect(getLanguageName('en')).toBe('English');
    expect(getNativeLanguageName('fr')).toBe('Français');
  });

  it('validates supported locales and best-locale fallback', () => {
    expect(isSupportedLocale('en')).toBe(true);
    expect(isSupportedLocale('fr')).toBe(true);
    expect(isSupportedLocale('de')).toBe(false);

    expect(getBestLocale('fr-CA')).toBe('fr');
    expect(getBestLocale('en-US')).toBe('en');
    expect(getBestLocale('de-DE')).toBe('en');
  });

  it('returns fallback locale according to config', () => {
    expect(getFallbackLocale('en')).toBe('en');
    expect(getFallbackLocale('fr')).toBe('en');
  });

  it('returns CLDR plural categories with safe fallback behavior', () => {
    expect(getPluralCategory('en', 1)).toBe('one');
    expect(getPluralCategory('en', 2)).toBe('other');
    // Invalid locale should not throw and should still return a category.
    expect(['one', 'other']).toContain(getPluralCategory('not-a-locale', 1));
  });
});
