import { Router } from 'express';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// Default pricing (used as fallback)
const DEFAULT_PRICING = {
  photobooth_base: 800,
  photobooth_extra_hour: 150,
  photobooth_backdrop: 200,
  '360booth_base': 600,
  '360booth_tent': 750,
  '360booth_extra_hour': 150,
  both_base: 1300,
  both_extra_hour: 250,
  both_backdrop: 200,
};

// Fetch pricing from database
async function getPricing() {
  try {
    const { data } = await supabase
      .from('site_content')
      .select('field_key, field_value')
      .eq('page', 'pricing');

    if (data && data.length > 0) {
      const pricing = { ...DEFAULT_PRICING };
      data.forEach((row) => {
        if (row.field_value) pricing[row.field_key] = parseInt(row.field_value);
      });
      return pricing;
    }
  } catch (err) {
    console.error('Failed to fetch pricing:', err.message);
  }
  return DEFAULT_PRICING;
}

// Get pricing (public endpoint)
router.get('/pricing', async (req, res) => {
  const pricing = await getPricing();
  res.json(pricing);
});

// Update pricing (admin only)
router.put('/admin/pricing', authenticateToken, async (req, res) => {
  try {
    const prices = req.body;
    for (const [key, value] of Object.entries(prices)) {
      await supabase
        .from('site_content')
        .upsert({ page: 'pricing', field_key: key, field_value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'page,field_key' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Update pricing error:', err.message);
    res.status(500).json({ error: 'Failed to update pricing.' });
  }
});

// Calculate total price
async function calculateTotalAsync(serviceType, options) {
  const p = await getPricing();
  return calculateTotalWithPricing(serviceType, options, p);
}

function calculateTotalWithPricing(serviceType, options, p) {
  let base = 0;
  let extras = 0;

  if (serviceType === 'photobooth') {
    base = p.photobooth_base;
    const extraHours = Math.max(0, (options.numHours || 3) - 3);
    extras += extraHours * p.photobooth_extra_hour;
    if (options.customBackdrop) extras += p.photobooth_backdrop;
  } else if (serviceType === 'both') {
    base = p.both_base;
    const extraHours = Math.max(0, (options.numHours || 3) - 3);
    extras += extraHours * p.both_extra_hour;
    if (options.customBackdrop) extras += p.both_backdrop;
  } else if (serviceType === '360booth') {
    base = options.withTent ? p['360booth_tent'] : p['360booth_base'];
    const extraHours = Math.max(0, (options.numHours || 3) - 3);
    extras += extraHours * p['360booth_extra_hour'];
  }

  return base + extras;
}

// Build line items for Stripe
function buildLineItems(serviceType, options, p) {
  const items = [];

  if (serviceType === 'photobooth') {
    items.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Photobooth - 3 Hours', description: 'Step of Hope Photobooth experience (3 hours included)' },
        unit_amount: p.photobooth_base * 100,
      },
      quantity: 1,
    });
    const extraHours = Math.max(0, (options.numHours || 3) - 3);
    if (extraHours > 0) {
      items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Extra Hours', description: `${extraHours} additional hour(s) at $${p.photobooth_extra_hour}/hr` },
          unit_amount: p.photobooth_extra_hour * 100,
        },
        quantity: extraHours,
      });
    }
    if (options.customBackdrop) {
      items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Custom Backdrop', description: 'Custom backdrop design' },
          unit_amount: p.photobooth_backdrop * 100,
        },
        quantity: 1,
      });
    }
  } else if (serviceType === 'both') {
    items.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Photo Booth + 360 Booth Bundle - 3 Hours', description: 'Step of Hope combined booth experience (3 hours included)' },
        unit_amount: p.both_base * 100,
      },
      quantity: 1,
    });
    const extraHours = Math.max(0, (options.numHours || 3) - 3);
    if (extraHours > 0) {
      items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Extra Hours (Both Booths)', description: `${extraHours} additional hour(s) at $${p.both_extra_hour}/hr` },
          unit_amount: p.both_extra_hour * 100,
        },
        quantity: extraHours,
      });
    }
    if (options.customBackdrop) {
      items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Custom Backdrop', description: 'Custom backdrop design' },
          unit_amount: p.both_backdrop * 100,
        },
        quantity: 1,
      });
    }
  } else if (serviceType === '360booth') {
    const base360 = options.withTent ? p['360booth_tent'] : p['360booth_base'];
    items.push({
      price_data: {
        currency: 'usd',
        product_data: { name: options.withTent ? '360 Video Booth - With White Tent' : '360 Video Booth - Without Tent', description: 'Step of Hope 360 Video Booth experience (3 hours included)' },
        unit_amount: base360 * 100,
      },
      quantity: 1,
    });
    const extraHours = Math.max(0, (options.numHours || 3) - 3);
    if (extraHours > 0) {
      items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Extra Hours', description: `${extraHours} additional hour(s) at $${p['360booth_extra_hour']}/hr` },
          unit_amount: p['360booth_extra_hour'] * 100,
        },
        quantity: extraHours,
      });
    }
  }

  return items;
}

