import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  if (!admin) {
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
});

router.get('/me', authenticateToken, (req, res) => {
  const admin = db.prepare('SELECT id, email, name, created_at FROM admins WHERE id = ?').get(req.admin.id);
  if (!admin) return res.status(404).json({ error: 'Admin not found.' });
  res.json(admin);
});

router.put('/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);

  if (!bcrypt.compareSync(currentPassword, admin.password)) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  const hashed = bcrypt.hashSync(newPassword, 12);
  db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashed, req.admin.id);
  res.json({ message: 'Password updated successfully.' });
});

export default router;
