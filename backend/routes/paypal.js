import { Router } from 'express';
import supabase from '../db/init.js';
import { sendEmail, getAdminEmail, receiptNumber } from '../lib/email.js';

const router = Router();

const PAYPAL_API = process.env.PAYPAL_MODE === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

async function getAccessToken() {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET env vars.');
  }

  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('PayPal auth error:', data);
    throw new Error(data.error_description || data.error || 'PayPal auth failed');
  }
  return data.access_token;
}

// ===== DONATION ENDPOINTS =====

// Create PayPal order for donation
router.post('/donations/create-order', async (req, res) => {
  try {
    const { amount, name, email, isMonthly } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid donation amount.' });
    }

    const token = await getAccessToken();
    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: parseFloat(amount).toFixed(2),
          },
          description: isMonthly
            ? 'Monthly Donation - Step of Hope Foundation'
            : 'One-Time Donation - Step of Hope Foundation',
        }],
      }),
    });

    const order = await orderRes.json();
    if (!orderRes.ok) {
      console.error('PayPal create order error:', order);
      return res.status(500).json({ error: 'Failed to create PayPal order.' });
    }

    // Record pending donation
    await supabase.from('donations').insert({
      stripe_session_id: `paypal_${order.id}`,
      donor_name: name || 'Anonymous',
      donor_email: email || null,
      amount: Math.round(parseFloat(amount) * 100),
      is_monthly: !!isMonthly,
      status: 'pending',
    });

    res.json({ orderId: order.id });
  } catch (err) {
    console.error('PayPal donation create error:', err.message);
    res.status(500).json({ error: `Failed to create PayPal order: ${err.message}` });
  }
});

// Capture PayPal donation order
router.post('/donations/capture-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Missing order ID.' });

    const token = await getAccessToken();
    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const capture = await captureRes.json();
    if (!captureRes.ok || capture.status !== 'COMPLETED') {
      console.error('PayPal capture error:', capture);
      return res.status(500).json({ error: 'Payment capture failed.' });
    }

    const captureDetail = capture.purchase_units?.[0]?.payments?.captures?.[0];
    const paypalFee = captureDetail?.seller_receivable_breakdown?.paypal_fee?.value;
    const netAmount = captureDetail?.seller_receivable_breakdown?.net_amount?.value;

    // Update donation status
    const { data: donation } = await supabase
      .from('donations')
      .update({
        status: 'completed',
        stripe_payment_intent: `paypal_${orderId}`,
        stripe_fee: paypalFee ? Math.round(parseFloat(paypalFee) * 100) : 0,
        net_amount: netAmount ? Math.round(parseFloat(netAmount) * 100) : 0,
      })
      .eq('stripe_session_id', `paypal_${orderId}`)
      .select('*')
      .single();

    if (donation) {
      // Send receipt
      sendDonationReceipt(donation);
      sendDonationAdminNotification(donation);

      // Update stats
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
        await supabase.from('donation_stats').update(updates).eq('id', stats.id);
      }
    }

    res.json({ status: 'completed', donation });
  } catch (err) {
    console.error('PayPal donation capture error:', err.message);
    res.status(500).json({ error: 'Failed to capture payment.' });
  }
});

// ===== RESERVATION ENDPOINTS =====

