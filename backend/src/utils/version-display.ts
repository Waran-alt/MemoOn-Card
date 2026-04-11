/**
 * Public version string for GET /api/version. Never expose a 40-char git sha alone.
 */
import { readFileSync } from 'fs';
import path from 'path';

let cachedSemver: string | null = null;

function backendPackageSemver(): string {
  if (cachedSemver != null) return cachedSemver;
  try {
    const pkgPath = path.join(__dirname, '..', '..', 'package.json');
    cachedSemver = JSON.parse(readFileSync(pkgPath, 'utf8')).version as string;
  } catch {
    cachedSemver = '0.0.0';
  }
  return cachedSemver;
}

/** Shorten full SHAs in labels (e.g. 1.0.1+deadbeef…40 → 1.0.1+deadbeef). */
export function normalizeVersionLabel(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (/^[0-9a-f]{40}$/i.test(t)) return t.slice(0, 7);
  const plusIdx = t.indexOf('+');
  if (plusIdx !== -1) {
    const suffix = t.slice(plusIdx + 1);
    if (/^[0-9a-f]{8,}$/i.test(suffix)) {
      return `${t.slice(0, plusIdx)}+${suffix.slice(0, 7)}`;
    }
  }
  return t;
}

/** Value for JSON `{ version }` from env (Hostinger often has GIT_SHA but missing APP_RELEASE). */
export function resolvePublicAppVersion(): string {
  const appRelease = process.env.APP_RELEASE?.trim();
  if (appRelease) return normalizeVersionLabel(appRelease);
  const np = process.env.NEXT_PUBLIC_APP_VERSION?.trim();
  if (np) return normalizeVersionLabel(np);
  const sha = process.env.GIT_SHA?.trim();
  if (sha && sha !== 'unknown') {
    if (/^[0-9a-f]{40}$/i.test(sha)) {
      return `${backendPackageSemver()}+${sha.slice(0, 7)}`;
    }
    return normalizeVersionLabel(sha);
  }
  return 'dev';
}
