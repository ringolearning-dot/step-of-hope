import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const SYSTEM_PROMPT = `You are the Step of Hope AI Assistant — a helpful, friendly assistant for admins of the "Step of Hope" nonprofit organization.

Your job is to answer questions about the organization's data: donations, expenses, recurring bills, volunteers, reservations, activity logs, and financial summaries.

You will receive real database data as context with each message. Use ONLY that data to answer — never make up numbers or data.

Guidelines:
- All monetary amounts in the data are stored in CENTS. Always convert to dollars when displaying (divide by 100).
- Format currency as $X.XX
- Use markdown bold (**text**) for headers and emphasis
- Use bullet points (•) for lists
- Be concise but thorough
- If the data doesn't contain what the user asked for, say so honestly
- You can do calculations, comparisons, and analysis on the provided data
- Be conversational and helpful — you're a smart assistant, not a rigid report generator
- If the user asks something unrelated to the organization data, politely redirect them
- When listing items, show the most important/recent ones (max 10-15 items)`;

// ===== DATA FETCHING FUNCTIONS =====

async function fetchAllContext() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const [
    { data: allDonations },
    { data: monthDonations },
    { data: expenses },
    { data: monthExpenses },
    { data: bills },
    { data: volunteers },
    { data: reservations },
    { data: activityLogs },
    { data: donStats },
  ] = await Promise.all([
    supabase.from('donations').select('*').eq('status', 'completed').order('created_at', { ascending: false }).limit(100),
    supabase.from('donations').select('*').eq('status', 'completed').gte('created_at', monthStart).order('created_at', { ascending: false }),
    supabase.from('expenses').select('*').order('date', { ascending: false }).limit(100),
    supabase.from('expenses').select('*').gte('date', monthStart.split('T')[0]).order('date', { ascending: false }),
    supabase.from('recurring_bills').select('*').eq('status', 'active').order('next_due_date'),
    supabase.from('volunteer_applications').select('id, first_name, last_name, email, phone, city, skills, status, created_at').order('created_at', { ascending: false }).limit(50),
    supabase.from('reservations').select('*').order('event_date', { ascending: true }).limit(50),
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.from('donation_stats').select('total_raised').limit(1).single(),
  ]);

  // Compute summaries
  const totalDonations = (allDonations || []).reduce((sum, d) => sum + d.amount, 0);
  const totalExpenses = (expenses || []).reduce((sum, e) => sum + e.amount, 0);
  const totalMonthDonations = (monthDonations || []).reduce((sum, d) => sum + d.amount, 0);
  const totalMonthExpenses = (monthExpenses || []).reduce((sum, e) => sum + e.amount, 0);

  const reservationRevenue = (reservations || [])
    .filter(r => ['paid', 'confirmed', 'completed'].includes(r.status))
    .reduce((sum, r) => sum + (r.total_amount || 0), 0);

  const totalIncome = (donStats?.total_raised || 0) + reservationRevenue;
  const balance = totalIncome - totalExpenses;

  // Bills status
  const overdueBills = (bills || []).filter(b => b.next_due_date < todayStr);
  const dueSoonBills = (bills || []).filter(b => b.next_due_date >= todayStr && b.next_due_date <= weekFromNow.toISOString().split('T')[0]);

  // Expense categories
  const expenseByCategory = {};
  (expenses || []).forEach(e => {
    const cat = e.category_name || 'Uncategorized';
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + e.amount;
  });

  // Volunteer stats
  const volunteerByStatus = {};
  (volunteers || []).forEach(v => {
    volunteerByStatus[v.status] = (volunteerByStatus[v.status] || 0) + 1;
  });

  // Top donors
  const donorMap = {};
  (allDonations || []).forEach(d => {
    const name = d.donor_name || 'Anonymous';
    donorMap[name] = (donorMap[name] || 0) + d.amount;
  });
  const topDonors = Object.entries(donorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, amount]) => ({ name, amount }));

  return {
    today: todayStr,
    financial: {
      totalIncome,
      totalDonations: donStats?.total_raised || totalDonations,
      totalExpenses,
      reservationRevenue,
      balance,
      monthDonations: totalMonthDonations,
      monthExpenses: totalMonthExpenses,
      monthNet: totalMonthDonations - totalMonthExpenses,
    },
    donations: {
      recent: (allDonations || []).slice(0, 20).map(d => ({
        donor_name: d.donor_name || 'Anonymous',
        amount: d.amount,
        is_monthly: d.is_monthly,
        date: d.created_at,
      })),
      thisMonthCount: (monthDonations || []).length,
      thisMonthTotal: totalMonthDonations,
      topDonors,
    },
    expenses: {
      recent: (expenses || []).slice(0, 20).map(e => ({
        title: e.title,
        amount: e.amount,
        category: e.category_name,
        vendor: e.vendor,
        date: e.date,
      })),
      byCategory: expenseByCategory,
      thisMonthCount: (monthExpenses || []).length,
      thisMonthTotal: totalMonthExpenses,
    },
    bills: {
      active: (bills || []).map(b => ({
        title: b.title,
        amount: b.amount,
        frequency: b.frequency,
        next_due_date: b.next_due_date,
        last_paid_date: b.last_paid_date,
      })),
      overdue: overdueBills.map(b => ({ title: b.title, amount: b.amount, next_due_date: b.next_due_date })),
      dueSoon: dueSoonBills.map(b => ({ title: b.title, amount: b.amount, next_due_date: b.next_due_date })),
      totalMonthlyObligation: (bills || []).filter(b => b.frequency === 'monthly').reduce((sum, b) => sum + b.amount, 0),
    },
    volunteers: {
      total: (volunteers || []).length,
      byStatus: volunteerByStatus,
      recentPending: (volunteers || []).filter(v => v.status === 'pending').slice(0, 10).map(v => ({
        name: `${v.first_name} ${v.last_name}`,
        city: v.city,
        skills: v.skills,
        date: v.created_at,
      })),
    },
    reservations: {
      all: (reservations || []).map(r => ({
        name: r.full_name,
        service: r.service_type,
        event_date: r.event_date,
        guests: r.estimated_guests,
        amount: r.total_amount,
        status: r.status,
        hours: r.num_hours,
      })),
      pending: (reservations || []).filter(r => r.status === 'pending' || r.status === 'paid').length,
      confirmed: (reservations || []).filter(r => r.status === 'confirmed').length,
      upcoming: (reservations || []).filter(r => r.event_date >= todayStr && r.status !== 'cancelled').length,
      totalRevenue: reservationRevenue,
    },
    activityLogs: (activityLogs || []).slice(0, 15).map(l => ({
      admin: l.admin_name || 'System',
      action: l.action,
      entity: l.entity_type,
      time: l.created_at,
    })),
  };
}