// Create PayPal order for reservation
router.post('/reservations/create-order', async (req, res) => {
  try {
    const {
      serviceType, fullName, email, phone, organization,
      eventDate, startTime, numHours, eventType, eventAddress,
      indoorOutdoor, estimatedGuests, withTent, customBackdrop,
      backdropChoice, designNotes, parkingInstructions,
      setupAccessTime, powerAvailability, specialRequests,
      promoCode, totalAmount,
    } = req.body;

    if (!serviceType || !fullName || !email || !totalAmount) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const token = await getAccessToken();
    const serviceName = serviceType === 'photobooth'
      ? 'Photobooth'
      : serviceType === '360booth'
        ? '360 Video Booth'
        : 'Photo + 360 Bundle';

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: parseFloat(totalAmount).toFixed(2),
          },
          description: `${serviceName} Reservation - Step of Hope Foundation`,
        }],
      }),
    });

    const order = await orderRes.json();
    if (!orderRes.ok) {
      console.error('PayPal reservation create error:', order);
      return res.status(500).json({ error: 'Failed to create PayPal order.' });
    }

    // Handle promo code
    let appliedPromo = null;
    let discount = 0;
    if (promoCode) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase().trim())
        .single();

      if (promo && !promo.used && (!promo.expires_at || new Date(promo.expires_at) >= new Date())) {
        appliedPromo = promo;
        discount = Math.round(totalAmount * 100 * (promo.discount / 100));

        await supabase
          .from('promo_codes')
          .update({ used: true, used_at: new Date().toISOString(), used_by: email })
          .eq('id', promo.id);
      }
    }

    // Record pending reservation
    await supabase.from('reservations').insert({
      stripe_session_id: `paypal_${order.id}`,
      service_type: serviceType,
      full_name: fullName,
      email,
      phone,
      organization: organization || null,
      event_date: eventDate,
      start_time: startTime,
      num_hours: numHours,
      event_type: eventType,
      event_address: eventAddress,
      indoor_outdoor: indoorOutdoor,
      estimated_guests: estimatedGuests,
      with_tent: serviceType === '360booth' ? !!withTent : null,
      custom_backdrop: (serviceType === 'photobooth' || serviceType === 'both') ? !!customBackdrop : null,
      backdrop_choice: backdropChoice || null,
      design_notes: designNotes || null,
      parking_instructions: parkingInstructions || null,
      setup_access_time: setupAccessTime || null,
      power_availability: powerAvailability || null,
      special_requests: specialRequests || null,
      total_amount: Math.round(totalAmount * 100),
      promo_code: appliedPromo?.code || null,
      discount_amount: discount,
      status: 'pending',
    });

    res.json({ orderId: order.id });
  } catch (err) {
    console.error('PayPal reservation create error:', err.message);
    res.status(500).json({ error: `Failed to create PayPal order: ${err.message}` });
  }
});

// Capture PayPal reservation order
router.post('/reservations/capture-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Missing order ID.' });

    const token = await getAccessToken();
    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const capture = await captureRes.json();
    if (!captureRes.ok || capture.status !== 'COMPLETED') {
      console.error('PayPal reservation capture error:', capture);
      return res.status(500).json({ error: 'Payment capture failed.' });
    }

    // Update reservation status
    const { data: reservation } = await supabase
      .from('reservations')
      .update({
        status: 'paid',
        stripe_payment_intent: `paypal_${orderId}`,
      })
      .eq('stripe_session_id', `paypal_${orderId}`)
      .select('*')
      .single();

    if (reservation) {
      sendReservationConfirmation(reservation);
      sendReservationAdminNotification(reservation);
    }

    res.json({ status: 'completed', reservation });
  } catch (err) {
    console.error('PayPal reservation capture error:', err.message);
    res.status(500).json({ error: 'Failed to capture payment.' });
  }
});

