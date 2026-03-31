'use client';

/**
 * Clears refresh cookie via POST /api/auth/logout then client auth store (grid 1.3).
 * Logout POST is capped (axios default timeout is infinite) so a stuck backend cannot block navigation.
 * Full page navigation matches register/login success and avoids client router edge cases under load (E2E).
 */
import { useLocale } from 'i18n';
import { useAuthStore } from '@/store/auth.store';
import apiClient from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';

const LOGOUT_POST_TIMEOUT_MS = 12_000;

export function SignOutButton({ className }: { className?: string }) {
  const { locale } = useLocale();
  const { t: tc } = useTranslation('common', locale);
  const logout = useAuthStore((s) => s.logout);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    await apiClient.post('/api/auth/logout', {}, { timeout: LOGOUT_POST_TIMEOUT_MS }).catch(() => {});
    logout();
    window.location.href = `/${locale}/login`;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className ?? 'text-sm text-neutral-600 hover:underline dark:text-neutral-400'}
    >
      {tc('signOut')}
    </button>
  );
}
