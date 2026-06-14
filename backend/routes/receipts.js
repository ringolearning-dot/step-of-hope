import { Router } from 'express';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { receiptNumber } from '../lib/email.js';

const router = Router();

// Get all receipts (combined donations + reservations)
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, type } = req.query;

    const receipts = [];

    // Fetch completed donations
    if (!type || type === 'donation') {
      const { data: donations } = await supabase
        .from('donations')
        .select('id, donor_name, donor_email, amount, is_monthly, created_at, thank_you_sent')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      (donations || []).forEach((d) => {
        receipts.push({
          id: `D-${d.id}`,
          receipt_number: receiptNumber('D', d.id, d.created_at),
          type: 'donation',
          name: d.donor_name || 'Anonymous',
          email: d.donor_email || '',
          amount: d.amount,
          description: d.is_monthly ? 'Monthly Donation' : 'One-Time Donation',
          created_at: d.created_at,
          receipt_sent: !!d.thank_you_sent,
          source_id: d.id,
        });
      });
    }

    // Fetch paid/confirmed reservations
    if (!type || type === 'reservation') {
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id, full_name, email, total_amount, service_type, event_date, created_at')
        .in('status', ['paid', 'confirmed', 'completed'])
        .order('created_at', { ascending: false });

      (reservations || []).forEach((r) => {
        const serviceName = r.service_type === 'photobooth'
          ? 'Photobooth'
          : r.service_type === '360booth'
            ? '360 Video Booth'
            : 'Photo + 360 Bundle';
        receipts.push({
          id: `R-${r.id}`,
          receipt_number: receiptNumber('R', r.id, r.created_at),
          type: 'reservation',
          name: r.full_name,
          email: r.email,
          amount: r.total_amount,
          description: serviceName,
          created_at: r.created_at,
          receipt_sent: true,
          source_id: r.id,
        });
      });
    }

    // Sort combined list by date descending
    receipts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Paginate
    const total = receipts.length;
    const offset = (page - 1) * limit;
    const paginated = receipts.slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      receipts: paginated,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Receipts fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch receipts.' });
  }
});

export default router;
