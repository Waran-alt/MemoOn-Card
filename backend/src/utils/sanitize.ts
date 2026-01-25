/**
 * HTML Sanitization Utilities
 * 
 * Prevents XSS attacks by sanitizing user input
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS
 * 
 * Allows only safe HTML tags and attributes
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(input, {
    // Allowed HTML tags (minimal set for flashcard content)
    ALLOWED_TAGS: [
      'b', 'strong',      // Bold
      'i', 'em',          // Italic
      'u',                // Underline
      'p', 'br',          // Paragraphs and line breaks
      'ul', 'ol', 'li',   // Lists
      'h1', 'h2', 'h3',   // Headings
      'a',                // Links
      'code', 'pre',      // Code blocks
      'blockquote',       // Quotes
    ],
    // Allowed attributes
    ALLOWED_ATTR: [
      'href',             // Links
      'title',            // Tooltips
      'target',           // Link target
      'rel',              // Link rel (for security)
    ],
    // Disable data attributes (can be used for XSS)
    ALLOW_DATA_ATTR: false,
    // Keep relative URLs safe
    ALLOW_UNKNOWN_PROTOCOLS: false,
    // Return plain text if all HTML is stripped
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false,
  });
}

/**
 * Sanitize plain text (removes all HTML)
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Escape HTML entities (for output encoding)
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe || typeof unsafe !== 'string') {
    return '';
  }

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
