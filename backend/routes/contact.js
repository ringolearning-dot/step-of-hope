import { Router } from 'express';
import db from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Submit contact form
router.post('/', (req, res) => {
  const { name, email, subject, inquiryType, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  db.prepare(
    'INSERT INTO contacts (name, email, subject, inquiry_type, message) VALUES (?, ?, ?, ?, ?)'
  ).run(name, email, subject || null, inquiryType || 'general', message);

  res.json({ message: 'Thank you for reaching out! We will get back to you soon.' });
});

// Get all contacts (admin)
router.get('/admin/all', authenticateToken, (req, res) => {
  const { page = 1, limit = 50, status, inquiryType } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM contacts WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM contacts WHERE 1=1';
  const params = [];
  const countParams = [];

  if (status) {
    query += ' AND status = ?';
    countQuery += ' AND status = ?';
    params.push(status);
    countParams.push(status);
  }
  if (inquiryType) {
    query += ' AND inquiry_type = ?';
    countQuery += ' AND inquiry_type = ?';
    params.push(inquiryType);
    countParams.push(inquiryType);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const contacts = db.prepare(query).all(...params);
  const { total } = db.prepare(countQuery).get(...countParams);

  res.json({ contacts, total, page: Number(page), totalPages: Math.ceil(total / limit) });
});

// Update contact status (admin)
router.put('/admin/:id', authenticateToken, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE contacts SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Contact status updated.' });
});

// Delete contact (admin)
router.delete('/admin/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Contact deleted.' });
});

// Stats (admin)
router.get('/admin/stats', authenticateToken, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM contacts').get();
  const unread = db.prepare("SELECT COUNT(*) as count FROM contacts WHERE status = 'unread'").get();
  const byType = db.prepare(
    'SELECT inquiry_type, COUNT(*) as count FROM contacts GROUP BY inquiry_type'
  ).all();

  res.json({ total: total.count, unread: unread.count, byType });
});

export default router;
