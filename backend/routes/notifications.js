import { Router } from 'express';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Create a notification (used internally)
export async function createNotification({ type, title, message, entity_type, entity_id, admin_id }) {
  try {
    await supabase.from('notifications').insert({
      type,
      title,
      message,
      entity_type,
      entity_id: entity_id?.toString(),
      admin_id: admin_id || null,
    });
  } catch (err) {
    console.error('Notification create error:', err.message);
  }
}

// Get notifications for current admin
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const { unread_only } = req.query;

    let query = supabase
      .from('notifications')
      .select('*')
      .or(`admin_id.eq.${req.admin.id},admin_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// Get unread count
router.get('/admin/unread-count', authenticateToken, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .or(`admin_id.eq.${req.admin.id},admin_id.is.null`)
      .eq('is_read', false);

    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notification count.' });
  }
});

// Mark notification as read
router.put('/admin/:id/read', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

// Mark all as read
router.put('/admin/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .or(`admin_id.eq.${req.admin.id},admin_id.is.null`)
      .eq('is_read', false);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read.' });
  }
});

// Delete a notification
router.delete('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notification.' });
  }
});

export default router;
