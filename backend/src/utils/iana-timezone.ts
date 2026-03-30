/**
 * Validate timezones against IANA names (safe for process TZ).
 * Uses Intl.supportedValuesOf when available (Node 20+).
 */

let cachedSet: ReadonlySet<string> | null = null;

function buildIanaTimezoneSet(): ReadonlySet<string> {
  const set = new Set<string>();
  try {
    const supportedValuesOf = (
      Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
    ).supportedValuesOf;
    if (typeof supportedValuesOf === 'function') {
      for (const z of supportedValuesOf.call(Intl, 'timeZone')) {
        set.add(z);
      }
    }
  } catch {
    // ignore
  }
  /** Engines list `Etc/UTC` but apps often send `UTC` / `GMT`. */
  for (const alias of ['UTC', 'GMT', 'Etc/UTC', 'Etc/GMT']) {
    set.add(alias);
  }
  if (set.size === 0) {
    set.add('Etc/UTC');
  }
  return set;
}

export function getIanaTimezoneSet(): ReadonlySet<string> {
  if (!cachedSet) {
    cachedSet = buildIanaTimezoneSet();
  }
  return cachedSet;
}

export function isValidIanaTimezone(tz: string): boolean {
  return getIanaTimezoneSet().has(tz);
}

/** First argument if valid IANA, else fallback (must be valid, e.g. default from config). */
export function pickValidTimezone(preferred: string | undefined | null, fallback: string): string {
  if (preferred && isValidIanaTimezone(preferred)) {
    return preferred;
  }
  return fallback;
}
