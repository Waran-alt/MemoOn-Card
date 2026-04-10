import DOMPurify from 'isomorphic-dompurify';

/** Allowed markup for stored card HTML (aligned with Tiptap StarterKit + link + underline). */
export const CARD_HTML_PURIFY = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'hr',
    'a',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
};

export function sanitizeCardHtml(html: string): string {
  return DOMPurify.sanitize(html || '', CARD_HTML_PURIFY);
}

/** Strip tags for search, previews, and empty checks. */
export function cardPlainText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isCardFieldEmpty(html: string): boolean {
  return cardPlainText(html).length === 0;
}
