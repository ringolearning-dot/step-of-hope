import { Router } from 'express';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get all calendar blocks
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, service_type } = req.query;

    let query = supabase
      .from('calendar_blocks')
      .select('*')
      .order('date', { ascending: true });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (service_type) query = query.or(`service_type.eq.${service_type},service_type.is.null`);

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calendar blocks.' });
  }
});

// Get blocked dates (public - for reservation calendar)
router.get('/blocked-dates', async (req, res) => {
  try {
    const { service_type } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('calendar_blocks')
      .select('date, start_time, end_time, service_type, reason, title')
      .gte('date', today);

    if (service_type) {
      query = query.or(`service_type.eq.${service_type},service_type.is.null`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch blocked dates.' });
  }
});

// Create a calendar block
router.post('/admin', authenticateToken, async (req, res) => {
  try {
    const { date, start_time, end_time, service_type, reason, title, notes } = req.body;

    if (!date || !reason) {
      return res.status(400).json({ error: 'Date and reason are required.' });
    }

    const { data, error } = await supabase
      .from('calendar_blocks')
      .insert({
        date,
        start_time: start_time || null,
        end_time: end_time || null,
        service_type: service_type || null,
        reason,
        title: title || null,
        notes: notes || null,
        blocked_by: req.admin.id,
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create calendar block.' });
  }
});

// Delete a calendar block
router.delete('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('calendar_blocks')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete calendar block.' });
  }
});

// ===== WAITLIST =====

// Add to waitlist (public)
router.post('/waitlist', async (req, res) => {
  try {
    const { service_type, preferred_date, full_name, email, phone, event_type, notes } = req.body;

    if (!service_type || !preferred_date || !full_name || !email) {
      return res.status(400).json({ error: 'Service type, date, name, and email are required.' });
    }

    const { data, error } = await supabase
      .from('reservation_waitlist')
      .insert({ service_type, preferred_date, full_name, email, phone, event_type, notes })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to join waitlist.' });
  }
});

// Get waitlist (admin)
router.get('/admin/waitlist', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reservation_waitlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch waitlist.' });
  }
});

// Update waitlist entry status
router.put('/admin/waitlist/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase
      .from('reservation_waitlist')
      .update({ status, notified_at: status === 'notified' ? new Date().toISOString() : undefined })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update waitlist entry.' });
  }
});

export default router;
