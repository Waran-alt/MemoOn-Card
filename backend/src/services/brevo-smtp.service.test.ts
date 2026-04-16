/**
 * Unit tests for the Brevo HTTP client.
 *
 * We stub `globalThis.fetch` because:
 * - No network in CI by default.
 * - We need deterministic status codes and bodies.
 *
 * After each test we unstub globals so other suites keep Node’s normal fetch behavior.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendBrevoTransactionalEmail } from './brevo-smtp.service';

const fetchMock = vi.fn();

describe('sendBrevoTransactionalEmail', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('POSTs JSON payload and resolves when response is ok', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '',
    });

    await sendBrevoTransactionalEmail({
      apiKey: 'k',
      senderEmail: 'from@x.com',
      senderName: 'App',
      toEmail: 'to@x.com',
      subject: 'Hi',
      htmlContent: '<p>x</p>',
    });

    // Exactly one call to the documented Brevo URL.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.method).toBe('POST');
    // api-key header is how Brevo authenticates (not Bearer).
    expect(init.headers).toMatchObject({
      accept: 'application/json',
      'api-key': 'k',
      'content-type': 'application/json',
    });
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      sender: { name: 'App', email: 'from@x.com' },
      to: [{ email: 'to@x.com' }],
      subject: 'Hi',
      htmlContent: '<p>x</p>',
    });
  });

  it('throws with status and trimmed body when response is not ok', async () => {
    vi.stubGlobal('fetch', fetchMock);
    const longErr = 'x'.repeat(1000);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => longErr,
    });

    // Implementation slices error body to 800 chars — assert the full thrown message matches.
    await expect(
      sendBrevoTransactionalEmail({
        apiKey: 'bad',
        senderEmail: 'a@b.com',
        senderName: 'S',
        toEmail: 'c@d.com',
        subject: 'Sub',
        htmlContent: '<p></p>',
      })
    ).rejects.toThrow(`Brevo SMTP API 401: ${longErr.slice(0, 800)}`);
  });
});