// ===== EMAIL HELPERS (reuse same templates as Stripe flow) =====

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
          <div style="background: linear-gradient(135deg, #1B2A4A, #2C3E6B); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: 1px;">Step of Hope Foundation</h1>
            <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 13px; letter-spacing: 0.5px;">DONATION RECEIPT</p>
          </div>
          <div style="background: #fff; padding: 32px 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; margin: 0 0 16px;">Dear <strong>${donorName}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.7; color: #374151; margin: 0 0 8px;">Thank you for your generous donation to Step of Hope Foundation!</p>
            <p style="font-size: 15px; line-height: 1.7; color: #374151; margin: 0 0 24px;">Your kindness is doing more than you know — it is helping bring smiles, hope, and joy to children facing serious illnesses and difficult challenges.</p>
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
                <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">Payment Method</td><td style="padding: 8px 0; font-size: 14px; color: #374151; text-align: right; font-weight: 600;">PayPal</td></tr>
              </table>
              <div style="border-top: 2px solid #1B2A4A; margin-top: 12px; padding-top: 14px;">
                <span style="font-size: 15px; font-weight: 700; color: #1B2A4A;">TOTAL</span>
                <span style="font-size: 22px; font-weight: 800; color: #059669; float: right;">${amountFormatted}</span>
              </div>
            </div>
            <div style="border-left: 4px solid #C8A951; padding-left: 20px; margin: 24px 0;">
              <p style="font-size: 15px; line-height: 1.7; color: #374151; margin: 0 0 12px;">Because of your support, we can continue organizing hospital visits, dream birthdays, holiday celebrations, and special events that make a real difference in a child's life.</p>
              <p style="font-size: 15px; line-height: 1.7; color: #374151; margin: 0;">Thank you for helping us turn kindness into hope.</p>
            </div>
          </div>
          <div style="background: #1B2A4A; padding: 24px 30px; text-align: center; border-radius: 0 0 12px 12px;">
            <p style="color: #C8A951; font-size: 14px; font-weight: 600; font-style: italic; margin: 0 0 8px;">"Every Child Deserves to Smile"</p>
            <p style="font-size: 13px; color: rgba(255,255,255,0.5); margin: 0 0 4px;">Step of Hope Foundation</p>
            <a href="https://www.stepofhope.org" style="font-size: 13px; color: rgba(255,255,255,0.7); text-decoration: none;">www.stepofhope.org</a>
          </div>
        </div>
      `,
    });

    await supabase.from('donations').update({ thank_you_sent: true }).eq('id', donation.id);
  } catch (err) {
    console.error('PayPal donation receipt error:', err.message);
  }
}

async function sendDonationAdminNotification(donation) {
  try {
    const amountFormatted = `$${(donation.amount / 100).toFixed(2)}`;
    await sendEmail({
      to: getAdminEmail(),
      subject: `New PayPal Donation — ${amountFormatted} from ${donation.donor_name || 'Anonymous'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1B2A4A;">New PayPal Donation Received</h2>
          <p><strong>Amount:</strong> ${amountFormatted}</p>
          <p><strong>Donor:</strong> ${donation.donor_name || 'Anonymous'}</p>
          <p><strong>Email:</strong> ${donation.donor_email || 'N/A'}</p>
          <p><strong>Type:</strong> ${donation.is_monthly ? 'Monthly (recurring)' : 'One-Time'}</p>
          <p><strong>Payment:</strong> PayPal</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString('en-US')}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('PayPal admin notification error:', err.message);
  }
}

