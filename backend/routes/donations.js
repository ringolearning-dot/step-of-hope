import { Router } from 'express';
import Stripe from 'stripe';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendEmail, getAdminEmail, receiptNumber } from '../lib/email.js';

const router = Router();

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// Send donation receipt email to donor
async function sendDonationReceipt(donation) {
  if (!donation.donor_email) return;
  try {
    const amountFormatted = `$${(donation.amount / 100).toFixed(2)}`;
    const donorName = donation.donor_name || 'Friend';
    const createdAt = donation.created_at || new Date().toISOString();
    const receiptDate = new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const donationType = donation.is_monthly ? 'Monthly Donation' : 'One-Time Donation';
    const receiptNo = receiptNumber('D', donation.id, createdAt);

    await sendEmail({
      to: donation.donor_email,
      subject: `Thank You for Your Donation — Step of Hope Foundation`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1B2A4A;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1B2A4A, #2C3E6B); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: 1px;">Step of Hope Foundation</h1>
            <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 13px; letter-spacing: 0.5px;">DONATION RECEIPT</p>
          </div>

          <!-- Body -->
          <div style="background: #fff; padding: 32px 30px; border: 1px solid #e5e7eb; border-top: none;">
            <!-- Thank you message -->
            <p style="font-size: 16px; margin: 0 0 16px;">Dear <strong>${donorName}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.7; color: #374151; margin: 0 0 8px;">
              Thank you for your generous donation to Step of Hope Foundation!
            </p>
            <p style="font-size: 15px; line-height: 1.7; color: #374151; margin: 0 0 24px;">
              Your kindness is doing more than you know — it is helping bring smiles, hope, and joy to children facing serious illnesses and difficult challenges.
            </p>

            <!-- Receipt Box -->
            <div style="background: #f9fafb; border-radius: 10px; padding: 24px; margin: 0 0 24px; border: 1px solid #e5e7eb;">
              <table style="width: 100%; margin-bottom: 16px;"><tr>
                <td style="text-align: left;"><h3 style="margin: 0; font-size: 16px; color: #1B2A4A;">Receipt #${receiptNo}</h3></td>
                <td style="text-align: right; white-space: nowrap;"><span style="font-size: 13px; color: #6b7280;">${receiptDate}</span></td>
              </tr></table>

              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Description</td>
                  <td style="padding: 10px 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Amount</td>
                </tr>
                <tr><td style="padding: 10px 0; font-size: 14px; color: #374151;">${donationType}</td><td style="padding: 10px 0; font-size: 14px; color: #374151; text-align: right; font-weight: 600;">${amountFormatted}</td></tr>
                <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">Donor</td><td style="padding: 8px 0; font-size: 14px; color: #374151; text-align: right; font-weight: 600;">${donorName}</td></tr>
                ${donation.donor_email ? `<tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">Email</td><td style="padding: 8px 0; font-size: 14px; color: #374151; text-align: right;">${donation.donor_email}</td></tr>` : ''}
                ${donation.is_monthly ? `<tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">Frequency</td><td style="padding: 8px 0; font-size: 14px; color: #374151; text-align: right; font-weight: 600;">Monthly (recurring)</td></tr>` : ''}
              </table>

              <!-- Total -->
              <div style="border-top: 2px solid #1B2A4A; margin-top: 12px; padding-top: 14px;">
                <span style="font-size: 15px; font-weight: 700; color: #1B2A4A;">TOTAL</span>
                <span style="font-size: 22px; font-weight: 800; color: #059669; float: right;">${amountFormatted}</span>
              </div>
            </div>

            <!-- Mission message -->
            <div style="border-left: 4px solid #C8A951; padding-left: 20px; margin: 24px 0;">
              <p style="font-size: 15px; line-height: 1.7; color: #374151; margin: 0 0 12px;">
                Because of your support, we can continue organizing hospital visits, dream birthdays, holiday celebrations, and special events that make a real difference in a child's life.
              </p>
              <p style="font-size: 15px; line-height: 1.7; color: #374151; margin: 0 0 12px;">
                Every dollar raised helps bring more smiles, hope, and meaningful experiences to children who need them most.
              </p>
              <p style="font-size: 15px; line-height: 1.7; color: #374151; margin: 0;">
                Thank you for helping us turn kindness into hope.
              </p>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #1B2A4A; padding: 24px 30px; text-align: center; border-radius: 0 0 12px 12px;">
            <p style="color: #C8A951; font-size: 14px; font-weight: 600; font-style: italic; margin: 0 0 8px;">"Every Child Deserves to Smile"</p>
            <p style="font-size: 13px; color: rgba(255,255,255,0.5); margin: 0 0 4px;">Step of Hope Foundation</p>
            <a href="https://www.stepofhope.org" style="font-size: 13px; color: rgba(255,255,255,0.7); text-decoration: none;">www.stepofhope.org</a>
          </div>
        </div>
      `,
    });

    // Mark thank you as sent
    await supabase
      .from('donations')
      .update({ thank_you_sent: true })
      .eq('id', donation.id);
  } catch (err) {
    console.error('Failed to send donation receipt email:', err.message);
  }
}

// Send donation notification to admin
async function sendDonationAdminNotification(donation) {
  try {
    const amountFormatted = `$${(donation.amount / 100).toFixed(2)}`;

    await sendEmail({
      to: getAdminEmail(),
      subject: `New Donation — ${amountFormatted} from ${donation.donor_name || 'Anonymous'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1B2A4A;">New Donation Received</h2>
          <p><strong>Amount:</strong> ${amountFormatted}</p>
          <p><strong>Donor:</strong> ${donation.donor_name || 'Anonymous'}</p>
          <p><strong>Email:</strong> ${donation.donor_email || 'N/A'}</p>
          <p><strong>Type:</strong> ${donation.is_monthly ? 'Monthly (recurring)' : 'One-Time'}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString('en-US')}</p>
          <p><strong>Status:</strong> Completed</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send donation admin notification:', err.message);
  }
}

// Create checkout session
router.post('/create-session', async (req, res) => {
  try {
    const { amount, name: donorName, email: donorEmail, isMonthly } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid donation amount.' });
    }

    const stripe = getStripe();
    const sessionParams = {
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
    await supabase.from('donations').insert({
      stripe_session_id: session.id,
      donor_name: donorName || 'Anonymous',
      donor_email: donorEmail || null,
      amount: Math.round(amount * 100),
      is_monthly: !!isMonthly,
      status: 'pending',
    });

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
    if (process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET !== 'whsec_REPLACE_WITH_YOUR_WEBHOOK_SECRET') {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      // No webhook secret configured — parse body directly (less secure but functional)
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      await supabase
        .from('donations')
        .update({
          status: 'completed',
          stripe_payment_intent: session.payment_intent || session.subscription,
        })
        .eq('stripe_session_id', session.id);

      // Update stats
      const { data: donation } = await supabase
        .from('donations')
        .select('*')
        .eq('stripe_session_id', session.id)
        .single();

      if (donation) {
        // Send receipt email to donor and notification to admin
        sendDonationReceipt(donation);
        sendDonationAdminNotification(donation);

        // Fetch current stats, increment, and update
        const { data: stats } = await supabase
          .from('donation_stats')
          .select('*')
          .limit(1)
          .single();

        if (stats) {
          const updates = {
            total_raised: stats.total_raised + donation.amount,
            total_donors: stats.total_donors + 1,
            updated_at: new Date().toISOString(),
          };
          if (donation.is_monthly) {
            updates.monthly_donors = stats.monthly_donors + 1;
          }
          await supabase
            .from('donation_stats')
            .update(updates)
            .eq('id', stats.id);
        }
      }
      break;
    }
    case 'checkout.session.expired': {
      const session = event.data.object;
      await supabase
        .from('donations')
        .update({ status: 'expired' })
        .eq('stripe_session_id', session.id);
      break;
    }
  }

  res.json({ received: true });
});

// Verify session (after redirect)
router.get('/verify/:sessionId', async (req, res) => {
  try {
    const { data: donation, error } = await supabase
      .from('donations')
      .select('*')
      .eq('stripe_session_id', req.params.sessionId)
      .single();

    if (error || !donation) return res.status(404).json({ error: 'Donation not found.' });
    res.json({ status: donation.status, amount: donation.amount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify donation.' });
  }
});

// Sync pending donations with Stripe (check actual payment status + fees)
router.post('/admin/sync', authenticateToken, async (req, res) => {
  try {
    const stripe = getStripe();
    const { data: pendingDonations } = await supabase
      .from('donations')
      .select('*')
      .eq('status', 'pending');

    let synced = 0;
    for (const donation of (pendingDonations || [])) {
      if (!donation.stripe_session_id) continue;
      try {
        const session = await stripe.checkout.sessions.retrieve(donation.stripe_session_id, {
          expand: ['payment_intent.latest_charge.balance_transaction'],
        });

        const updates = {};

        if (session.payment_status === 'paid') {
          updates.status = 'completed';
          updates.stripe_payment_intent = session.payment_intent?.id || session.subscription;

          // Get fee and net from balance transaction
          const charge = session.payment_intent?.latest_charge;
          const balanceTx = charge?.balance_transaction;
          if (balanceTx) {
            updates.stripe_fee = balanceTx.fee; // in cents
            updates.net_amount = balanceTx.net; // in cents
          }
          synced++;
        } else if (session.status === 'expired') {
          updates.status = 'expired';
          synced++;
        }

        if (Object.keys(updates).length > 0) {
          await supabase
            .from('donations')
            .update(updates)
            .eq('id', donation.id);
        }
      } catch (stripeErr) {
        console.error(`Sync error for donation ${donation.id}:`, stripeErr.message);
      }
    }

    res.json({ synced, total: (pendingDonations || []).length });
  } catch (err) {
    console.error('Sync error:', err.message);
    res.status(500).json({ error: 'Failed to sync with Stripe.' });
  }
});

// ===== ADMIN ROUTES =====

// Get all donations
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    // Build the data query
    let query = supabase
      .from('donations')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data: donations, count: total, error } = await query;

    if (error) {
      console.error('Fetch donations error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch donations.' });
    }

    res.json({
      donations: donations || [],
      total: total || 0,
      page: Number(page),
      totalPages: Math.ceil((total || 0) / limit),
    });
  } catch (err) {
    console.error('Admin donations error:', err.message);
    res.status(500).json({ error: 'Failed to fetch donations.' });
  }
});

