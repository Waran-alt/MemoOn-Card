'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useConnectionSyncStore } from '@/store/connectionSync.store';

function subscribeOnline(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }
  window.addEventListener('online', onStoreChange);
  window.addEventListener('offline', onStoreChange);
  return () => {
    window.removeEventListener('online', onStoreChange);
    window.removeEventListener('offline', onStoreChange);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

/** Matches SSR when `navigator` is unavailable (avoids hydration mismatch in `ConnectionSyncBanner`). */
function getServerOnlineSnapshot() {
  return true;
}

/** Tracks navigator.onLine and a shared "recent failure" flag (same across all callers / global banner). */
export function useConnectionState(options?: { clearFailureOnOnline?: boolean }) {
  const clearFailureOnOnline = options?.clearFailureOnOnline ?? true;
  const hadFailure = useConnectionSyncStore((s) => s.hadFailure);
  const setHadFailure = useConnectionSyncStore((s) => s.setHadFailure);
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getServerOnlineSnapshot);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOnline = () => {
      if (clearFailureOnOnline) setHadFailure(false);
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [clearFailureOnOnline, setHadFailure]);

  return {
    isOnline,
    hadFailure,
    setHadFailure,
  };
}
