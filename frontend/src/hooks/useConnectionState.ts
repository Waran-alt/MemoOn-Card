'use client';

import { useState, useEffect } from 'react';
import { useConnectionSyncStore } from '@/store/connectionSync.store';

/** Tracks navigator.onLine and a shared "recent failure" flag (same across all callers / global banner). */
export function useConnectionState(options?: { clearFailureOnOnline?: boolean }) {
  const clearFailureOnOnline = options?.clearFailureOnOnline ?? true;
  const hadFailure = useConnectionSyncStore((s) => s.hadFailure);
  const setHadFailure = useConnectionSyncStore((s) => s.setHadFailure);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOnline = () => {
      setIsOnline(true);
      if (clearFailureOnOnline) setHadFailure(false);
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [clearFailureOnOnline, setHadFailure]);

  return {
    isOnline,
    hadFailure,
    setHadFailure,
  };
}