async function sendReservationConfirmation(reservation) {
  try {
    const totalFormatted = `$${(reservation.total_amount / 100).toFixed(2)}`;
    const serviceName = reservation.service_type === 'photobooth' ? 'Photobooth' : reservation.service_type === '360booth' ? '360 Video Booth' : 'Photo + 360 Bundle';
    const eventDate = new Date(reservation.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const createdAt = reservation.created_at || new Date().toISOString();
    const receiptDate = new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const receiptNo = receiptNumber('R', reservation.id, createdAt);

    await sendEmail({
      to: reservation.email,
      subject: `Receipt — Your ${serviceName} Reservation with Step of Hope`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1B2A4A;">
          <div style="background: linear-gradient(135deg, #1B2A4A, #2C3E6B); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: 1px;">Step of Hope Foundation</h1>
            <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 13px; letter-spacing: 0.5px;">RESERVATION RECEIPT</p>
          </div>
          <div style="background: #fff; padding: 32px 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; margin: 0 0 16px;">Dear <strong>${reservation.full_name}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.7; color: #374151; margin: 0 0 24px;">Thank you for your reservation with Step of Hope Foundation! Your payment via PayPal has been confirmed.</p>
            <div style="background: #f9fafb; border-radius: 10px; padding: 24px; margin: 0 0 24px; border: 1px solid #e5e7eb;">
              <table style="width: 100%; margin-bottom: 16px;"><tr>
                <td style="text-align: left;"><h3 style="margin: 0; font-size: 16px; color: #1B2A4A;">Receipt #${receiptNo}</h3></td>
                <td style="text-align: right; white-space: nowrap;"><span style="font-size: 13px; color: #6b7280;">${receiptDate}</span></td>
              </tr></table>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 0; font-size: 13px; color: #6b7280; text-transform: uppercase;">Item</td>
                  <td style="padding: 10px 0; font-size: 13px; color: #6b7280; text-transform: uppercase; text-align: right;">Details</td>
                </tr>
                <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">Service</td><td style="padding: 8px 0; font-size: 14px; color: #374151; text-align: right; font-weight: 600;">${serviceName}</td></tr>
                <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">Event Date</td><td style="padding: 8px 0; font-size: 14px; color: #374151; text-align: right; font-weight: 600;">${eventDate}</td></tr>
                <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">Start Time</td><td style="padding: 8px 0; font-size: 14px; color: #374151; text-align: right; font-weight: 600;">${reservation.start_time}</td></tr>
                <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">Duration</td><td style="padding: 8px 0; font-size: 14px; color: #374151; text-align: right; font-weight: 600;">${reservation.num_hours} hours</td></tr>
                <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">Payment Method</td><td style="padding: 8px 0; font-size: 14px; color: #374151; text-align: right; font-weight: 600;">PayPal</td></tr>
              </table>
              <div style="border-top: 2px solid #1B2A4A; margin-top: 12px; padding-top: 14px;">
                <span style="font-size: 15px; font-weight: 700; color: #1B2A4A;">TOTAL PAID</span>
                <span style="font-size: 22px; font-weight: 800; color: #059669; float: right;">${totalFormatted}</span>
              </div>
            </div>
            <div style="border-left: 4px solid #C8A951; padding-left: 20px; margin: 24px 0;">
              <p style="font-size: 15px; line-height: 1.7; color: #374151; margin: 0 0 12px;">Because of your support, we can continue organizing hospital visits, dream birthdays, holiday celebrations, and special events that make a real difference in a child's life.</p>
              <p style="font-size: 15px; line-height: 1.7; color: #374151; margin: 0;">We look forward to celebrating with you!</p>
            </div>
          </div>
          <div style="background: #1B2A4A; padding: 24px 30px; text-align: center; border-radius: 0 0 12px 12px;">
            <p style="color: #C8A951; font-size: 14px; font-weight: 600; font-style: italic; margin: 0 0 8px;">"Every Child Deserves to Smile"</p>
            <p style="font-size: 13px; color: rgba(255,255,255,0.5); margin: 0 0 4px;">Step of Hope Foundation</p>
            <a href="https://www.stepofhope.org" style="font-size: 13px; color: rgba(255,255,255,0.7); text-decoration: none;">www.stepofhope.org</a>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('PayPal reservation receipt error:', err.message);
  }
}

async function sendReservationAdminNotification(reservation) {
  try {
    const totalFormatted = `$${(reservation.total_amount / 100).toFixed(2)}`;
    const recipients = [getAdminEmail(), 'onecallproduction@gmail.com'];

    await sendEmail({
      to: recipients,
      subject: `New PayPal Reservation - ${reservation.service_type === 'photobooth' ? 'Photobooth' : '360 Video Booth'} - ${reservation.full_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1B2A4A;">New PayPal Reservation Received</h2>
          <p><strong>Payment:</strong> PayPal</p>
          <p><strong>Status:</strong> Paid</p>
          <hr/>
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> ${reservation.full_name}</p>
          <p><strong>Email:</strong> ${reservation.email}</p>
          <p><strong>Phone:</strong> ${reservation.phone}</p>
          <p><strong>Organization:</strong> ${reservation.organization || 'N/A'}</p>
          <hr/>
          <h3>Event Details</h3>
          <p><strong>Service:</strong> ${reservation.service_type === 'photobooth' ? 'Photobooth' : '360 Video Booth'}</p>
          <p><strong>Date:</strong> ${new Date(reservation.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Start Time:</strong> ${reservation.start_time}</p>
          <p><strong>Hours:</strong> ${reservation.num_hours}</p>
          <p><strong>Event Type:</strong> ${reservation.event_type}</p>
          <p><strong>Location:</strong> ${reservation.event_address}</p>
          <hr/>
          <p><strong>Total Paid:</strong> ${totalFormatted}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('PayPal reservation admin notification error:', err.message);
  }
}

// Expose client ID to frontend
router.get('/client-id', (req, res) => {
  res.json({ clientId: process.env.PAYPAL_CLIENT_ID });
});

export default router;
