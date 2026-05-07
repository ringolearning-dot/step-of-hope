import { Router } from 'express';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, inquiryType, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const { error } = await supabase.from('contacts').insert({
      name,
      email,
      subject: subject || null,
      inquiry_type: inquiryType || 'general',
      message,
    });

    if (error) {
      console.error('Contact insert error:', error.message);
      return res.status(500).json({ error: 'Failed to submit contact form.' });
    }

    res.json({ message: 'Thank you for reaching out! We will get back to you soon.' });
  } catch (err) {
    console.error('Contact submit error:', err.message);
    res.status(500).json({ error: 'Failed to submit contact form.' });
  }
});

// Get all contacts (admin)
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, inquiryType } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (inquiryType) {
      query = query.eq('inquiry_type', inquiryType);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data: contacts, count: total, error } = await query;

    if (error) {
      console.error('Fetch contacts error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch contacts.' });
    }

    res.json({
      contacts: contacts || [],
      total: total || 0,
      page: Number(page),
      totalPages: Math.ceil((total || 0) / limit),
    });
  } catch (err) {
    console.error('Admin contacts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch contacts.' });
  }
});

// Update contact status (admin)
router.put('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const { error } = await supabase
      .from('contacts')
      .update({ status })
      .eq('id', req.params.id);

    if (error) {
      console.error('Update contact error:', error.message);
      return res.status(500).json({ error: 'Failed to update contact.' });
    }

    res.json({ message: 'Contact status updated.' });
  } catch (err) {
    console.error('Update contact error:', err.message);
    res.status(500).json({ error: 'Failed to update contact.' });
  }
});

// Delete contact (admin)
router.delete('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Delete contact error:', error.message);
      return res.status(500).json({ error: 'Failed to delete contact.' });
    }

    res.json({ message: 'Contact deleted.' });
  } catch (err) {
    console.error('Delete contact error:', err.message);
    res.status(500).json({ error: 'Failed to delete contact.' });
  }
});

// Stats (admin)
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    const { count: total } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    const { count: unread } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'unread');

    const { data: contacts } = await supabase
      .from('contacts')
      .select('inquiry_type');

    // Group by inquiry_type in JS
    const typeMap = {};
    (contacts || []).forEach((c) => {
      const t = c.inquiry_type || 'general';
      typeMap[t] = (typeMap[t] || 0) + 1;
    });
    const byType = Object.entries(typeMap).map(([inquiry_type, count]) => ({
      inquiry_type,
      count,
    }));

    res.json({
      total: total || 0,
      unread: unread || 0,
      byType,
    });
  } catch (err) {
    console.error('Contact stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch contact stats.' });
  }
});

export default router;
