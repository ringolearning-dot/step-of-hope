import { Router } from 'express';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// AI Assistant - Process a query and return data-driven response
router.post('/admin/chat', authenticateToken, async (req, res) => {
  try {
    const { message, conversation_id } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required.' });

    // Parse intent from message
    const response = await processQuery(message);

    // Save to conversation history
    if (conversation_id) {
      const { data: conv } = await supabase
        .from('ai_conversations')
        .select('messages')
        .eq('id', conversation_id)
        .eq('admin_id', req.admin.id)
        .single();

      if (conv) {
        const messages = [...(conv.messages || []),
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'assistant', content: response.text, data: response.data, timestamp: new Date().toISOString() },
        ];
        await supabase
          .from('ai_conversations')
          .update({ messages, updated_at: new Date().toISOString() })
          .eq('id', conversation_id);
      }
    } else {
      // Create new conversation
      const messages = [
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: response.text, data: response.data, timestamp: new Date().toISOString() },
      ];
      await supabase.from('ai_conversations').insert({
        admin_id: req.admin.id,
        messages,
        title: message.substring(0, 50),
      });
    }

    res.json(response);
  } catch (err) {
    console.error('AI assistant error:', err.message);
    res.status(500).json({ error: 'Failed to process query.' });
  }
});

// Get conversation history
router.get('/admin/conversations', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('id, title, created_at, updated_at')
      .eq('admin_id', req.admin.id)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
});

// Get a specific conversation
router.get('/admin/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', req.params.id)
      .eq('admin_id', req.admin.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation.' });
  }
});

// Get daily summary
router.get('/admin/daily-summary', authenticateToken, async (req, res) => {
  try {
    const summary = await generateDailySummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate daily summary.' });
  }
});

// ===== QUERY PROCESSING ENGINE =====

async function processQuery(message) {
  const lower = message.toLowerCase();

  // Donation queries
  if (lower.includes('donation') || lower.includes('donated') || lower.includes('raised')) {
    return await handleDonationQuery(lower);
  }

  // Expense queries
  if (lower.includes('expense') || lower.includes('spent') || lower.includes('spend') || lower.includes('cost')) {
    return await handleExpenseQuery(lower);
  }

  // Bill queries
  if (lower.includes('bill') || lower.includes('due') || lower.includes('recurring') || lower.includes('payment')) {
    return await handleBillQuery(lower);
  }

  // Volunteer queries
  if (lower.includes('volunteer')) {
    return await handleVolunteerQuery(lower);
  }

  // Reservation queries
  if (lower.includes('reservation') || lower.includes('booking') || lower.includes('booked')) {
    return await handleReservationQuery(lower);
  }

  // Balance / financial summary
  if (lower.includes('balance') || lower.includes('financial') || lower.includes('summary') || lower.includes('overview')) {
    return await handleFinancialSummary();
  }

  // Activity queries
  if (lower.includes('activity') || lower.includes('recent') || lower.includes('today') || lower.includes('happened')) {
    return await handleActivityQuery(lower);
  }

  return {
    text: "I can help you with information about donations, expenses, recurring bills, volunteers, reservations, and financial summaries. Try asking something like:\n\n• \"Show me this month's donations\"\n• \"How much did we spend on events?\"\n• \"What bills are due this week?\"\n• \"Show pending reservations\"\n• \"What's our current balance?\"\n• \"Generate a financial summary\"",
    data: null,
    type: 'help',
  };
}

