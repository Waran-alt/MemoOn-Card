import { describe, expect, it } from 'vitest';
import type { NextRequest } from 'next/server';
import {
  addLocalePrefix,
  determineTargetLocale,
  getLocaleFromHeaders,
  getLocaleFromPathname,
  hasLocalePrefix,
  removeLocalePrefix,
} from '../middleware';

function makeRequest(url: string, headers?: Record<string, string>): NextRequest {
  return {
    headers: new Headers(headers ?? {}),
    nextUrl: new URL(url),
  } as unknown as NextRequest;
}

describe('i18n middleware utils', () => {
  it('extracts locale from pathname and prefix checks', () => {
    expect(getLocaleFromPathname('/en/app')).toBe('en');
    expect(getLocaleFromPathname('/fr')).toBe('fr');
    expect(getLocaleFromPathname('/app')).toBeUndefined();

    expect(hasLocalePrefix('/fr/decks')).toBe(true);
    expect(hasLocalePrefix('/de/decks')).toBe(false);
  });

  it('handles adding and removing locale prefixes', () => {
    expect(removeLocalePrefix('/fr/app/decks')).toBe('/app/decks');
    expect(removeLocalePrefix('/fr')).toBe('/');
    expect(removeLocalePrefix('/app')).toBe('/app');
    expect(addLocalePrefix('/app/decks', 'en')).toBe('/en/app/decks');
  });

  it('detects locale from Accept-Language header with base fallback', () => {
    const req = makeRequest('https://example.test/app', {
      'Accept-Language': 'es-MX,fr-CA;q=0.9,en;q=0.8',
    });
    // es is unsupported, fr-CA should fallback to fr.
    expect(getLocaleFromHeaders(req)).toBe('fr');
  });

  it('determines locale priority: query -> cookie -> header -> default', () => {
    const fromQuery = makeRequest('https://example.test/app?lang=fr', {
      cookie: 'memoon-locale=en',
      'Accept-Language': 'en-US,en;q=0.8',
    });
    expect(determineTargetLocale(fromQuery)).toBe('fr');

    const fromCookie = makeRequest('https://example.test/app', {
      cookie: 'memoon-locale=fr',
      'Accept-Language': 'en-US,en;q=0.8',
    });
    expect(determineTargetLocale(fromCookie)).toBe('fr');

    const fromHeader = makeRequest('https://example.test/app', {
      'Accept-Language': 'fr-CA,fr;q=0.9',
    });
    expect(determineTargetLocale(fromHeader)).toBe('fr');

    const fallback = makeRequest('https://example.test/app');
    expect(determineTargetLocale(fallback)).toBe('en');
  });
});
