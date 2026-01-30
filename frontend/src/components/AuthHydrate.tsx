'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import type { AuthUser } from '@/types';

interface AuthHydrateProps {
  serverUser: AuthUser | null;
  children: React.ReactNode;
}

export function AuthHydrate({ serverUser, children }: AuthHydrateProps) {
  const setFromServer = useAuthStore((s) => s.setFromServer);
  const refreshAccess = useAuthStore((s) => s.refreshAccess);

  useEffect(() => {
    setFromServer(serverUser);
    if (serverUser) refreshAccess();
  }, [serverUser, setFromServer, refreshAccess]);

  return <>{children}</>;
}
