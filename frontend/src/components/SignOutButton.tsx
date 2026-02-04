'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import apiClient from '@/lib/api';

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    await apiClient.post('/api/auth/logout').catch(() => {});
    logout();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className ?? 'text-sm text-neutral-600 hover:underline dark:text-neutral-400'}
    >
      Sign out
    </button>
  );
}