async function handleDonationQuery(query) {
  const now = new Date();
  let startDate, endDate, periodLabel;

  if (query.includes('today')) {
    startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    endDate = new Date().toISOString();
    periodLabel = 'today';
  } else if (query.includes('this week')) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    startDate = weekStart.toISOString();
    endDate = new Date().toISOString();
    periodLabel = 'this week';
  } else if (query.includes('this month') || query.includes("month's")) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate = monthStart.toISOString();
    endDate = new Date().toISOString();
    periodLabel = 'this month';
  } else if (query.includes('this year') || query.includes("year's")) {
    const yearStart = new Date(now.getFullYear(), 0, 1);
    startDate = yearStart.toISOString();
    endDate = new Date().toISOString();
    periodLabel = 'this year';
  } else {
    // All time
    startDate = '2020-01-01T00:00:00Z';
    endDate = new Date().toISOString();
    periodLabel = 'all time';
  }

  let donQuery = supabase
    .from('donations')
    .select('*')
    .eq('status', 'completed')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  const { data: donations } = await donQuery;
  const total = (donations || []).reduce((sum, d) => sum + d.amount, 0);
  const count = (donations || []).length;

  // Top donors
  const donorMap = {};
  (donations || []).forEach(d => {
    const name = d.donor_name || 'Anonymous';
    donorMap[name] = (donorMap[name] || 0) + d.amount;
  });
  const topDonors = Object.entries(donorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));

  return {
    text: `**Donations ${periodLabel}:**\n\n• Total: $${(total / 100).toFixed(2)}\n• Number of donations: ${count}\n• Average: $${count > 0 ? ((total / count) / 100).toFixed(2) : '0.00'}\n\n**Top donors:**\n${topDonors.map((d, i) => `${i + 1}. ${d.name}: $${(d.amount / 100).toFixed(2)}`).join('\n')}`,
    data: { total, count, topDonors, period: periodLabel },
    type: 'donations',
  };
}

async function handleExpenseQuery(query) {
  const now = new Date();
  let dateFilter = {};
  let periodLabel = 'all time';

  if (query.includes('this month') || query.includes("month's")) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    dateFilter = { start: monthStart };
    periodLabel = 'this month';
  } else if (query.includes('this year')) {
    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    dateFilter = { start: yearStart };
    periodLabel = 'this year';
  }

  let expQuery = supabase.from('expenses').select('*');
  if (dateFilter.start) expQuery = expQuery.gte('date', dateFilter.start);

  const { data: expenses } = await expQuery;
  const total = (expenses || []).reduce((sum, e) => sum + e.amount, 0);

  // By category
  const byCategory = {};
  (expenses || []).forEach(e => {
    const cat = e.category_name || 'Uncategorized';
    byCategory[cat] = (byCategory[cat] || 0) + e.amount;
  });

  // Check for specific category query
  const categories = ['medical', 'event', 'equipment', 'marketing', 'transport', 'food', 'supplies', 'storage', 'insurance', 'utilit', 'software', 'miscellaneous'];
  const matchedCategory = categories.find(c => query.includes(c));

  let categoryText = '';
  if (matchedCategory) {
    const catTotal = Object.entries(byCategory)
      .filter(([k]) => k.toLowerCase().includes(matchedCategory))
      .reduce((sum, [, v]) => sum + v, 0);
    categoryText = `\n\n**${matchedCategory} expenses:** $${(catTotal / 100).toFixed(2)}`;
  }

  const categoryBreakdown = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `• ${cat}: $${(amt / 100).toFixed(2)}`)
    .join('\n');

  return {
    text: `**Expenses ${periodLabel}:**\n\n• Total: $${(total / 100).toFixed(2)}\n• Number of expenses: ${(expenses || []).length}\n\n**By category:**\n${categoryBreakdown}${categoryText}`,
    data: { total, count: (expenses || []).length, byCategory, period: periodLabel },
    type: 'expenses',
  };
}

async function handleBillQuery(query) {
  const today = new Date().toISOString().split('T')[0];
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekStr = weekFromNow.toISOString().split('T')[0];

  const { data: bills } = await supabase
    .from('recurring_bills')
    .select('*')
    .eq('status', 'active')
    .order('next_due_date');

  const overdue = (bills || []).filter(b => b.next_due_date < today);
  const dueSoon = (bills || []).filter(b => b.next_due_date >= today && b.next_due_date <= weekStr);
  const upcoming = (bills || []).filter(b => b.next_due_date > weekStr);

  let text = '**Recurring Bills Status:**\n\n';

  if (overdue.length > 0) {
    text += `⚠️ **Overdue (${overdue.length}):**\n`;
    text += overdue.map(b => `• ${b.title}: $${(b.amount / 100).toFixed(2)} (due ${b.next_due_date})`).join('\n');
    text += '\n\n';
  }

  if (query.includes('this week') || query.includes('due')) {
    text += `📅 **Due this week (${dueSoon.length}):**\n`;
    text += dueSoon.length > 0
      ? dueSoon.map(b => `• ${b.title}: $${(b.amount / 100).toFixed(2)} (due ${b.next_due_date})`).join('\n')
      : '• No bills due this week';
    text += '\n\n';
  }

  text += `📋 **Total active bills:** ${(bills || []).length}\n`;
  text += `💰 **Total monthly obligation:** $${((bills || []).filter(b => b.frequency === 'monthly').reduce((sum, b) => sum + b.amount, 0) / 100).toFixed(2)}`;

  return {
    text,
    data: { overdue, dueSoon, upcoming, total: (bills || []).length },
    type: 'bills',
  };
}

