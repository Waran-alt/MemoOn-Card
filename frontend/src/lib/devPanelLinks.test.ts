import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getDevPanelExternalTools,
  getGrafanaExploreUrl,
  getLokiBaseUrl,
} from './devPanelLinks';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('devPanelLinks', () => {
  it('returns no tools when env vars are unset', () => {
    vi.stubEnv('NEXT_PUBLIC_DEV_GRAFANA_URL', '');
    vi.stubEnv('NEXT_PUBLIC_DEV_PROMETHEUS_URL', '');
    vi.stubEnv('NEXT_PUBLIC_DEV_LOKI_URL', '');
    vi.stubEnv('NEXT_PUBLIC_DEV_CADVISOR_URL', '');
    expect(getDevPanelExternalTools()).toEqual([]);
    expect(getGrafanaExploreUrl()).toBeNull();
    expect(getLokiBaseUrl()).toBeNull();
  });

  it('only includes http(s) URLs and rejects javascript: hrefs', () => {
    vi.stubEnv('NEXT_PUBLIC_DEV_GRAFANA_URL', 'https://grafana.example/dash');
    vi.stubEnv('NEXT_PUBLIC_DEV_PROMETHEUS_URL', 'javascript:alert(1)');
    vi.stubEnv('NEXT_PUBLIC_DEV_LOKI_URL', 'ftp://loki.invalid');
    const tools = getDevPanelExternalTools();
    expect(tools.map((t) => t.id)).toEqual(['grafana']);
    expect(tools[0]?.url).toBe('https://grafana.example/dash');
  });

  it('builds Grafana explore URL and trims trailing slash on base', () => {
    vi.stubEnv('NEXT_PUBLIC_DEV_GRAFANA_URL', 'http://localhost:3001/');
    expect(getGrafanaExploreUrl()).toBe('http://localhost:3001/explore');
  });

  it('exposes Loki base when configured with https', () => {
    vi.stubEnv('NEXT_PUBLIC_DEV_LOKI_URL', 'https://loki.example/');
    expect(getLokiBaseUrl()).toBe('https://loki.example/');
  });
});
