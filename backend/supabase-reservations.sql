-- Reservations table for Photobooth and 360 Video Booth bookings
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  service_type TEXT NOT NULL CHECK (service_type IN ('photobooth', '360booth')),

  -- Customer info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  organization TEXT,

  -- Event details
  event_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  num_hours INTEGER NOT NULL DEFAULT 3,
  event_type TEXT NOT NULL,
  event_address TEXT NOT NULL,
  indoor_outdoor TEXT NOT NULL CHECK (indoor_outdoor IN ('Indoor', 'Outdoor')),
  estimated_guests INTEGER NOT NULL,

  -- Package options
  with_tent BOOLEAN,
  custom_backdrop BOOLEAN,
  backdrop_choice TEXT,
  custom_design_url TEXT,
  design_notes TEXT,

  -- Special notes
  parking_instructions TEXT,
  setup_access_time TEXT,
  power_availability TEXT,
  special_requests TEXT,

  -- Payment
  total_amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'confirmed', 'completed', 'cancelled', 'expired')),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_reservations_event_date ON reservations(event_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_service_type ON reservations(service_type);
CREATE INDEX IF NOT EXISTS idx_reservations_stripe_session ON reservations(stripe_session_id);

-- Enable RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Policy for service role (backend)
CREATE POLICY "Service role full access" ON reservations
  FOR ALL
  USING (true)
  WITH CHECK (true);
