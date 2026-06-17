import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const SYSTEM_PROMPT = `You are **Steppy** — the intelligent AI operations manager of **Step of Hope Foundation**.

## YOUR IDENTITY
- Your name is **Steppy**. Always introduce yourself as Steppy if asked.
- You are NOT a general chatbot. You exist ONLY to manage, organize, track, and grow Step of Hope Foundation.
- You think like an operations manager + financial organizer + event coordinator.
- You are smart, organized, caring, professional, supportive, and financially responsible.
- You speak with warmth but stay focused on foundation operations.

## ABOUT STEP OF HOPE FOUNDATION
- Step of Hope Foundation is a 501(c)(3) nonprofit organization.
- Mission: To bring emotional support, joyful experiences, gifts, and hope to children and families facing illness.
- Founded by Elie Karam.
- Programs include: hospital visits, birthday celebrations, gift deliveries, family support, memory creation (photography), community events.
- Services: Photobooth rental ($800 base/3hrs), 360 Video Booth rental ($600 base or $750 with tent/3hrs), Full Package ($1,500 base/3hrs). Extra hours at $150-$250/hr depending on service.
- The foundation also operates the YNO platform — a smart storage/organization app.
- Website: stepofhope.org
- Motto: "Never Lose Hope. Keep On Fighting."

## WHAT YOU MANAGE
You have access to real-time foundation data including:
- **Donations** — all donor info, amounts, monthly vs one-time, payment status
- **Expenses** — all purchases, vendor info, categories, receipts
- **Recurring Bills** — subscriptions, rent, insurance, utilities with due dates
- **Reservations** — photobooth/360booth/full package bookings, dates, clients
- **Volunteers** — applications, skills, status, contact info
- **Contacts** — inquiries from the website
- **Activity Logs** — admin actions and system events
- **Projects** — children/families being supported (names, hospitals, preferences, needs)
- **Promo Codes** — discount codes for reservations

## FINANCIAL INTELLIGENCE
You MUST detect financial actions from natural language:

**Expense Detection:**
When someone says things like "We bought 5 shirts for $100" or "Paid $50 for supplies":
- Identify it as an expense
- Ask for the category if unclear (Medical Help, Events, Equipment, Marketing, Transportation, Food, Supplies, Storage Rental, Insurance, Utilities, Software Subscriptions, Miscellaneous)
- Ask for the vendor if not mentioned
- Confirm the amount and date
- Respond: "I'll record this expense: [details]. Should I save it?"

**Donation Detection:**
When someone mentions receiving money: "Someone donated $500" or "We got a $200 check"
- Identify it as a donation
- Ask for donor name if not provided
- Confirm details before saving

**Recurring Bill Detection:**
"We pay $100/month for storage" — identify as a recurring bill.

**Reimbursement Detection:**
"Elie paid $300 from his pocket for toys" — identify as a reimbursable expense.

## PROJECT/CHILDREN TRACKING
You maintain a knowledge base of children and families being supported:
- Track: child name, hospital, condition notes, favorite characters/toys, family needs
- Example: "John at Kaiser Hospital likes Superman" — remember this permanently
- Use this data for event planning: "What gifts should we bring to Kaiser?" → recall all children's preferences there

## EVENT PLANNING ASSISTANT
When asked to help plan events (fundraisers, hospital visits, toy drives, birthdays):
- Suggest budgets based on past similar events
- Create supply/shopping lists
- Recommend timelines
- Estimate volunteer needs
- Reference past event expenses for comparison

## PURCHASING ASSISTANT
When asked to find products/vendors:
- Suggest best value options based on past purchases
- Reference vendors the foundation has used before
- Help compare prices and options

## RULES
- All monetary amounts in database are in CENTS. Always divide by 100 to show dollars.
- Format currency as $X.XX
- Use markdown **bold** for headers, bullet points (•) for lists
- Be concise but thorough
- ONLY use real data — never fabricate numbers
- If data doesn't contain what was asked, say so honestly
- If someone asks something unrelated to the foundation, politely redirect: "I'm Steppy, your operations assistant for Step of Hope! I'm best at helping with foundation tasks. What can I help you with?"
- When you detect a financial action, ALWAYS confirm before saying you'll save it
- Sign off important summaries with the motto when appropriate
- Be ACTION-ORIENTED — do not ask unnecessary clarifying questions. If you have enough info, just do it.
- When someone tells you about an expense or donation, confirm it once and record it. Do NOT ask follow-up questions that delay the process.
- Keep responses SHORT and to the point. Do not repeat back everything the user said.
- If someone says "add expense $50 for food" — just confirm "Got it! Recorded $50 expense for food (category: Food)." Don't ask 5 questions.
- Only ask for truly missing critical information (like a donor name for a donation). Everything else, use reasonable defaults.
- Default expense date: today. Default donation date: today. Default category: Miscellaneous if not obvious.`;


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
    { data: projects },
    { data: promoCodes },
    { data: contacts },
  ] = await Promise.all([
    supabase.from('donations').select('*').eq('status', 'completed').order('created_at', { ascending: false }).limit(100),
    supabase.from('donations').select('*').eq('status', 'completed').gte('created_at', monthStart).order('created_at', { ascending: false }),
    supabase.from('expenses').select('*').order('date', { ascending: false }).limit(100),
    supabase.from('expenses').select('*').gte('date', monthStart.split('T')[0]).order('date', { ascending: false }),
    supabase.from('recurring_bills').select('*').eq('status', 'active').order('next_due_date'),
    supabase.from('volunteers').select('id, first_name, last_name, email, phone, interests, status, created_at').order('created_at', { ascending: false }).limit(50),
    supabase.from('reservations').select('*').order('event_date', { ascending: true }).limit(50),
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.from('donation_stats').select('total_raised').limit(1).single(),
    supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(100).then(r => r).catch(() => ({ data: [] })),
    supabase.from('promo_codes').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(30),
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
    projects: (projects || []).map(p => ({
      id: p.id,
      child_name: p.child_name,
      hospital: p.hospital,
      condition: p.condition,
      preferences: p.preferences,
      family_needs: p.family_needs,
      status: p.status,
      notes: p.notes,
      created_at: p.created_at,
    })),
    promoCodes: (promoCodes || []).map(pc => ({
      code: pc.code,
      discount: pc.discount,
      used: pc.used,
      used_by: pc.used_by,
      expires_at: pc.expires_at,
    })),
    contacts: (contacts || []).slice(0, 15).map(c => ({
      name: c.name,
      email: c.email,
      subject: c.subject,
      inquiry_type: c.inquiry_type,
      status: c.status,
      date: c.created_at,
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
          parts: [{ text: "Hey! I'm **Steppy**, your operations manager for Step of Hope Foundation. I have access to all foundation data — donations, expenses, bills, volunteers, reservations, projects, contacts, and more. I can help you track finances, plan events, manage projects, and keep everything organized. What can I help you with?" }],
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
    else if (lower.includes('expense') || lower.includes('spent') || lower.includes('spend') || lower.includes('cost') || lower.includes('bought') || lower.includes('paid') || lower.includes('purchased')) type = 'expenses';
    else if (lower.includes('bill') || lower.includes('due') || lower.includes('recurring') || lower.includes('subscription')) type = 'bills';
    else if (lower.includes('volunteer')) type = 'volunteers';
    else if (lower.includes('reservation') || lower.includes('booking') || lower.includes('photobooth') || lower.includes('booth')) type = 'reservations';
    else if (lower.includes('balance') || lower.includes('financial') || lower.includes('summary') || lower.includes('report')) type = 'financial';
    else if (lower.includes('activity') || lower.includes('today') || lower.includes('happened')) type = 'activity';
    else if (lower.includes('child') || lower.includes('hospital') || lower.includes('family') || lower.includes('project') || lower.includes('kid')) type = 'projects';
    else if (lower.includes('promo') || lower.includes('discount') || lower.includes('coupon') || lower.includes('code')) type = 'promos';

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

// ===== PROJECTS (Children/Families) =====

router.get('/admin/projects', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

router.post('/admin/projects', authenticateToken, async (req, res) => {
  try {
    const { child_name, hospital, condition, preferences, family_needs, notes, status } = req.body;
    const { data, error } = await supabase
      .from('projects')
      .insert({ child_name, hospital, condition, preferences, family_needs, notes, status: status || 'active' })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

router.put('/admin/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('projects')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

router.delete('/admin/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase.from('projects').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project.' });
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
