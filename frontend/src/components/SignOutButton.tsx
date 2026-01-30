'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

export function SignOutButton() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    logout();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-sm text-neutral-600 hover:underline dark:text-neutral-400"
    >
      Sign out
    </button>
  );
}
