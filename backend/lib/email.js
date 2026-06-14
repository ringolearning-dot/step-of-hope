import { Resend } from 'resend';

let resend;

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = 'Step of Hope Foundation <noreply@stepofhope.org>';

export async function sendEmail({ to, subject, html }) {
  const r = getResend();
  const from = process.env.RESEND_FROM_EMAIL || FROM_EMAIL;
  const { data, error } = await r.emails.send({ from, to, subject, html });
  if (error) throw new Error(error.message);
  return data;
}

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL || 'anthonytannourydev@gmail.com';
}

/**
 * Generate a receipt number.
 * Format: SOH-R-20260614-0042  (reservations)
 *         SOH-D-20260614-0042  (donations)
 * @param {'R'|'D'} type - R for reservation, D for donation
 * @param {string|number} id - The database record id
 */
export function receiptNumber(type, id, createdAt) {
  const d = createdAt ? new Date(createdAt) : new Date();
  const date = d.toISOString().slice(0, 10).replace(/-/g, '');
  const short = typeof id === 'number'
    ? String(id).padStart(4, '0')
    : String(id).split('-')[0].toUpperCase();
  return `SOH-${type}-${date}-${short}`;
}
