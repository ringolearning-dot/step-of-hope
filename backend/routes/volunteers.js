import { Router } from 'express';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Submit volunteer form
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, interests, message } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required.' });
    }

    const { error } = await supabase.from('volunteers').insert({
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      interests: JSON.stringify(interests || []),
      message: message || null,
    });

    if (error) {
      console.error('Volunteer insert error:', error.message);
      return res.status(500).json({ error: 'Failed to submit volunteer form.' });
    }

    res.json({ message: 'Thank you for volunteering! We will be in touch soon.' });
  } catch (err) {
    console.error('Volunteer submit error:', err.message);
    res.status(500).json({ error: 'Failed to submit volunteer form.' });
  }
});

// Get all volunteers (admin)
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('volunteers')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data: volunteers, count: total, error } = await query;

    if (error) {
      console.error('Fetch volunteers error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch volunteers.' });
    }

    res.json({
      volunteers: volunteers || [],
      total: total || 0,
      page: Number(page),
      totalPages: Math.ceil((total || 0) / limit),
    });
  } catch (err) {
    console.error('Admin volunteers error:', err.message);
    res.status(500).json({ error: 'Failed to fetch volunteers.' });
  }
});

// Update volunteer status (admin)
router.put('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const { error } = await supabase
      .from('volunteers')
      .update({ status })
      .eq('id', req.params.id);

    if (error) {
      console.error('Update volunteer error:', error.message);
      return res.status(500).json({ error: 'Failed to update volunteer.' });
    }

    res.json({ message: 'Volunteer status updated.' });
  } catch (err) {
    console.error('Update volunteer error:', err.message);
    res.status(500).json({ error: 'Failed to update volunteer.' });
  }
});

// Delete volunteer (admin)
router.delete('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('volunteers')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Delete volunteer error:', error.message);
      return res.status(500).json({ error: 'Failed to delete volunteer.' });
    }

    res.json({ message: 'Volunteer record deleted.' });
  } catch (err) {
    console.error('Delete volunteer error:', err.message);
    res.status(500).json({ error: 'Failed to delete volunteer.' });
  }
});

// Stats (admin)
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    const { count: total } = await supabase
      .from('volunteers')
      .select('*', { count: 'exact', head: true });

    const { count: newCount } = await supabase
      .from('volunteers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new');

    const { count: contacted } = await supabase
      .from('volunteers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'contacted');

    const { count: active } = await supabase
      .from('volunteers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    res.json({
      total: total || 0,
      new: newCount || 0,
      contacted: contacted || 0,
      active: active || 0,
    });
  } catch (err) {
    console.error('Volunteer stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch volunteer stats.' });
  }
});

export default router;