async function handleVolunteerQuery(query) {
  const { data: volunteers } = await supabase
    .from('volunteer_applications')
    .select('id, first_name, last_name, status, city, skills, created_at');

  const byStatus = {};
  (volunteers || []).forEach(v => {
    byStatus[v.status] = (byStatus[v.status] || 0) + 1;
  });

  const pending = (volunteers || []).filter(v => v.status === 'pending');

  let text = `**Volunteer Overview:**\n\n• Total applications: ${(volunteers || []).length}\n`;
  text += Object.entries(byStatus).map(([s, c]) => `• ${s}: ${c}`).join('\n');

  if (pending.length > 0 && (query.includes('pending') || query.includes('new'))) {
    text += `\n\n**Pending applications (${pending.length}):**\n`;
    text += pending.slice(0, 10).map(v => `• ${v.first_name} ${v.last_name} (${v.city || 'N/A'})`).join('\n');
  }

  return {
    text,
    data: { total: (volunteers || []).length, byStatus, pending: pending.length },
    type: 'volunteers',
  };
}

async function handleReservationQuery(query) {
  const { data: reservations } = await supabase
    .from('reservations')
    .select('*')
    .order('event_date', { ascending: true });

  const pending = (reservations || []).filter(r => r.status === 'pending' || r.status === 'paid');
  const confirmed = (reservations || []).filter(r => r.status === 'confirmed');
  const upcoming = (reservations || []).filter(r => r.event_date >= new Date().toISOString().split('T')[0] && r.status !== 'cancelled');

  let text = `**Reservations Overview:**\n\n• Total: ${(reservations || []).length}\n• Pending: ${pending.length}\n• Confirmed: ${confirmed.length}\n• Upcoming: ${upcoming.length}\n`;

  if (query.includes('pending') && pending.length > 0) {
    text += `\n**Pending reservations:**\n`;
    text += pending.slice(0, 10).map(r => `• ${r.full_name} - ${r.service_type} on ${r.event_date}`).join('\n');
  }

  if (query.includes('upcoming') && upcoming.length > 0) {
    text += `\n**Upcoming:**\n`;
    text += upcoming.slice(0, 10).map(r => `• ${r.full_name} - ${r.service_type} on ${r.event_date} (${r.status})`).join('\n');
  }

  const totalRevenue = (reservations || [])
    .filter(r => r.status !== 'cancelled' && r.status !== 'expired')
    .reduce((sum, r) => sum + (r.total_amount || 0), 0);
  text += `\n\n💰 **Total reservation revenue:** $${(totalRevenue / 100).toFixed(2)}`;

  return {
    text,
    data: { total: (reservations || []).length, pending: pending.length, confirmed: confirmed.length, upcoming: upcoming.length, totalRevenue },
    type: 'reservations',
  };
}

