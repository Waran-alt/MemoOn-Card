/**
 * Client-side API base URL.
 * - Set NEXT_PUBLIC_API_URL="" when behind nginx so requests are same-origin and cookies work.
 * - Unset or set to http://localhost:4002 for local dev without a proxy.
 */
export function getClientApiBaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_API_URL;
  if (v === undefined) return 'http://localhost:4002';
  return String(v).trim();
}
