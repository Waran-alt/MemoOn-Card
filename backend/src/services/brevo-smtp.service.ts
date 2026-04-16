/**
 * Brevo (ex-Sendinblue) transactional email via REST API.
 *
 * This module is intentionally thin: one HTTP call, no retries. The password-reset flow
 * catches errors and logs them so a transient Brevo outage does not crash the request.
 *
 * API reference: https://developers.brevo.com/reference/sendtransacemail
 */

/** Official transactional send endpoint (SMTP relay API name, but it is HTTP JSON). */
const BREVO_SMTP_API_URL = 'https://api.brevo.com/v3/smtp/email';

/** Payload shape for a single transactional message (HTML body). */
export type BrevoSendParams = {
  apiKey: string;
  senderEmail: string;
  senderName: string;
  toEmail: string;
  subject: string;
  htmlContent: string;
};

/**
 * Sends one email through Brevo. Uses global `fetch` (Node 18+).
 *
 * - On HTTP 2xx: resolves with no value.
 * - On non-OK: reads response body as text, truncates to 800 chars (log-safe), throws Error.
 *
 * Callers should wrap in try/catch if they need to degrade gracefully.
 */
export async function sendBrevoTransactionalEmail(params: BrevoSendParams): Promise<void> {
  const res = await fetch(BREVO_SMTP_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': params.apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: params.senderName, email: params.senderEmail },
      to: [{ email: params.toEmail }],
      subject: params.subject,
      htmlContent: params.htmlContent,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    // Cap length so error messages stay bounded in logs and test assertions.
    throw new Error(`Brevo SMTP API ${res.status}: ${text.slice(0, 800)}`);
  }
}
