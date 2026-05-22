-- Run this in Supabase SQL Editor
-- Volunteer Applications table for comprehensive volunteer form

CREATE TABLE IF NOT EXISTS volunteer_applications (
  id BIGSERIAL PRIMARY KEY,

  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  age INTEGER,
  gender TEXT,
  profile_photo_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  phone TEXT,
  email TEXT NOT NULL,

  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,

  -- Professional Information
  profession TEXT,
  company_name TEXT,
  skills TEXT,
  languages TEXT,

  -- Volunteer Details
  why_volunteer TEXT,
  volunteered_before BOOLEAN DEFAULT FALSE,
  interests TEXT, -- JSON array of interest IDs

  -- Availability
  days_available TEXT, -- JSON array of day names
  time_available TEXT,
  can_travel BOOLEAN DEFAULT FALSE,
  preferred_location TEXT,

  -- Important Questions
  experience_with_children BOOLEAN DEFAULT FALSE,
  comfortable_medical_conditions BOOLEAN DEFAULT FALSE,
  medical_limitations TEXT,
  has_driver_license BOOLEAN DEFAULT FALSE,
  can_lift_equipment BOOLEAN DEFAULT FALSE,

  -- Background & Safety
  consent_background_check BOOLEAN DEFAULT FALSE,
  agree_to_policies BOOLEAN DEFAULT FALSE,
  digital_signature BOOLEAN DEFAULT FALSE,
  id_document_url TEXT,

  -- Admin Management
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vol_app_status ON volunteer_applications(status);
CREATE INDEX IF NOT EXISTS idx_vol_app_city ON volunteer_applications(city);
CREATE INDEX IF NOT EXISTS idx_vol_app_email ON volunteer_applications(email);
CREATE INDEX IF NOT EXISTS idx_vol_app_created ON volunteer_applications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on volunteer_applications"
  ON volunteer_applications
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow anonymous inserts (public form submission)
CREATE POLICY "Allow anonymous inserts on volunteer_applications"
  ON volunteer_applications
  FOR INSERT
  WITH CHECK (true);