async function handleFinancialSummary() {
  // Get total donations
  const { data: donStats } = await supabase
    .from('donation_stats')
    .select('total_raised')
    .limit(1)
    .single();

  // Get total expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount');
  const totalExpenses = (expenses || []).reduce((sum, e) => sum + e.amount, 0);

  // Get reservation revenue
  const { data: reservations } = await supabase
    .from('reservations')
    .select('total_amount, status')
    .in('status', ['paid', 'confirmed', 'completed']);
  const reservationRevenue = (reservations || []).reduce((sum, r) => sum + (r.total_amount || 0), 0);

  const totalIncome = (donStats?.total_raised || 0) + reservationRevenue;
  const balance = totalIncome - totalExpenses;

  // This month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: monthDonations } = await supabase
    .from('donations')
    .select('amount')
    .eq('status', 'completed')
    .gte('created_at', monthStart.toISOString());
  const monthIncome = (monthDonations || []).reduce((sum, d) => sum + d.amount, 0);

  const { data: monthExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .gte('date', monthStart.toISOString().split('T')[0]);
  const monthSpent = (monthExpenses || []).reduce((sum, e) => sum + e.amount, 0);

  return {
    text: `**Financial Summary:**\n\n**All Time:**\n• Total Income (donations + reservations): $${(totalIncome / 100).toFixed(2)}\n• Total Expenses: $${(totalExpenses / 100).toFixed(2)}\n• Current Balance: $${(balance / 100).toFixed(2)}\n\n**This Month:**\n• Income: $${(monthIncome / 100).toFixed(2)}\n• Expenses: $${(monthSpent / 100).toFixed(2)}\n• Net: $${((monthIncome - monthSpent) / 100).toFixed(2)}\n\n**Breakdown:**\n• Donations: $${((donStats?.total_raised || 0) / 100).toFixed(2)}\n• Reservation Revenue: $${(reservationRevenue / 100).toFixed(2)}`,
    data: { totalIncome, totalExpenses, balance, monthIncome, monthSpent, reservationRevenue },
    type: 'financial',
  };
}

async function handleActivityQuery(query) {
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15);

  let text = '**Recent Activity:**\n\n';
  if (!logs || logs.length === 0) {
    text += 'No recent activity recorded.';
  } else {
    text += logs.map(l => {
      const time = new Date(l.created_at).toLocaleString();
      return `• [${time}] ${l.admin_name || 'System'}: ${l.action} (${l.entity_type})`;
    }).join('\n');
  }

  return { text, data: { logs }, type: 'activity' };
}

export async function generateDailySummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();
  const todayDate = today.toISOString().split('T')[0];

  // Today's donations
  const { data: todayDonations } = await supabase
    .from('donations')
    .select('amount, donor_name')
    .eq('status', 'completed')
    .gte('created_at', todayStr);
  const donationTotal = (todayDonations || []).reduce((sum, d) => sum + d.amount, 0);

  // Today's expenses
  const { data: todayExpenses } = await supabase
    .from('expenses')
    .select('amount, title')
    .eq('date', todayDate);
  const expenseTotal = (todayExpenses || []).reduce((sum, e) => sum + e.amount, 0);

  // New reservations today
  const { data: newReservations } = await supabase
    .from('reservations')
    .select('full_name, service_type, event_date')
    .gte('created_at', todayStr);

  // New volunteer applications
  const { data: newVolunteers } = await supabase
    .from('volunteer_applications')
    .select('first_name, last_name')
    .gte('created_at', todayStr);

  // Overdue bills
  const { data: overdueBills } = await supabase
    .from('recurring_bills')
    .select('title, amount, next_due_date')
    .eq('status', 'active')
    .lt('next_due_date', todayDate);

  // Bills due in next 3 days
  const threeDays = new Date();
  threeDays.setDate(threeDays.getDate() + 3);
  const { data: upcomingBills } = await supabase
    .from('recurring_bills')
    .select('title, amount, next_due_date')
    .eq('status', 'active')
    .gte('next_due_date', todayDate)
    .lte('next_due_date', threeDays.toISOString().split('T')[0]);

  // Current balance
  const { data: donStats } = await supabase
    .from('donation_stats')
    .select('total_raised')
    .limit(1)
    .single();
  const { data: allExpenses } = await supabase
    .from('expenses')
    .select('amount');
  const totalExpenses = (allExpenses || []).reduce((sum, e) => sum + e.amount, 0);
  const balance = (donStats?.total_raised || 0) - totalExpenses;

  return {
    date: todayDate,
    donations: {
      count: (todayDonations || []).length,
      total: donationTotal,
      items: todayDonations || [],
    },
    expenses: {
      count: (todayExpenses || []).length,
      total: expenseTotal,
      items: todayExpenses || [],
    },
    reservations: {
      count: (newReservations || []).length,
      items: newReservations || [],
    },
    volunteers: {
      count: (newVolunteers || []).length,
      items: newVolunteers || [],
    },
    overdueBills: overdueBills || [],
    upcomingBills: upcomingBills || [],
    balance,
  };
}

export default router;
