import { Router } from 'express';
import bcrypt from 'bcryptjs';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { logActivity } from './activity-logs.js';

const router = Router();

const ROLES = {
  super_admin: {
    label: 'Super Admin',
    permissions: ['all'],
  },
  admin: {
    label: 'Admin',
    permissions: ['donations', 'expenses', 'volunteers', 'reservations', 'contacts', 'content', 'images', 'reports', 'bills'],
  },
  staff: {
    label: 'Staff',
    permissions: ['donations.view', 'expenses.view', 'volunteers', 'reservations', 'contacts', 'reports.view'],
  },
  viewer: {
    label: 'Viewer',
    permissions: ['donations.view', 'expenses.view', 'volunteers.view', 'reservations.view', 'contacts.view', 'reports.view'],
  },
};

// Middleware to check if super admin
function requireSuperAdmin(req, res, next) {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required.' });
  }
  next();
}

// Get all admin users
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id, email, name, role, is_active, last_login, avatar_url, created_at')
      .order('created_at');

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin users.' });
  }
});

// Get available roles
router.get('/roles', authenticateToken, async (req, res) => {
  res.json(ROLES);
});

// Create a new admin user
router.post('/admin', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { email, name, password, role } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('admins')
      .insert({
        email,
        name,
        password: hashedPassword,
        role: role || 'staff',
        is_active: true,
      })
      .select('id, email, name, role, is_active, created_at')
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Email already exists.' });
      throw error;
    }

    await logActivity({
      admin_id: req.admin.id,
      admin_name: req.admin.name,
      action: 'Created admin user',
      entity_type: 'admin',
      entity_id: data.id,
      details: { email, role: role || 'staff' },
    });

    res.json(data);
  } catch (err) {
    console.error('Create admin error:', err.message);
    res.status(500).json({ error: 'Failed to create admin user.' });
  }
});

// Update an admin user
router.put('/admin/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, role, is_active, password } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;
    if (password) updates.password = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('admins')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, email, name, role, is_active, created_at')
      .single();

    if (error) throw error;

    await logActivity({
      admin_id: req.admin.id,
      admin_name: req.admin.name,
      action: 'Updated admin user',
      entity_type: 'admin',
      entity_id: req.params.id,
      details: { updates: Object.keys(updates) },
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update admin user.' });
  }
});

// Delete an admin user
router.delete('/admin/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.admin.id.toString() === req.params.id) {
      return res.status(400).json({ error: 'Cannot delete your own account.' });
    }

    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    await logActivity({
      admin_id: req.admin.id,
      admin_name: req.admin.name,
      action: 'Deleted admin user',
      entity_type: 'admin',
      entity_id: req.params.id,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete admin user.' });
  }
});

export default router;
