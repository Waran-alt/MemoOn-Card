/**
 * Brevo (ex-Sendinblue) transactional email via REST API.
 * https://developers.brevo.com/reference/sendtransacemail
 */

const BREVO_SMTP_API_URL = 'https://api.brevo.com/v3/smtp/email';

export type BrevoSendParams = {
  apiKey: string;
  senderEmail: string;
  senderName: string;
  toEmail: string;
  subject: string;
  htmlContent: string;
};

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
    throw new Error(`Brevo SMTP API ${res.status}: ${text.slice(0, 800)}`);
  }
}
