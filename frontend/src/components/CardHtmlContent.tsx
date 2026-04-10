'use client';

import { sanitizeCardHtml } from '@/lib/cardHtml';

type CardHtmlContentProps = {
  html: string;
  className?: string;
};

/**
 * Renders sanitized card HTML (recto/verso/comment). Plain text from legacy cards is safe HTML after sanitize.
 */
export function CardHtmlContent({ html, className }: CardHtmlContentProps) {
  const safe = sanitizeCardHtml(html);
  return (
    <div
      className={`mc-card-html ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
