import { Router } from 'express';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Generate a comprehensive report
router.get('/admin/generate', authenticateToken, async (req, res) => {
  try {
    const { type = 'financial', startDate, endDate } = req.query;

    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    let reportData;

    switch (type) {
      case 'financial':
        reportData = await generateFinancialReport(start, end);
        break;
      case 'donations':
        reportData = await generateDonationReport(start, end);
        break;
      case 'expenses':
        reportData = await generateExpenseReport(start, end);
        break;
      case 'volunteers':
        reportData = await generateVolunteerReport(start, end);
        break;
      case 'reservations':
        reportData = await generateReservationReport(start, end);
        break;
      default:
        reportData = await generateFinancialReport(start, end);
    }

    res.json({
      type,
      dateRange: { start, end },
      generated_at: new Date().toISOString(),
      ...reportData,
    });
  } catch (err) {
    console.error('Report generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate report.' });
  }
});

// Save a report
router.post('/admin/save', authenticateToken, async (req, res) => {
  try {
    const { title, type, date_from, date_to, data } = req.body;

    const { data: report, error } = await supabase
      .from('saved_reports')
      .insert({
        title,
        type,
        date_from,
        date_to,
        data,
        generated_by: req.admin.id,
      })
      .select()
      .single();

    if (error) throw error;
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save report.' });
  }
});

// Get saved reports
router.get('/admin/saved', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('saved_reports')
      .select('id, title, type, date_from, date_to, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch saved reports.' });
  }
});

// Get a specific saved report
router.get('/admin/saved/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('saved_reports')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch report.' });
  }
});

// Delete a saved report
router.delete('/admin/saved/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('saved_reports')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete report.' });
  }
});

// ===== REPORT GENERATORS =====

async function generateFinancialReport(start, end) {
  // Donations in period
  const { data: donations } = await supabase
    .from('donations')
    .select('amount, created_at, is_monthly')
    .eq('status', 'completed')
    .gte('created_at', `${start}T00:00:00Z`)
    .lte('created_at', `${end}T23:59:59Z`);

  const totalDonations = (donations || []).reduce((sum, d) => sum + d.amount, 0);

  // Expenses in period
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, category_name, date')
    .gte('date', start)
    .lte('date', end);

  const totalExpenses = (expenses || []).reduce((sum, e) => sum + e.amount, 0);

  // Reservations revenue in period
  const { data: reservations } = await supabase
    .from('reservations')
    .select('total_amount, created_at')
    .in('status', ['paid', 'confirmed', 'completed'])
    .gte('created_at', `${start}T00:00:00Z`)
    .lte('created_at', `${end}T23:59:59Z`);

  const reservationRevenue = (reservations || []).reduce((sum, r) => sum + (r.total_amount || 0), 0);

  // Expense breakdown
  const expenseByCategory = {};
  (expenses || []).forEach(e => {
    const cat = e.category_name || 'Uncategorized';
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + e.amount;
  });

  return {
    summary: {
      totalIncome: totalDonations + reservationRevenue,
      totalExpenses,
      netIncome: (totalDonations + reservationRevenue) - totalExpenses,
      donationCount: (donations || []).length,
      expenseCount: (expenses || []).length,
    },
    donations: {
      total: totalDonations,
      count: (donations || []).length,
      oneTime: (donations || []).filter(d => !d.is_monthly).reduce((sum, d) => sum + d.amount, 0),
      recurring: (donations || []).filter(d => d.is_monthly).reduce((sum, d) => sum + d.amount, 0),
    },
    expenses: {
      total: totalExpenses,
      byCategory: expenseByCategory,
    },
    reservations: {
      revenue: reservationRevenue,
      count: (reservations || []).length,
    },
  };
}

