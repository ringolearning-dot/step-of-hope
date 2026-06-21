import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function initDB() {
  // Seed admin
  const { data: existingAdmin } = await supabase
    .from('admins')
    .select('id')
    .eq('email', 'eliek@stepofhope.com')
    .single();

  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync('elie12345', 12);
    await supabase.from('admins').insert({
      email: 'eliek@stepofhope.com',
      password: hashedPassword,
      name: 'Elie Karam',
    });
    console.log('Admin account created: eliek@stepofhope.com');
  }

  // Seed donation stats
  const { data: existingStats } = await supabase
    .from('donation_stats')
    .select('id')
    .limit(1)
    .single();

  if (!existingStats) {
    await supabase.from('donation_stats').insert({
      total_raised: 0,
      total_donors: 0,
      monthly_donors: 0,
    });
  }

  // Ensure documents table exists
  const { error: docCheck } = await supabase
    .from('documents')
    .select('id')
    .limit(1);

  if (docCheck && docCheck.code === '42P01') {
    console.log('Documents table not found — please run migrations/create_documents_table.sql in Supabase');
  }

  console.log('Database initialized');
}

export default supabase;
