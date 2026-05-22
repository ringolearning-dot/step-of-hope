import { Router } from 'express';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Log an activity (used internally by other routes)
export async function logActivity({ admin_id, admin_name, action, entity_type, entity_id, details, ip_address }) {
  try {
    await supabase.from('activity_logs').insert({
      admin_id,
      admin_name,
      action,
      entity_type,
      entity_id: entity_id?.toString(),
      details: details || null,
      ip_address,
    });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
}

// Get activity logs (paginated)
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, entity_type, admin_id, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('activity_logs')
      .select('*', { count: 'exact' });

    if (entity_type) query = query.eq('entity_type', entity_type);
    if (admin_id) query = query.eq('admin_id', admin_id);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    query = query
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({
      logs: data || [],
      total: count || 0,
      page: Number(page),
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity logs.' });
  }
});

// Get recent activity (for dashboard)
router.get('/admin/recent', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent activity.' });
  }
});

export default router;
