import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { getMetricsContentType, getMetricsText, httpMetricsMiddleware } from '@/metrics/prometheus';

/** Sum all series values for a counter metric (global registry may hold multiple label sets). */
function sumCounter(metricsText: string, metricName: string): number {
  const re = new RegExp(`^${metricName}\\{[^}]*\\}\\s+(-?\\d+(?:\\.\\d+)?(?:e[+\\-]\\d+)?)`, 'gm');
  let sum = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(metricsText)) !== null) {
    sum += Number(m[1]);
  }
  return sum;
}

function buildApp() {
  const app = express();
  app.use(httpMetricsMiddleware);
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', getMetricsContentType());
    res.send(await getMetricsText());
  });
  app.get('/ok', (_req, res) => {
    res.status(200).end();
  });
  return app;
}

describe('Prometheus metrics', () => {
  it('GET /metrics returns text exposition with memoon_ prefix', async () => {
    const res = await request(buildApp()).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text/);
    expect(res.text).toMatch(/memoon_/);
    expect(res.text).toMatch(/memoon_deck_cards_list_duration_seconds/);
  });

  it('increments http counter after a request', async () => {
    const app = buildApp();
    const beforeText = (await request(app).get('/metrics')).text;
    const beforeSum = sumCounter(beforeText, 'memoon_http_requests_total');
    await request(app).get('/ok');
    // `finish` runs on the same tick as the response in most cases; flush one microtask for stability.
    await new Promise<void>((r) => setImmediate(r));
    const afterText = (await request(app).get('/metrics')).text;
    const afterSum = sumCounter(afterText, 'memoon_http_requests_total');
    expect(afterSum).toBeGreaterThanOrEqual(beforeSum + 1);
    expect(afterText).toMatch(/memoon_http_requests_total/);
  });
});
