import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'stepofhope.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS site_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section TEXT NOT NULL,
    slot TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(section, slot)
  );

  CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent TEXT,
    donor_name TEXT,
    donor_email TEXT,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT DEFAULT 'pending',
    is_monthly INTEGER DEFAULT 0,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS volunteers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    interests TEXT,
    message TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    inquiry_type TEXT DEFAULT 'general',
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS donation_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_raised INTEGER DEFAULT 0,
    total_donors INTEGER DEFAULT 0,
    monthly_donors INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed admin account
const existingAdmin = db.prepare('SELECT id FROM admins WHERE email = ?').get('eliek@stepofhope.com');
if (!existingAdmin) {
  const hashedPassword = bcrypt.hashSync('elie12345', 12);
  db.prepare('INSERT INTO admins (email, password, name) VALUES (?, ?, ?)').run(
    'eliek@stepofhope.com',
    hashedPassword,
    'Elie Karam'
  );
  console.log('Admin account created: eliek@stepofhope.com');
}

// Seed initial stats row
const existingStats = db.prepare('SELECT id FROM donation_stats LIMIT 1').get();
if (!existingStats) {
  db.prepare('INSERT INTO donation_stats (total_raised, total_donors, monthly_donors) VALUES (0, 0, 0)').run();
}

export default db;
