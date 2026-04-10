import { describe, it, expect } from 'vitest';
import { cardPlainText, isCardFieldEmpty, sanitizeCardHtml } from './cardHtml';

describe('cardHtml', () => {
  describe('cardPlainText', () => {
    it('strips tags and normalizes whitespace', () => {
      expect(cardPlainText('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
      expect(cardPlainText('  plain  ')).toBe('plain');
    });

    it('handles nbsp entities', () => {
      expect(cardPlainText('<p>a&nbsp;b</p>')).toBe('a b');
    });
  });

  describe('isCardFieldEmpty', () => {
    it('is true for empty, whitespace-only, or empty paragraphs', () => {
      expect(isCardFieldEmpty('')).toBe(true);
      expect(isCardFieldEmpty('   ')).toBe(true);
      expect(isCardFieldEmpty('<p></p>')).toBe(true);
      expect(isCardFieldEmpty('<p><br></p>')).toBe(true);
    });

    it('is false when visible text exists', () => {
      expect(isCardFieldEmpty('<p>Hi</p>')).toBe(false);
      expect(isCardFieldEmpty('x')).toBe(false);
    });
  });

  describe('sanitizeCardHtml', () => {
    it('keeps allowed markup from the editor', () => {
      const html = '<p>Hello <strong>there</strong></p><ul><li>One</li></ul>';
      const out = sanitizeCardHtml(html);
      expect(out).toContain('<p>');
      expect(out).toContain('<strong>');
      expect(out).toContain('<ul>');
    });

    it('removes script tags', () => {
      const out = sanitizeCardHtml('<p>x</p><script>alert(1)</script>');
      expect(out).not.toContain('script');
      expect(out).not.toContain('alert');
    });

    it('allows links with href', () => {
      const out = sanitizeCardHtml('<a href="https://example.com" rel="noopener">x</a>');
      expect(out).toContain('href');
      expect(out).toContain('example.com');
    });
  });
});
