-- Documents & Files table for receipts, invoices, contracts, etc.
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT,
  public_url TEXT,
  storage_path TEXT,
  expiry_date DATE,
  image_url TEXT,
  image_storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add expiry_date and image columns if table already exists
ALTER TABLE documents ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS image_storage_path TEXT;

-- Index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to documents"
  ON documents FOR ALL
  USING (true)
  WITH CHECK (true);
