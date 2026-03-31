'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { initClientErrorReporting } from '@/lib/clientErrorReporter';

export function LocaleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProtectedAppRoute = pathname?.includes('/app');

  useEffect(() => {
    initClientErrorReporting();
  }, []);

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
