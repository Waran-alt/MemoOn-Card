/**
 * Single source of truth for default backend URL and server-side backend URL resolution.
* Used by next.config.js (rewrites + env default). Logic is DUPLICATED in auth.ts for
 * server-side getSession (auth.ts cannot require this from TS without bundler quirks).
 * If you change DEFAULT_BACKEND_URL or getServerBackendUrl logic, update auth.ts to match.
 */

const DEFAULT_BACKEND_URL = 'http://localhost:4002';

/**
 * Resolve backend URL for server-side use (rewrites, getSession).
 * Prefer BACKEND_URL (Docker), then non-empty trimmed NEXT_PUBLIC_API_URL, then default.
 */
function getServerBackendUrl(env) {
  const backend = env.BACKEND_URL;
  if (backend && String(backend).trim()) return String(backend).trim();

  const v = env.NEXT_PUBLIC_API_URL;
  if (v !== undefined && v !== '') {
    const trimmed = String(v).trim();
    if (trimmed) return trimmed;
  }

  return DEFAULT_BACKEND_URL;
}

module.exports = { DEFAULT_BACKEND_URL, getServerBackendUrl };