async function generateDonationReport(start, end) {
  const { data: donations } = await supabase
    .from('donations')
    .select('*')
    .eq('status', 'completed')
    .gte('created_at', `${start}T00:00:00Z`)
    .lte('created_at', `${end}T23:59:59Z`)
    .order('created_at', { ascending: false });

  const total = (donations || []).reduce((sum, d) => sum + d.amount, 0);

  // Top donors
  const donorMap = {};
  (donations || []).forEach(d => {
    const name = d.donor_name || 'Anonymous';
    donorMap[name] = (donorMap[name] || 0) + d.amount;
  });
  const topDonors = Object.entries(donorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, amount]) => ({ name, amount }));

  // Monthly breakdown
  const monthlyMap = {};
  (donations || []).forEach(d => {
    const month = d.created_at.substring(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { total: 0, count: 0 };
    monthlyMap[month].total += d.amount;
    monthlyMap[month].count += 1;
  });

  return {
    total,
    count: (donations || []).length,
    average: (donations || []).length > 0 ? Math.round(total / (donations || []).length) : 0,
    oneTime: (donations || []).filter(d => !d.is_monthly).length,
    recurring: (donations || []).filter(d => d.is_monthly).length,
    topDonors,
    monthlyBreakdown: Object.entries(monthlyMap)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    donations: donations || [],
  };
}

async function generateExpenseReport(start, end) {
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false });

  const total = (expenses || []).reduce((sum, e) => sum + e.amount, 0);

  const byCategory = {};
  (expenses || []).forEach(e => {
    const cat = e.category_name || 'Uncategorized';
    if (!byCategory[cat]) byCategory[cat] = { total: 0, count: 0 };
    byCategory[cat].total += e.amount;
    byCategory[cat].count += 1;
  });

  const byVendor = {};
  (expenses || []).forEach(e => {
    const vendor = e.vendor || 'Unknown';
    byVendor[vendor] = (byVendor[vendor] || 0) + e.amount;
  });

  return {
    total,
    count: (expenses || []).length,
    average: (expenses || []).length > 0 ? Math.round(total / (expenses || []).length) : 0,
    byCategory,
    topVendors: Object.entries(byVendor)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([vendor, amount]) => ({ vendor, amount })),
    expenses: expenses || [],
  };
}

async function generateVolunteerReport(start, end) {
  const { data: volunteers } = await supabase
    .from('volunteer_applications')
    .select('*')
    .gte('created_at', `${start}T00:00:00Z`)
    .lte('created_at', `${end}T23:59:59Z`);

  const byStatus = {};
  (volunteers || []).forEach(v => {
    byStatus[v.status] = (byStatus[v.status] || 0) + 1;
  });

  const byCity = {};
  (volunteers || []).forEach(v => {
    const city = v.city || 'Unknown';
    byCity[city] = (byCity[city] || 0) + 1;
  });

  return {
    total: (volunteers || []).length,
    byStatus,
    byCity,
    approved: (volunteers || []).filter(v => v.status === 'approved' || v.status === 'active').length,
    pending: (volunteers || []).filter(v => v.status === 'pending').length,
  };
}

async function generateReservationReport(start, end) {
  const { data: reservations } = await supabase
    .from('reservations')
    .select('*')
    .gte('created_at', `${start}T00:00:00Z`)
    .lte('created_at', `${end}T23:59:59Z`);

  const totalRevenue = (reservations || [])
    .filter(r => r.status !== 'cancelled' && r.status !== 'expired')
    .reduce((sum, r) => sum + (r.total_amount || 0), 0);

  const byService = {};
  (reservations || []).forEach(r => {
    if (!byService[r.service_type]) byService[r.service_type] = { count: 0, revenue: 0 };
    byService[r.service_type].count += 1;
    if (r.status !== 'cancelled' && r.status !== 'expired') {
      byService[r.service_type].revenue += (r.total_amount || 0);
    }
  });

  const byStatus = {};
  (reservations || []).forEach(r => {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  });

  return {
    total: (reservations || []).length,
    totalRevenue,
    byService,
    byStatus,
    averageRevenue: (reservations || []).length > 0 ? Math.round(totalRevenue / (reservations || []).length) : 0,
  };
}

export default router;
