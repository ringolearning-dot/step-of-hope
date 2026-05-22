import { Router } from 'express';
import multer from 'multer';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ===== CATEGORIES =====

// Get all expense categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// Add a new category
router.post('/categories', authenticateToken, async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required.' });

    const { data, error } = await supabase
      .from('expense_categories')
      .insert({ name, color: color || '#6B7280', icon: icon || 'receipt' })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category.' });
  }
});

// Delete a category
router.delete('/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

// ===== EXPENSES =====

// Get all expenses (paginated, filterable)
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, category, startDate, endDate, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('expenses')
      .select('*', { count: 'exact' });

    if (category) query = query.eq('category_id', category);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (search) query = query.or(`title.ilike.%${search}%,vendor.ilike.%${search}%,description.ilike.%${search}%`);

    query = query
      .order('date', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({
      expenses: data || [],
      total: count || 0,
      page: Number(page),
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error('Fetch expenses error:', err.message);
    res.status(500).json({ error: 'Failed to fetch expenses.' });
  }
});

// Get expense stats
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    // Total expenses
    const { data: allExpenses } = await supabase
      .from('expenses')
      .select('amount, category_name, date');

    const totalExpenses = (allExpenses || []).reduce((sum, e) => sum + e.amount, 0);

    // This month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthExpenses = (allExpenses || [])
      .filter(e => new Date(e.date) >= monthStart)
      .reduce((sum, e) => sum + e.amount, 0);

    // By category
    const byCategory = {};
    (allExpenses || []).forEach(e => {
      const cat = e.category_name || 'Uncategorized';
      byCategory[cat] = (byCategory[cat] || 0) + e.amount;
    });

    // Monthly breakdown (last 12 months)
    const monthlyMap = {};
    (allExpenses || []).forEach(e => {
      const month = e.date.substring(0, 7);
      monthlyMap[month] = (monthlyMap[month] || 0) + e.amount;
    });
    const monthlyBreakdown = Object.entries(monthlyMap)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);

    // Total donations for balance calculation
    const { data: donationStats } = await supabase
      .from('donation_stats')
      .select('total_raised')
      .limit(1)
      .single();

    const totalIncome = donationStats?.total_raised || 0;
    const balance = totalIncome - totalExpenses;

    res.json({
      totalExpenses,
      monthExpenses,
      totalIncome,
      balance,
      byCategory,
      monthlyBreakdown,
      totalCount: (allExpenses || []).length,
    });
  } catch (err) {
    console.error('Expense stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch expense stats.' });
  }
});

// Create an expense
router.post('/admin', authenticateToken, async (req, res) => {
  try {
    const { title, description, amount, category_id, category_name, vendor, date, notes } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ error: 'Title and amount are required.' });
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        title,
        description,
        amount: Math.round(amount * 100), // Convert to cents
        category_id: category_id || null,
        category_name: category_name || null,
        vendor,
        date: date || new Date().toISOString().split('T')[0],
        notes,
        added_by: req.admin.id,
        added_by_name: req.admin.name,
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Create expense error:', err.message);
    res.status(500).json({ error: 'Failed to create expense.' });
  }
});

// Update an expense
router.put('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, amount, category_id, category_name, vendor, date, notes } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (amount !== undefined) updates.amount = Math.round(amount * 100);
    if (category_id !== undefined) updates.category_id = category_id;
    if (category_name !== undefined) updates.category_name = category_name;
    if (vendor !== undefined) updates.vendor = vendor;
    if (date !== undefined) updates.date = date;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update expense.' });
  }
});

// Delete an expense
router.delete('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense.' });
  }
});

// Upload receipt for expense
router.post('/admin/:id/receipt', authenticateToken, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const filename = `receipts/${Date.now()}_${req.file.originalname}`;
    const { error: uploadError } = await supabase.storage
      .from('site-images')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('site-images')
      .getPublicUrl(filename);

    const { data, error } = await supabase
      .from('expenses')
      .update({
        receipt_url: urlData.publicUrl,
        receipt_filename: req.file.originalname,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Receipt upload error:', err.message);
    res.status(500).json({ error: 'Failed to upload receipt.' });
  }
});

// Export expenses as CSV
router.get('/admin/export', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) throw error;

    const csv = [
      'ID,Title,Description,Amount,Category,Vendor,Date,Added By,Notes',
      ...(data || []).map(e =>
        `${e.id},"${e.title || ''}","${e.description || ''}",${(e.amount / 100).toFixed(2)},"${e.category_name || ''}","${e.vendor || ''}","${e.date}","${e.added_by_name || ''}","${e.notes || ''}"`
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses-export.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export expenses.' });
  }
});

export default router;
