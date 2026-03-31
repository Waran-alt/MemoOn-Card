/**
 * Sends minimal browser error payloads to POST /api/client-errors (backend logs -> Loki).
 * Enabled in production by default; in dev only if NEXT_PUBLIC_CLIENT_ERROR_REPORTING=true.
 */
import { getClientApiBaseUrl } from '@/lib/env';

export type ClientErrorSource = 'window' | 'unhandledrejection' | 'react';

export interface ClientErrorPayload {
  source: ClientErrorSource;
  message: string;
  stack?: string;
  pageUrl?: string;
  componentStack?: string;
}

let initialized = false;
let lastDedupKey = '';
let lastDedupAt = 0;
const DEDUP_MS = 30_000;

function shouldEnableReporting(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NEXT_PUBLIC_CLIENT_ERROR_REPORTING === 'false') return false;
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_CLIENT_ERROR_REPORTING !== 'true') {
    return false;
  }
  return true;
}

function dedupKey(p: ClientErrorPayload): string {
  return `${p.source}:${p.message.slice(0, 120)}`;
}

async function sendToApi(payload: ClientErrorPayload): Promise<void> {
  const base = getClientApiBaseUrl().replace(/\/$/, '');
  await fetch(`${base}/api/client-errors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
    keepalive: true,
  });
}

/** Report a single client error (deduped). Safe to call from error boundaries. */
export function reportClientError(payload: ClientErrorPayload): void {
  if (!shouldEnableReporting()) return;
  const now = Date.now();
  const key = dedupKey(payload);
  if (key === lastDedupKey && now - lastDedupAt < DEDUP_MS) return;
  lastDedupKey = key;
  lastDedupAt = now;
  void sendToApi(payload).catch(() => {});
}

/** Register window.onerror and unhandledrejection (once). */
export function initClientErrorReporting(): void {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;
  if (!shouldEnableReporting()) return;

  window.addEventListener('error', (event) => {
    if (event.defaultPrevented) return;
    const err = event.error;
    reportClientError({
      source: 'window',
      message:
        err instanceof Error
          ? err.message
          : typeof event.message === 'string' && event.message
            ? event.message
            : 'Script error',
      stack: err instanceof Error ? err.stack : undefined,
      pageUrl: window.location.href,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : 'Unhandled rejection';
    const stack = reason instanceof Error ? reason.stack : undefined;
    reportClientError({
      source: 'unhandledrejection',
      message: message.slice(0, 500),
      stack,
      pageUrl: window.location.href,
    });
  });
}
