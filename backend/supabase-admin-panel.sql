-- ============================================================
-- STEP OF HOPE - ADVANCED ADMIN PANEL SCHEMA
-- Run this in Supabase SQL Editor after the base schema
-- ============================================================

-- ============================================================
-- 1. USER ROLES & PERMISSIONS
-- ============================================================

-- Add role column to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
ALTER TABLE admins ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]';
ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================================
-- 2. ACTIVITY LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id BIGINT REFERENCES admins(id),
  admin_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_id ON activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);

-- ============================================================
-- 3. EXPENSE MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS expense_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT 'receipt',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO expense_categories (name, color, icon) VALUES
  ('Medical Help', '#EF4444', 'heart'),
  ('Events', '#8B5CF6', 'calendar'),
  ('Equipment', '#3B82F6', 'wrench'),
  ('Marketing', '#F59E0B', 'megaphone'),
  ('Transportation', '#10B981', 'truck'),
  ('Food', '#F97316', 'utensils'),
  ('Supplies', '#6366F1', 'package'),
  ('Storage Rental', '#EC4899', 'warehouse'),
  ('Insurance', '#14B8A6', 'shield'),
  ('Utilities', '#84CC16', 'zap'),
  ('Software Subscriptions', '#06B6D4', 'monitor'),
  ('Miscellaneous', '#6B7280', 'more-horizontal')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  category_id BIGINT REFERENCES expense_categories(id),
  category_name TEXT,
  vendor TEXT,
  receipt_url TEXT,
  receipt_filename TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  added_by BIGINT REFERENCES admins(id),
  added_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);

-- ============================================================
-- 4. RECURRING BILLS / PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS recurring_bills (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  category_id BIGINT REFERENCES expense_categories(id),
  category_name TEXT,
  vendor TEXT,
  frequency TEXT NOT NULL DEFAULT 'monthly', -- weekly, monthly, quarterly, yearly
  due_day INTEGER, -- day of month (1-31) or day of week (1-7)
  next_due_date DATE NOT NULL,
  last_paid_date DATE,
  status TEXT DEFAULT 'active', -- active, paused, cancelled
  auto_record BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bill_payments (
  id BIGSERIAL PRIMARY KEY,
  bill_id BIGINT REFERENCES recurring_bills(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  paid_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'paid', -- paid, pending, overdue, skipped
  receipt_url TEXT,
  notes TEXT,
  recorded_by BIGINT REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_bills_next_due ON recurring_bills(next_due_date);
CREATE INDEX IF NOT EXISTS idx_recurring_bills_status ON recurring_bills(status);
CREATE INDEX IF NOT EXISTS idx_bill_payments_bill_id ON bill_payments(bill_id);

-- ============================================================
-- 5. CALENDAR BLOCKS (Reservation System Enhancement)
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_blocks (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  service_type TEXT, -- photobooth, 360booth, or NULL for all
  reason TEXT NOT NULL, -- maintenance, holiday, private_event, personal, fully_booked
  title TEXT,
  notes TEXT,
  blocked_by BIGINT REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_blocks_date ON calendar_blocks(date);
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_service ON calendar_blocks(service_type);

-- Waiting list for reservations
CREATE TABLE IF NOT EXISTS reservation_waitlist (
  id BIGSERIAL PRIMARY KEY,
  service_type TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  event_type TEXT,
  notes TEXT,
  status TEXT DEFAULT 'waiting', -- waiting, notified, booked, expired
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_date ON reservation_waitlist(preferred_date);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON reservation_waitlist(status);

-- ============================================================
-- 6. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL, -- bill_due, donation_received, reservation_new, volunteer_new, overdue, system
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  admin_id BIGINT REFERENCES admins(id), -- NULL means for all admins
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_admin ON notifications(admin_id);

-- ============================================================
-- 7. REPORTS (Saved/Generated Reports)
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_reports (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- financial, donations, expenses, volunteers, reservations
  date_from DATE,
  date_to DATE,
  data JSONB,
  generated_by BIGINT REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. AI ASSISTANT CHAT HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
  id BIGSERIAL PRIMARY KEY,
  admin_id BIGINT REFERENCES admins(id),
  messages JSONB DEFAULT '[]',
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_admin ON ai_conversations(admin_id, updated_at DESC);

-- ============================================================
-- 9. ENHANCED DONATIONS (add phone tracking)
-- ============================================================

ALTER TABLE donations ADD COLUMN IF NOT EXISTS donor_phone TEXT;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS is_offline BOOLEAN DEFAULT FALSE;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS added_by BIGINT;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS thank_you_sent BOOLEAN DEFAULT FALSE;

-- ============================================================
-- 10. ENABLE RLS ON NEW TABLES
-- ============================================================

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Service role has full access
CREATE POLICY "Service role full access on activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on expense_categories" ON expense_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on recurring_bills" ON recurring_bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on bill_payments" ON bill_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on calendar_blocks" ON calendar_blocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on reservation_waitlist" ON reservation_waitlist FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on saved_reports" ON saved_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on ai_conversations" ON ai_conversations FOR ALL USING (true) WITH CHECK (true);

-- Public insert on waitlist
CREATE POLICY "Public insert on waitlist" ON reservation_waitlist FOR INSERT WITH CHECK (true);
