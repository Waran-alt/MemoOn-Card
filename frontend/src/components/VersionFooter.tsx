'use client';

import { useEffect, useState } from 'react';

export function VersionFooter() {
  const [version, setVersion] = useState<string>('…');

  useEffect(() => {
    fetch('/api/version')
      .then((res) => (res.ok ? res.json() : { version: 'dev' }))
      .then((data) => setVersion(data?.version ?? 'dev'))
      .catch(() => setVersion('dev'));
  }, []);

  return (
    <div
      className="fixed bottom-2 left-2 z-50 select-none text-xs text-(--mc-text-muted)"
      aria-hidden
    >
      v{version}
    </div>
  );
}
