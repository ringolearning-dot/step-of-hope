import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !admin) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const validPassword = bcrypt.compareSync(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed.' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, email, name, created_at')
      .eq('id', req.admin.id)
      .single();

    if (error || !admin) return res.status(404).json({ error: 'Admin not found.' });
    res.json(admin);
  } catch (err) {
    console.error('Get admin error:', err.message);
    res.status(500).json({ error: 'Failed to get admin info.' });
  }
});

router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', req.admin.id)
      .single();

    if (error || !admin) {
      return res.status(404).json({ error: 'Admin not found.' });
    }

    if (!bcrypt.compareSync(currentPassword, admin.password)) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const hashed = bcrypt.hashSync(newPassword, 12);
    await supabase
      .from('admins')
      .update({ password: hashed })
      .eq('id', req.admin.id);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

export default router;
