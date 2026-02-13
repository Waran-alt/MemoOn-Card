import { describe, expect, it } from 'vitest';
import type { NextRequest } from 'next/server';
import {
  createRedirectResponse,
  getAcceptLanguageValues,
  getFirstPathSegment,
  getPathSegments,
} from '../utils';

function makeRequest(url: string, acceptLanguage?: string): NextRequest {
  return {
    url,
    headers: new Headers(acceptLanguage ? { 'Accept-Language': acceptLanguage } : {}),
  } as unknown as NextRequest;
}

describe('middleware utils', () => {
  it('splits pathname into segments', () => {
    expect(getPathSegments('/en/app/decks')).toEqual(['en', 'app', 'decks']);
    expect(getPathSegments('/')).toEqual([]);
    expect(getFirstPathSegment('/fr/page')).toBe('fr');
    expect(getFirstPathSegment('/')).toBeUndefined();
  });

  it('parses Accept-Language values', () => {
    const req = makeRequest('https://example.test/', 'fr-CA,fr;q=0.9,en;q=0.8');
    expect(getAcceptLanguageValues(req)).toEqual(['fr-CA', 'fr', 'en']);
    expect(getAcceptLanguageValues(makeRequest('https://example.test/'))).toEqual([]);
  });

  it('creates redirect response with target path and status', () => {
    const req = makeRequest('https://example.test/app');
    const response = createRedirectResponse(req, '/fr/app', 308);
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://example.test/fr/app');
  });
});
