import { Router } from 'express';
import db from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Submit volunteer form
router.post('/', (req, res) => {
  const { firstName, lastName, email, phone, interests, message } = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'First name, last name, and email are required.' });
  }

  db.prepare(
    'INSERT INTO volunteers (first_name, last_name, email, phone, interests, message) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(firstName, lastName, email, phone || null, JSON.stringify(interests || []), message || null);

  res.json({ message: 'Thank you for volunteering! We will be in touch soon.' });
});

// Get all volunteers (admin)
router.get('/admin/all', authenticateToken, (req, res) => {
  const { page = 1, limit = 50, status } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM volunteers WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM volunteers WHERE 1=1';
  const params = [];
  const countParams = [];

  if (status) {
    query += ' AND status = ?';
    countQuery += ' AND status = ?';
    params.push(status);
    countParams.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const volunteers = db.prepare(query).all(...params);
  const { total } = db.prepare(countQuery).get(...countParams);

  res.json({ volunteers, total, page: Number(page), totalPages: Math.ceil(total / limit) });
});

// Update volunteer status (admin)
router.put('/admin/:id', authenticateToken, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE volunteers SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Volunteer status updated.' });
});

// Delete volunteer (admin)
router.delete('/admin/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM volunteers WHERE id = ?').run(req.params.id);
  res.json({ message: 'Volunteer record deleted.' });
});

// Stats (admin)
router.get('/admin/stats', authenticateToken, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM volunteers').get();
  const newCount = db.prepare("SELECT COUNT(*) as count FROM volunteers WHERE status = 'new'").get();
  const contacted = db.prepare("SELECT COUNT(*) as count FROM volunteers WHERE status = 'contacted'").get();
  const active = db.prepare("SELECT COUNT(*) as count FROM volunteers WHERE status = 'active'").get();

  res.json({
    total: total.count,
    new: newCount.count,
    contacted: contacted.count,
    active: active.count
  });
});

export default router;