// Get dashboard stats
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    // Get donation_stats
    const { data: stats } = await supabase
      .from('donation_stats')
      .select('*')
      .limit(1)
      .single();

    // Today's donations
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const { data: todayData } = await supabase
      .from('donations')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', tomorrowStart.toISOString());

    const todayTotal = (todayData || []).reduce((sum, d) => sum + d.amount, 0);
    const todayCount = (todayData || []).length;

    // This month's donations
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const nextMonthStart = new Date(monthStart);
    nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);

    const { data: monthData } = await supabase
      .from('donations')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', monthStart.toISOString())
      .lt('created_at', nextMonthStart.toISOString());

    const monthTotal = (monthData || []).reduce((sum, d) => sum + d.amount, 0);
    const monthCount = (monthData || []).length;

    // Recent donations
    const { data: recentDonations } = await supabase
      .from('donations')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    // Monthly breakdown for chart (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const { data: breakdownData } = await supabase
      .from('donations')
      .select('amount, created_at')
      .eq('status', 'completed')
      .gte('created_at', twelveMonthsAgo.toISOString())
      .order('created_at', { ascending: true });

    // Group by month in JS
    const monthlyMap = {};
    (breakdownData || []).forEach((d) => {
      const month = d.created_at.substring(0, 7); // 'YYYY-MM'
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, total: 0, count: 0 };
      }
      monthlyMap[month].total += d.amount;
      monthlyMap[month].count += 1;
    });
    const monthlyBreakdown = Object.values(monthlyMap).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    res.json({
      totalRaised: stats?.total_raised || 0,
      totalDonors: stats?.total_donors || 0,
      monthlyDonors: stats?.monthly_donors || 0,
      todayTotal,
      todayCount,
      monthTotal,
      monthCount,
      recentDonations: recentDonations || [],
      monthlyBreakdown,
    });
  } catch (err) {
    console.error('Admin stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// Resend receipt email to donor
router.post('/admin/:id/send-receipt', authenticateToken, async (req, res) => {
  try {
    const { data: donation, error } = await supabase
      .from('donations')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !donation) return res.status(404).json({ error: 'Donation not found.' });
    if (!donation.donor_email) return res.status(400).json({ error: 'No email address on file for this donation.' });

    await sendDonationReceipt(donation);
    res.json({ message: 'Receipt email sent.' });
  } catch (err) {
    console.error('Resend donation receipt error:', err.message);
    res.status(500).json({ error: 'Failed to send receipt email.' });
  }
});

// Export donations as CSV
router.get('/admin/export', authenticateToken, async (req, res) => {
  try {
    const { data: donations, error } = await supabase
      .from('donations')
      .select('id, donor_name, donor_email, amount, currency, status, is_monthly, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to export donations.' });
    }

    const csv = [
      'ID,Donor Name,Email,Amount (cents),Currency,Status,Monthly,Date',
      ...(donations || []).map(d =>
        `${d.id},"${d.donor_name || ''}","${d.donor_email || ''}",${d.amount},${d.currency},${d.status},${d.is_monthly ? 'Yes' : 'No'},"${d.created_at}"`
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=donations-export.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export error:', err.message);
    res.status(500).json({ error: 'Failed to export donations.' });
  }
});

export default router;
