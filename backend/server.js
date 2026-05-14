import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { initDB } from './db/init.js';
import authRoutes from './routes/auth.js';
import imageRoutes from './routes/images.js';
import donationRoutes from './routes/donations.js';
import volunteerRoutes from './routes/volunteers.js';
import contactRoutes from './routes/contact.js';
import contentRoutes from './routes/content.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Stripe webhook needs raw body
app.use('/api/donations/webhook', express.raw({ type: 'application/json' }));

// JSON parser for everything else
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/content', contentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize DB and start server
(async () => {
  try {
    await initDB();
  } catch (err) {
    console.error('DB initialization warning:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`Step of Hope API running on port ${PORT}`);
  });
})();