// ===== CHAT ENDPOINT =====

router.post('/admin/chat', authenticateToken, async (req, res) => {
  try {
    const { message, conversation_id } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });

    // Fetch database context
    const dbContext = await fetchAllContext();

    // Build conversation history for Gemini
    let conversationHistory = [];
    if (conversation_id) {
      const { data: conv } = await supabase
        .from('ai_conversations')
        .select('messages')
        .eq('id', conversation_id)
        .eq('admin_id', req.admin.id)
        .single();
      if (conv?.messages) {
        // Include last 20 messages for context
        conversationHistory = conv.messages.slice(-20).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        }));
      }
    }

    // Create chat with Gemini
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `${SYSTEM_PROMPT}\n\nHere is the current database context (all amounts in cents, divide by 100 for dollars):\n\n${JSON.stringify(dbContext, null, 2)}\n\nUse this data to answer my questions accurately. Today's date is ${dbContext.today}.` }],
        },
        {
          role: 'model',
          parts: [{ text: "I'm ready to help! I have access to all the current data for Step of Hope including donations, expenses, bills, volunteers, reservations, and financial summaries. What would you like to know?" }],
        },
        ...conversationHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    // Detect response type for frontend
    const lower = message.toLowerCase();
    let type = 'general';
    if (lower.includes('donation') || lower.includes('donated') || lower.includes('raised')) type = 'donations';
    else if (lower.includes('expense') || lower.includes('spent') || lower.includes('spend') || lower.includes('cost')) type = 'expenses';
    else if (lower.includes('bill') || lower.includes('due') || lower.includes('recurring')) type = 'bills';
    else if (lower.includes('volunteer')) type = 'volunteers';
    else if (lower.includes('reservation') || lower.includes('booking')) type = 'reservations';
    else if (lower.includes('balance') || lower.includes('financial') || lower.includes('summary')) type = 'financial';
    else if (lower.includes('activity') || lower.includes('today') || lower.includes('happened')) type = 'activity';

    const response = { text: responseText, data: null, type };

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
          { role: 'assistant', content: responseText, data: null, timestamp: new Date().toISOString() },
        ];
        await supabase
          .from('ai_conversations')
          .update({ messages, updated_at: new Date().toISOString() })
          .eq('id', conversation_id);
      }
    } else {
      const messages = [
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: responseText, data: null, timestamp: new Date().toISOString() },
      ];
      await supabase.from('ai_conversations').insert({
        admin_id: req.admin.id,
        messages,
        title: message.substring(0, 50),
      });
    }

    res.json(response);
  } catch (err) {
    console.error('AI assistant error:', err);
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

// Delete a conversation
router.delete('/admin/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', req.params.id)
      .eq('admin_id', req.admin.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete conversation.' });
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

export async function generateDailySummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();
  const todayDate = today.toISOString().split('T')[0];

  const { data: todayDonations } = await supabase
    .from('donations').select('amount, donor_name').eq('status', 'completed').gte('created_at', todayStr);
  const donationTotal = (todayDonations || []).reduce((sum, d) => sum + d.amount, 0);

  const { data: todayExpenses } = await supabase
    .from('expenses').select('amount, title').eq('date', todayDate);
  const expenseTotal = (todayExpenses || []).reduce((sum, e) => sum + e.amount, 0);

  const { data: newReservations } = await supabase
    .from('reservations').select('full_name, service_type, event_date').gte('created_at', todayStr);

  const { data: newVolunteers } = await supabase
    .from('volunteer_applications').select('first_name, last_name').gte('created_at', todayStr);

  const { data: overdueBills } = await supabase
    .from('recurring_bills').select('title, amount, next_due_date').eq('status', 'active').lt('next_due_date', todayDate);

  const threeDays = new Date();
  threeDays.setDate(threeDays.getDate() + 3);
  const { data: upcomingBills } = await supabase
    .from('recurring_bills').select('title, amount, next_due_date').eq('status', 'active')
    .gte('next_due_date', todayDate).lte('next_due_date', threeDays.toISOString().split('T')[0]);

  const { data: donStats } = await supabase.from('donation_stats').select('total_raised').limit(1).single();
  const { data: allExpenses } = await supabase.from('expenses').select('amount');
  const totalExpenses = (allExpenses || []).reduce((sum, e) => sum + e.amount, 0);
  const balance = (donStats?.total_raised || 0) - totalExpenses;

  return {
    date: todayDate,
    donations: { count: (todayDonations || []).length, total: donationTotal, items: todayDonations || [] },
    expenses: { count: (todayExpenses || []).length, total: expenseTotal, items: todayExpenses || [] },
    reservations: { count: (newReservations || []).length, items: newReservations || [] },
    volunteers: { count: (newVolunteers || []).length, items: newVolunteers || [] },
    overdueBills: overdueBills || [],
    upcomingBills: upcomingBills || [],
    balance,
  };
}

export default router;