// Send confirmation email to customer
async function sendConfirmationEmail(reservation) {
  try {
    const transporter = getTransporter();
    const totalFormatted = `$${(reservation.total_amount / 100).toFixed(2)}`;

    await transporter.sendMail({
      from: `"Step of Hope" <${process.env.EMAIL_USER}>`,
      to: reservation.email,
      subject: 'Step of Hope Reservation Confirmation',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1B2A4A;">
          <div style="background: linear-gradient(135deg, #1B2A4A, #2C3E6B); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">Step of Hope</h1>
            <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">Reservation Confirmation</p>
          </div>
          <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${reservation.full_name}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6; color: #374151;">
              Thank you for reserving with Step of Hope.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #374151;">
              We received your reservation request and payment. Our team will review your event details
              and contact you to confirm final setup details, backdrop selection, timing, and any special requests.
            </p>

            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h3 style="margin: 0 0 16px; font-size: 16px; color: #1B2A4A;">Reservation Details</h3>
              <table style="width: 100%; font-size: 14px; color: #374151;">
                <tr><td style="padding: 6px 0; color: #6b7280;">Service:</td><td style="padding: 6px 0; font-weight: 600;">${reservation.service_type === 'photobooth' ? 'Photobooth' : '360 Video Booth'}</td></tr>
                <tr><td style="padding: 6px 0; color: #6b7280;">Event Date:</td><td style="padding: 6px 0; font-weight: 600;">${new Date(reservation.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                <tr><td style="padding: 6px 0; color: #6b7280;">Start Time:</td><td style="padding: 6px 0; font-weight: 600;">${reservation.start_time}</td></tr>
                <tr><td style="padding: 6px 0; color: #6b7280;">Duration:</td><td style="padding: 6px 0; font-weight: 600;">${reservation.num_hours} hour(s)</td></tr>
                <tr><td style="padding: 6px 0; color: #6b7280;">Event Type:</td><td style="padding: 6px 0; font-weight: 600;">${reservation.event_type}</td></tr>
                <tr><td style="padding: 6px 0; color: #6b7280;">Location:</td><td style="padding: 6px 0; font-weight: 600;">${reservation.event_address}</td></tr>
                <tr><td style="padding: 6px 0; color: #6b7280;">Guests:</td><td style="padding: 6px 0; font-weight: 600;">${reservation.estimated_guests}</td></tr>
                <tr><td style="padding: 6px 0; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 12px;">Total Paid:</td><td style="padding: 6px 0; font-weight: 700; font-size: 16px; color: #059669; border-top: 1px solid #e5e7eb; padding-top: 12px;">${totalFormatted}</td></tr>
              </table>
            </div>

            <p style="font-size: 15px; line-height: 1.6; color: #374151;">
              Your reservation helps support Step of Hope's mission to bring smiles to children and families in need.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #1B2A4A; font-weight: 600; font-style: italic; margin-top: 20px;">
              Never lose hope. Keep on fighting.
            </p>
          </div>
          <div style="background: #f3f4f6; padding: 20px 30px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">Step of Hope Foundation</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send confirmation email:', err.message);
  }
}

// Send notification email to admin
async function sendAdminNotification(reservation) {
  try {
    const transporter = getTransporter();
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const totalFormatted = `$${(reservation.total_amount / 100).toFixed(2)}`;

    await transporter.sendMail({
      from: `"Step of Hope System" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `New Reservation - ${reservation.service_type === 'photobooth' ? 'Photobooth' : '360 Video Booth'} - ${reservation.full_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1B2A4A;">New Reservation Received</h2>
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
          <p><strong>Indoor/Outdoor:</strong> ${reservation.indoor_outdoor}</p>
          <p><strong>Estimated Guests:</strong> ${reservation.estimated_guests}</p>
          ${reservation.service_type === 'photobooth' && reservation.custom_backdrop ? '<p><strong>Custom Backdrop:</strong> Yes (+$200)</p>' : ''}
          ${reservation.service_type === '360booth' ? `<p><strong>With Tent:</strong> ${reservation.with_tent ? 'Yes (+$750)' : 'No ($600)'}</p>` : ''}
          <p><strong>Backdrop Choice:</strong> ${reservation.backdrop_choice || 'N/A'}</p>
          <p><strong>Design Notes:</strong> ${reservation.design_notes || 'N/A'}</p>
          <hr/>
          <h3>Special Notes</h3>
          <p><strong>Parking:</strong> ${reservation.parking_instructions || 'N/A'}</p>
          <p><strong>Setup Access Time:</strong> ${reservation.setup_access_time || 'N/A'}</p>
          <p><strong>Power Availability:</strong> ${reservation.power_availability || 'N/A'}</p>
          <p><strong>Special Requests:</strong> ${reservation.special_requests || 'N/A'}</p>
          <hr/>
          <p><strong>Total Paid:</strong> ${totalFormatted}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send admin notification:', err.message);
  }
}

// Check date availability
router.get('/check-availability/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { serviceType } = req.query;

    let query = supabase
      .from('reservations')
      .select('id, start_time, num_hours, service_type')
      .eq('event_date', date)
      .in('status', ['paid', 'confirmed']);

    if (serviceType) {
      query = query.eq('service_type', serviceType);
    }

    const { data: reservations, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to check availability.' });
    }

    res.json({ reservations: reservations || [], available: true });
  } catch (err) {
    console.error('Availability check error:', err.message);
    res.status(500).json({ error: 'Failed to check availability.' });
  }
});

// Get booked dates for calendar display
// If booking photobooth: block dates with photobooth or "both" reservations
// If booking 360booth: block dates with 360booth or "both" reservations
// If booking both: block dates with any reservation (photobooth, 360booth, or both)
router.get('/booked-dates', async (req, res) => {
  try {
    const { serviceType, month, year } = req.query;

    let query = supabase
      .from('reservations')
      .select('event_date, service_type')
      .in('status', ['paid', 'confirmed']);

    if (serviceType === 'photobooth') {
      query = query.in('service_type', ['photobooth', 'both']);
    } else if (serviceType === '360booth') {
      query = query.in('service_type', ['360booth', 'both']);
    }
    // For "both" or no filter, get all service types (no filter needed)

    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(Number(year), Number(month), 0);
      const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      query = query.gte('event_date', startDate).lte('event_date', endDateStr);
    }

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch booked dates.' });
    }

    res.json({ bookedDates: (data || []).map((d) => d.event_date) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch booked dates.' });
  }
});

// Validate promo code
router.post('/validate-promo', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'No promo code provided.' });

    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (error || !promo) return res.status(404).json({ error: 'Invalid promo code.' });
    if (promo.used) return res.status(400).json({ error: 'This promo code has already been used.' });
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This promo code has expired.' });
    }

    res.json({ valid: true, discount: promo.discount, code: promo.code });
  } catch (err) {
    console.error('Promo validation error:', err.message);
    res.status(500).json({ error: 'Failed to validate promo code.' });
  }
});

