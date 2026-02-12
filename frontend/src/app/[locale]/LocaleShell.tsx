'use client';

import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function LocaleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProtectedAppRoute = pathname?.includes('/app');

  return (
    <>
      {!isProtectedAppRoute && (
        <div className="fixed top-0 right-0 z-50 p-2">
          <LanguageSwitcher />
        </div>
      )}
      <div className="min-h-screen">{children}</div>
    </>
  );
}
