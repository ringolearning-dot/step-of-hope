import { Router } from 'express';
import nodemailer from 'nodemailer';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateDailySummary } from './ai-assistant.js';

const router = Router();

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// Send daily report manually (or triggered by cron)
router.post('/admin/send', authenticateToken, async (req, res) => {
  try {
    const summary = await generateDailySummary();
    await sendDailyEmail(summary);
    res.json({ success: true, message: 'Daily report sent.' });
  } catch (err) {
    console.error('Daily email error:', err.message);
    res.status(500).json({ error: 'Failed to send daily report.' });
  }
});

// Get last sent report
router.get('/admin/last', authenticateToken, async (req, res) => {
  try {
    const summary = await generateDailySummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate summary.' });
  }
});

// Send daily report email
export async function sendDailyEmail(summary) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const transporter = getTransporter();

  const html = buildEmailHTML(summary);

  await transporter.sendMail({
    from: `"Step of Hope Admin" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `📊 Daily Report - Step of Hope (${summary.date})`,
    html,
  });
}

function buildEmailHTML(summary) {
  return `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 22px;">📊 Step of Hope Daily Report</h1>
        <p style="margin: 8px 0 0; opacity: 0.9;">${summary.date}</p>
      </div>

      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0;">
        <!-- Balance -->
        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #10b981;">
          <h3 style="margin: 0 0 8px; color: #374151;">💰 Current Balance</h3>
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #10b981;">$${(summary.balance / 100).toFixed(2)}</p>
        </div>

        <!-- Donations -->
        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #3b82f6;">
          <h3 style="margin: 0 0 8px; color: #374151;">🎁 Donations Today</h3>
          <p style="margin: 0;">Count: <strong>${summary.donations.count}</strong> | Total: <strong>$${(summary.donations.total / 100).toFixed(2)}</strong></p>
          ${summary.donations.items.length > 0 ? summary.donations.items.map(d => `<p style="margin: 4px 0; font-size: 14px; color: #6b7280;">• ${d.donor_name}: $${(d.amount / 100).toFixed(2)}</p>`).join('') : '<p style="margin: 4px 0; font-size: 14px; color: #6b7280;">No donations today</p>'}
        </div>

        <!-- Expenses -->
        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 8px; color: #374151;">💸 Expenses Today</h3>
          <p style="margin: 0;">Count: <strong>${summary.expenses.count}</strong> | Total: <strong>$${(summary.expenses.total / 100).toFixed(2)}</strong></p>
          ${summary.expenses.items.length > 0 ? summary.expenses.items.map(e => `<p style="margin: 4px 0; font-size: 14px; color: #6b7280;">• ${e.title}: $${(e.amount / 100).toFixed(2)}</p>`).join('') : '<p style="margin: 4px 0; font-size: 14px; color: #6b7280;">No expenses today</p>'}
        </div>

        <!-- Reservations -->
        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #8b5cf6;">
          <h3 style="margin: 0 0 8px; color: #374151;">📅 New Reservations</h3>
          <p style="margin: 0;">Count: <strong>${summary.reservations.count}</strong></p>
          ${summary.reservations.items.length > 0 ? summary.reservations.items.map(r => `<p style="margin: 4px 0; font-size: 14px; color: #6b7280;">• ${r.full_name} - ${r.service_type} (${r.event_date})</p>`).join('') : '<p style="margin: 4px 0; font-size: 14px; color: #6b7280;">No new reservations</p>'}
        </div>

        <!-- Volunteers -->
        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #06b6d4;">
          <h3 style="margin: 0 0 8px; color: #374151;">🤝 Volunteer Applications</h3>
          <p style="margin: 0;">New today: <strong>${summary.volunteers.count}</strong></p>
          ${summary.volunteers.items.length > 0 ? summary.volunteers.items.map(v => `<p style="margin: 4px 0; font-size: 14px; color: #6b7280;">• ${v.first_name} ${v.last_name}</p>`).join('') : '<p style="margin: 4px 0; font-size: 14px; color: #6b7280;">No new applications</p>'}
        </div>

        <!-- Overdue Bills -->
        ${summary.overdueBills.length > 0 ? `
        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #ef4444;">
          <h3 style="margin: 0 0 8px; color: #ef4444;">⚠️ Overdue Bills</h3>
          ${summary.overdueBills.map(b => `<p style="margin: 4px 0; font-size: 14px; color: #6b7280;">• ${b.title}: $${(b.amount / 100).toFixed(2)} (due ${b.next_due_date})</p>`).join('')}
        </div>` : ''}

        <!-- Upcoming Bills -->
        ${summary.upcomingBills.length > 0 ? `
        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #f97316;">
          <h3 style="margin: 0 0 8px; color: #374151;">📋 Bills Due Soon (3 days)</h3>
          ${summary.upcomingBills.map(b => `<p style="margin: 4px 0; font-size: 14px; color: #6b7280;">• ${b.title}: $${(b.amount / 100).toFixed(2)} (due ${b.next_due_date})</p>`).join('')}
        </div>` : ''}
      </div>

      <div style="background: #1e3a5f; color: white; padding: 16px; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="margin: 0; font-size: 12px; opacity: 0.8;">Step of Hope Foundation - Admin Dashboard Report</p>
      </div>
    </div>
  `;
}

// Auto-run daily at midnight (called by server scheduled task)
export async function runDailyReport() {
  try {
    const summary = await generateDailySummary();
    await sendDailyEmail(summary);
    console.log('Daily report sent successfully.');
  } catch (err) {
    console.error('Auto daily report error:', err.message);
  }
}

export default router;
