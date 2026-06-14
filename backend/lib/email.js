import { Resend } from 'resend';

let resend;

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = 'Step of Hope Foundation <onboarding@resend.dev>';

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
