import type { AuthUser } from '@/types';

/** Server-side only: backend URL from the frontend container (e.g. http://memoon-card-backend:4002 in Docker) */
const getBackendUrl = () =>
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

export type SessionResult = { user: AuthUser } | null;

export async function getSession(
  cookieStore: { getAll: () => Array<{ name: string; value: string }> }
): Promise<SessionResult> {
  const url = `${getBackendUrl()}/api/auth/session`;
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  try {
    const res = await fetch(url, {
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.success || !data?.data?.user) return null;
    return { user: data.data.user };
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getSession] fetch failed:', (err as Error).message, '(url:', url, ')');
    }
    return null;
  }
}
