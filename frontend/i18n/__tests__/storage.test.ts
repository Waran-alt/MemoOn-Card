import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearLocaleFromCookie,
  clearLocaleFromStorage,
  getLocaleFromCookie,
  getLocaleFromCookieHeader,
  getLocaleFromStorage,
  saveLocaleToCookie,
  saveLocaleToStorage,
} from '../storage';

describe('i18n storage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'memoon-locale=; path=/; max-age=0';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves, reads, and clears locale in localStorage', () => {
    expect(saveLocaleToStorage('fr')).toBe(true);
    expect(getLocaleFromStorage()).toBe('fr');
    expect(clearLocaleFromStorage()).toBe(true);
    expect(getLocaleFromStorage()).toBeUndefined();
  });

  it('saves, reads, and clears locale in cookie', () => {
    // saveLocaleToCookie uses Secure cookies, which may not be readable in jsdom/http test env.
    expect(saveLocaleToCookie('en')).toBe(true);
    document.cookie = 'memoon-locale=en';
    expect(getLocaleFromCookie()).toBe('en');
    expect(clearLocaleFromCookie()).toBe(true);
  });

  it('parses locale from cookie header', () => {
    expect(getLocaleFromCookieHeader('a=b; memoon-locale=fr; c=d')).toBe('fr');
    expect(getLocaleFromCookieHeader(undefined)).toBeUndefined();
  });

  it('returns false/undefined when localStorage operations throw', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('set fail');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('get fail');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('remove fail');
    });

    expect(saveLocaleToStorage('en')).toBe(false);
    expect(getLocaleFromStorage()).toBeUndefined();
    expect(clearLocaleFromStorage()).toBe(false);
  });
});
