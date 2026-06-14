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
import reservationRoutes from './routes/reservations.js';
import volunteerAppRoutes from './routes/volunteer-applications.js';
import expenseRoutes from './routes/expenses.js';
import recurringBillRoutes from './routes/recurring-bills.js';
import calendarBlockRoutes from './routes/calendar-blocks.js';
import activityLogRoutes from './routes/activity-logs.js';
import notificationRoutes from './routes/notifications.js';
import aiAssistantRoutes from './routes/ai-assistant.js';
import reportRoutes from './routes/reports.js';
import dailyEmailRoutes from './routes/daily-emails.js';
import adminUserRoutes from './routes/admin-users.js';
import documentRoutes from './routes/documents.js';
import receiptRoutes from './routes/receipts.js';
import { runDailyReport } from './routes/daily-emails.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Stripe webhooks need raw body
app.use('/api/donations/webhook', express.raw({ type: 'application/json' }));
app.use('/api/reservations/webhook', express.raw({ type: 'application/json' }));

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
app.use('/api/reservations', reservationRoutes);
app.use('/api/volunteer-applications', volunteerAppRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/recurring-bills', recurringBillRoutes);
app.use('/api/calendar', calendarBlockRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai-assistant', aiAssistantRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/daily-emails', dailyEmailRoutes);
app.use('/api/admin-users', adminUserRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/receipts', receiptRoutes);

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

  // Schedule daily report at midnight
  scheduleDailyReport();
})();

function scheduleDailyReport() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  const msUntilMidnight = midnight - now;

  setTimeout(() => {
    runDailyReport();
    // Then repeat every 24 hours
    setInterval(runDailyReport, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  console.log(`Daily report scheduled. Next run in ${Math.round(msUntilMidnight / 1000 / 60)} minutes.`);
}
