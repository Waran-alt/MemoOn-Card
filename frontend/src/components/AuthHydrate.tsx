'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import type { AuthUser } from '@/types';

interface AuthHydrateProps {
  serverUser: AuthUser | null;
  children: React.ReactNode;
}

export function AuthHydrate({ serverUser, children }: AuthHydrateProps) {
  const setFromServer = useAuthStore((s) => s.setFromServer);
  const refreshAccess = useAuthStore((s) => s.refreshAccess);
  const didRefresh = useRef(false);

  // Depend on primitive id/email so we don't re-run when serverUser is a new object reference (e.g. RSC re-run), which would call setFromServer repeatedly and cause the page to re-render every time.
  const userId = serverUser?.id ?? '';
  const userEmail = serverUser?.email ?? '';

  useEffect(() => {
    setFromServer(serverUser);
    if (serverUser && !didRefresh.current) {
      didRefresh.current = true;
      refreshAccess();
    }
    // Only re-run when user identity changes (userId/userEmail), not when serverUser is a new object reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userEmail, setFromServer, refreshAccess]);

  return <>{children}</>;
}
