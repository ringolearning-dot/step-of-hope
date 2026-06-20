import { Router } from 'express';
import supabase from '../db/init.js';

const router = Router();

// Public endpoint — no authentication required
// Returns transparency stats for the public website
router.get('/stats', async (req, res) => {
  try {
    // Total donations raised (completed only)
    const { data: allDonations } = await supabase
      .from('donations')
      .select('amount')
      .eq('status', 'completed');

    const totalRaised = (allDonations || []).reduce((sum, d) => sum + d.amount, 0);

    // Total expenses
    const { data: allExpenses } = await supabase
      .from('expenses')
      .select('amount');

    const totalExpenses = (allExpenses || []).reduce((sum, e) => sum + e.amount, 0);

    // Available funds
    const availableFunds = totalRaised - totalExpenses;

    // Impact stats from content table (editable via admin)
    const { data: impactContent } = await supabase
      .from('content')
      .select('value')
      .eq('key', 'transparency_impact')
      .single();

    let childrenHelped = 150;
    let eventsOrganized = 45;

    if (impactContent?.value) {
      try {
        const parsed = JSON.parse(impactContent.value);
        childrenHelped = parsed.children_helped ?? childrenHelped;
        eventsOrganized = parsed.events_organized ?? eventsOrganized;
      } catch {}
    }

    res.json({
      totalRaised,
      totalExpenses,
      availableFunds,
      childrenHelped,
      eventsOrganized,
    });
  } catch (err) {
    console.error('Transparency stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch transparency stats.' });
  }
});

// Public endpoint — all completed donations (anonymized where needed)
router.get('/donations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('id, donor_name, amount, is_monthly, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Return donations with names (donors are public supporters)
    const donations = (data || []).map(d => ({
      id: d.id,
      donor: d.donor_name || 'Anonymous',
      amount: d.amount,
      isMonthly: d.is_monthly,
      date: d.created_at,
    }));

    res.json(donations);
  } catch (err) {
    console.error('Transparency donations error:', err.message);
    res.status(500).json({ error: 'Failed to fetch donations.' });
  }
});

// Public endpoint — all expenses with details
router.get('/expenses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('id, title, description, amount, category_name, date, vendor')
      .order('date', { ascending: false });

    if (error) throw error;

    const expenses = (data || []).map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      amount: e.amount,
      category: e.category_name || 'General',
      date: e.date,
      vendor: e.vendor,
    }));

    res.json(expenses);
  } catch (err) {
    console.error('Transparency expenses error:', err.message);
    res.status(500).json({ error: 'Failed to fetch expenses.' });
  }
});

export default router;
