import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { existsSync, unlinkSync } from 'fs';
import db from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
  destination: join(__dirname, '..', 'uploads', 'images'),
  filename: (req, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, WebP, GIF) and MP4 videos are allowed.'));
    }
  }
});

const router = Router();

// Get all images for a section
router.get('/:section', (req, res) => {
  const images = db.prepare('SELECT * FROM site_images WHERE section = ? ORDER BY slot').all(req.params.section);
  res.json(images);
});

// Get a specific image by section and slot
router.get('/:section/:slot', (req, res) => {
  const image = db.prepare('SELECT * FROM site_images WHERE section = ? AND slot = ?').get(
    req.params.section,
    req.params.slot
  );
  if (!image) return res.status(404).json({ error: 'Image not found.' });
  res.json(image);
});

// Upload/replace image for a section slot (admin only)
router.post('/:section/:slot', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const { section, slot } = req.params;

  // Delete old file if exists
  const existing = db.prepare('SELECT * FROM site_images WHERE section = ? AND slot = ?').get(section, slot);
  if (existing) {
    const oldPath = join(__dirname, '..', 'uploads', 'images', existing.filename);
    if (existsSync(oldPath)) unlinkSync(oldPath);
    db.prepare('DELETE FROM site_images WHERE section = ? AND slot = ?').run(section, slot);
  }

  db.prepare(
    'INSERT INTO site_images (section, slot, filename, original_name, mime_type) VALUES (?, ?, ?, ?, ?)'
  ).run(section, slot, req.file.filename, req.file.originalname, req.file.mimetype);

  const image = db.prepare('SELECT * FROM site_images WHERE section = ? AND slot = ?').get(section, slot);
  res.json(image);
});

// Delete image (admin only)
router.delete('/:section/:slot', authenticateToken, (req, res) => {
  const { section, slot } = req.params;
  const existing = db.prepare('SELECT * FROM site_images WHERE section = ? AND slot = ?').get(section, slot);

  if (!existing) return res.status(404).json({ error: 'Image not found.' });

  const filePath = join(__dirname, '..', 'uploads', 'images', existing.filename);
  if (existsSync(filePath)) unlinkSync(filePath);

  db.prepare('DELETE FROM site_images WHERE section = ? AND slot = ?').run(section, slot);
  res.json({ message: 'Image deleted.' });
});

// Get all images (admin)
router.get('/', authenticateToken, (req, res) => {
  const images = db.prepare('SELECT * FROM site_images ORDER BY section, slot').all();
  res.json(images);
});

export default router;
