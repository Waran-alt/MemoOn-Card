/**
 * Optional observability URLs for the dev panel (NEXT_PUBLIC_* — set at build time).
 * Only http(s) URLs are accepted to avoid javascript: injection in href.
 */

export type DevPanelExternalToolId = 'grafana' | 'prometheus' | 'loki' | 'cadvisor';

export type DevPanelExternalTool = {
  id: DevPanelExternalToolId;
  url: string;
};

function isSafeHttpUrl(raw: string | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : null;
}

/** Client-safe: `process` may be undefined in the browser bundle (avoid `process.env` as a whole object). */
function readNextPublic(key: string): string | undefined {
  if (typeof process === 'undefined' || !process.env) return undefined;
  const v = process.env[key as keyof typeof process.env];
  return typeof v === 'string' ? v : undefined;
}

/** Tools with a configured public URL (e.g. after SSH tunnel to the VPS). */
export function getDevPanelExternalTools(): DevPanelExternalTool[] {
  const out: DevPanelExternalTool[] = [];
  const add = (id: DevPanelExternalToolId, key: string) => {
    const u = isSafeHttpUrl(readNextPublic(key));
    if (u) out.push({ id, url: u });
  };
  add('grafana', 'NEXT_PUBLIC_DEV_GRAFANA_URL');
  add('prometheus', 'NEXT_PUBLIC_DEV_PROMETHEUS_URL');
  add('loki', 'NEXT_PUBLIC_DEV_LOKI_URL');
  add('cadvisor', 'NEXT_PUBLIC_DEV_CADVISOR_URL');
  return out;
}

/** Grafana Explore (Loki queries). Same base URL as Grafana, `/explore` path. */
export function getGrafanaExploreUrl(): string | null {
  const u = isSafeHttpUrl(readNextPublic('NEXT_PUBLIC_DEV_GRAFANA_URL'));
  if (!u) return null;
  return `${u.replace(/\/$/, '')}/explore`;
}

/** Raw Loki base URL when configured (advanced / API). */
export function getLokiBaseUrl(): string | null {
  return isSafeHttpUrl(readNextPublic('NEXT_PUBLIC_DEV_LOKI_URL'));
}