// Create reservation + Stripe checkout
router.post('/create-session', async (req, res) => {
  try {
    const {
      serviceType,
      fullName,
      email,
      phone,
      organization,
      eventDate,
      startTime,
      numHours,
      eventType,
      eventAddress,
      indoorOutdoor,
      estimatedGuests,
      withTent,
      customBackdrop,
      backdropChoice,
      customDesignUrl,
      designNotes,
      parkingInstructions,
      setupAccessTime,
      powerAvailability,
      specialRequests,
      promoCode,
    } = req.body;

    // Validate required fields
    if (!serviceType || !fullName || !email || !phone || !eventDate || !startTime || !numHours || !eventType || !eventAddress || !indoorOutdoor || !estimatedGuests) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    const p = await getPricing();
    let total = calculateTotalWithPricing(serviceType, { numHours, withTent, customBackdrop }, p);
    let discount = 0;
    let appliedPromo = null;

    // Validate and apply promo code
    if (promoCode) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase().trim())
        .single();

      if (promo && !promo.used && (!promo.expires_at || new Date(promo.expires_at) >= new Date())) {
        discount = Math.round(total * (promo.discount / 100));
        total = total - discount;
        appliedPromo = promo;
      }
    }

    const lineItems = buildLineItems(serviceType, { numHours, withTent, customBackdrop }, p);

    const stripe = getStripe();

    // Create a Stripe coupon if promo code is applied
    let stripeCoupon = null;
    if (appliedPromo) {
      stripeCoupon = await stripe.coupons.create({
        percent_off: appliedPromo.discount,
        duration: 'once',
        name: `Promo ${appliedPromo.code} (${appliedPromo.discount}% off)`,
      });
    }

    const sessionParams = {
      payment_method_types: ['card'],
      customer_email: email,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/reserve/${serviceType}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/reserve/${serviceType}?canceled=true`,
      metadata: {
        type: 'reservation',
        service_type: serviceType,
        full_name: fullName,
        event_date: eventDate,
        promo_code: appliedPromo?.code || '',
      },
    };

    if (stripeCoupon) {
      sessionParams.discounts = [{ coupon: stripeCoupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Mark promo code as used
    if (appliedPromo) {
      await supabase
        .from('promo_codes')
        .update({ used: true, used_at: new Date().toISOString(), used_by: email })
        .eq('id', appliedPromo.id);
    }

    // Record pending reservation
    await supabase.from('reservations').insert({
      stripe_session_id: session.id,
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
      custom_design_url: customDesignUrl || null,
      design_notes: designNotes || null,
      parking_instructions: parkingInstructions || null,
      setup_access_time: setupAccessTime || null,
      power_availability: powerAvailability || null,
      special_requests: specialRequests || null,
      total_amount: total * 100,
      promo_code: appliedPromo?.code || null,
      discount_amount: discount ? discount * 100 : 0,
      status: 'pending',
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Reservation session error:', err.message);
    res.status(500).json({ error: 'Failed to create reservation session.' });
  }
});

// Stripe webhook for reservations
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const stripe = getStripe();
    if (process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET !== 'whsec_REPLACE_WITH_YOUR_WEBHOOK_SECRET') {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Reservation webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      // Only handle reservation payments
      if (session.metadata?.type !== 'reservation') break;

      await supabase
        .from('reservations')
        .update({
          status: 'paid',
          stripe_payment_intent: session.payment_intent,
        })
        .eq('stripe_session_id', session.id);

      // Fetch full reservation to send emails
      const { data: reservation } = await supabase
        .from('reservations')
        .select('*')
        .eq('stripe_session_id', session.id)
        .single();

      if (reservation) {
        await sendConfirmationEmail(reservation);
        await sendAdminNotification(reservation);
      }
      break;
    }
    case 'checkout.session.expired': {
      const session = event.data.object;
      if (session.metadata?.type !== 'reservation') break;

      await supabase
        .from('reservations')
        .update({ status: 'expired' })
        .eq('stripe_session_id', session.id);
      break;
    }
  }

  res.json({ received: true });
});

// Verify reservation (after redirect)
router.get('/verify/:sessionId', async (req, res) => {
  try {
    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('stripe_session_id', req.params.sessionId)
      .single();

    if (error || !reservation) return res.status(404).json({ error: 'Reservation not found.' });
    res.json({ status: reservation.status, reservation });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify reservation.' });
  }
});

// ===== ADMIN ROUTES =====

// Get all reservations
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, serviceType, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('reservations')
      .select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (serviceType) query = query.eq('service_type', serviceType);
    if (startDate) query = query.gte('event_date', startDate);
    if (endDate) query = query.lte('event_date', endDate);

    query = query
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data: reservations, count: total, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch reservations.' });
    }

    res.json({
      reservations: reservations || [],
      total: total || 0,
      page: Number(page),
      totalPages: Math.ceil((total || 0) / limit),
    });
  } catch (err) {
    console.error('Admin reservations error:', err.message);
    res.status(500).json({ error: 'Failed to fetch reservations.' });
  }
});

// Get reservation stats
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    const { data: allRes } = await supabase
      .from('reservations')
      .select('id, status, total_amount, service_type, created_at, event_date')
      .in('status', ['paid', 'confirmed']);

    const total = (allRes || []).length;
    const totalRevenue = (allRes || []).reduce((sum, r) => sum + (r.total_amount || 0), 0);
    const photobooth = (allRes || []).filter((r) => r.service_type === 'photobooth').length;
    const videobooth = (allRes || []).filter((r) => r.service_type === '360booth').length;

    // Upcoming
    const today = new Date().toISOString().split('T')[0];
    const upcoming = (allRes || []).filter((r) => r.event_date >= today).length;

    res.json({ total, totalRevenue, photobooth, videobooth, upcoming });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reservation stats.' });
  }
});

// Update reservation status
router.put('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const { error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: 'Failed to update reservation.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update reservation.' });
  }
});

// Delete reservation
router.delete('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: 'Failed to delete reservation.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete reservation.' });
  }
});

// Export reservations as CSV
router.get('/admin/export', authenticateToken, async (req, res) => {
  try {
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to export reservations.' });

    const csv = [
      'ID,Full Name,Email,Phone,Organization,Service,Event Date,Start Time,Hours,Event Type,Location,Indoor/Outdoor,Guests,Total (cents),Status,Created',
      ...(reservations || []).map((r) =>
        `${r.id},"${r.full_name}","${r.email}","${r.phone}","${r.organization || ''}",${r.service_type},"${r.event_date}","${r.start_time}",${r.num_hours},"${r.event_type}","${r.event_address}",${r.indoor_outdoor},${r.estimated_guests},${r.total_amount},${r.status},"${r.created_at}"`
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=reservations-export.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export reservations.' });
  }
});

// ===== PROMO CODE ADMIN ROUTES =====

// Get all promo codes
router.get('/admin/promo-codes', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to fetch promo codes.' });
    res.json({ promoCodes: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch promo codes.' });
  }
});

// Create promo code
router.post('/admin/promo-codes', authenticateToken, async (req, res) => {
  try {
    const { code, discount, expiresAt } = req.body;
    if (!code || !discount) {
      return res.status(400).json({ error: 'Code and discount are required.' });
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .insert({
        code: code.toUpperCase().trim(),
        discount: parseFloat(discount),
        expires_at: expiresAt || null,
        used: false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'This code already exists.' });
      return res.status(500).json({ error: 'Failed to create promo code.' });
    }

    res.json({ promoCode: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create promo code.' });
  }
});

// Delete promo code
router.delete('/admin/promo-codes/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: 'Failed to delete promo code.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete promo code.' });
  }
});

export default router;
