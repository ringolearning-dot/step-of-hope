import { Router } from 'express';
import Stripe from 'stripe';
import db from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// Create checkout session
router.post('/create-session', async (req, res) => {
  try {
    const { amount, donorName, donorEmail, isMonthly } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid donation amount.' });
    }

    const stripe = getStripe();
    const sessionParams = {
      payment_method_types: ['card'],
      customer_email: donorEmail || undefined,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: isMonthly ? 'Monthly Donation - Step of Hope Foundation' : 'One-Time Donation - Step of Hope Foundation',
            description: 'Thank you for supporting children and families in need.',
          },
          unit_amount: Math.round(amount * 100),
          ...(isMonthly ? { recurring: { interval: 'month' } } : {}),
        },
        quantity: 1,
      }],
      mode: isMonthly ? 'subscription' : 'payment',
      success_url: `${process.env.FRONTEND_URL}/donate?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/donate?canceled=true`,
      metadata: {
        donor_name: donorName || 'Anonymous',
        is_monthly: isMonthly ? '1' : '0',
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Record pending donation
    db.prepare(
      'INSERT INTO donations (stripe_session_id, donor_name, donor_email, amount, is_monthly, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(session.id, donorName || 'Anonymous', donorEmail || null, Math.round(amount * 100), isMonthly ? 1 : 0, 'pending');

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe session error:', err.message);
    res.status(500).json({ error: 'Failed to create donation session.' });
  }
});

// Stripe webhook
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      db.prepare(
        'UPDATE donations SET status = ?, stripe_payment_intent = ? WHERE stripe_session_id = ?'
      ).run('completed', session.payment_intent || session.subscription, session.id);

      // Update stats
      const donation = db.prepare('SELECT * FROM donations WHERE stripe_session_id = ?').get(session.id);
      if (donation) {
        db.prepare('UPDATE donation_stats SET total_raised = total_raised + ?, total_donors = total_donors + 1, updated_at = CURRENT_TIMESTAMP').run(donation.amount);
        if (donation.is_monthly) {
          db.prepare('UPDATE donation_stats SET monthly_donors = monthly_donors + 1, updated_at = CURRENT_TIMESTAMP').run();
        }
      }
      break;
    }
    case 'checkout.session.expired': {
      const session = event.data.object;
      db.prepare('UPDATE donations SET status = ? WHERE stripe_session_id = ?').run('expired', session.id);
      break;
    }
  }

  res.json({ received: true });
});

// Verify session (after redirect)
router.get('/verify/:sessionId', async (req, res) => {
  try {
    const donation = db.prepare('SELECT * FROM donations WHERE stripe_session_id = ?').get(req.params.sessionId);
    if (!donation) return res.status(404).json({ error: 'Donation not found.' });
    res.json({ status: donation.status, amount: donation.amount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify donation.' });
  }
});

// ===== ADMIN ROUTES =====

// Get all donations
router.get('/admin/all', authenticateToken, (req, res) => {
  const { page = 1, limit = 50, status, startDate, endDate } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM donations WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM donations WHERE 1=1';
  const params = [];
  const countParams = [];

  if (status) {
    query += ' AND status = ?';
    countQuery += ' AND status = ?';
    params.push(status);
    countParams.push(status);
  }
  if (startDate) {
    query += ' AND created_at >= ?';
    countQuery += ' AND created_at >= ?';
    params.push(startDate);
    countParams.push(startDate);
  }
  if (endDate) {
    query += ' AND created_at <= ?';
    countQuery += ' AND created_at <= ?';
    params.push(endDate);
    countParams.push(endDate);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const donations = db.prepare(query).all(...params);
  const { total } = db.prepare(countQuery).get(...countParams);

  res.json({ donations, total, page: Number(page), totalPages: Math.ceil(total / limit) });
});

// Get dashboard stats
router.get('/admin/stats', authenticateToken, (req, res) => {
  const stats = db.prepare('SELECT * FROM donation_stats LIMIT 1').get();

  const today = new Date().toISOString().split('T')[0];
  const todayDonations = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM donations WHERE status = 'completed' AND date(created_at) = ?"
  ).get(today);

  const thisMonth = today.substring(0, 7);
  const monthDonations = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM donations WHERE status = 'completed' AND strftime('%Y-%m', created_at) = ?"
  ).get(thisMonth);

  const recentDonations = db.prepare(
    "SELECT * FROM donations WHERE status = 'completed' ORDER BY created_at DESC LIMIT 10"
  ).all();

  // Monthly breakdown for chart (last 12 months)
  const monthlyBreakdown = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month,
           SUM(amount) as total,
           COUNT(*) as count
    FROM donations
    WHERE status = 'completed' AND created_at >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month ASC
  `).all();

  res.json({
    totalRaised: stats?.total_raised || 0,
    totalDonors: stats?.total_donors || 0,
    monthlyDonors: stats?.monthly_donors || 0,
    todayTotal: todayDonations.total,
    todayCount: todayDonations.count,
    monthTotal: monthDonations.total,
    monthCount: monthDonations.count,
    recentDonations,
    monthlyBreakdown
  });
});

// Export donations as CSV
router.get('/admin/export', authenticateToken, (req, res) => {
  const donations = db.prepare(
    "SELECT id, donor_name, donor_email, amount, currency, status, is_monthly, created_at FROM donations ORDER BY created_at DESC"
  ).all();

  const csv = [
    'ID,Donor Name,Email,Amount (cents),Currency,Status,Monthly,Date',
    ...donations.map(d =>
      `${d.id},"${d.donor_name || ''}","${d.donor_email || ''}",${d.amount},${d.currency},${d.status},${d.is_monthly ? 'Yes' : 'No'},"${d.created_at}"`
    )
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=donations-export.csv');
  res.send(csv);
});

export default router;
