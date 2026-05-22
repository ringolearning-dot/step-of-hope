import { Router } from 'express';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get all recurring bills
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const { status, frequency } = req.query;

    let query = supabase
      .from('recurring_bills')
      .select('*')
      .order('next_due_date', { ascending: true });

    if (status) query = query.eq('status', status);
    if (frequency) query = query.eq('frequency', frequency);

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recurring bills.' });
  }
});

// Get bill stats
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    const { data: bills } = await supabase
      .from('recurring_bills')
      .select('*')
      .eq('status', 'active');

    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const weekStr = weekFromNow.toISOString().split('T')[0];

    const activeBills = bills || [];
    const totalMonthly = activeBills
      .filter(b => b.frequency === 'monthly')
      .reduce((sum, b) => sum + b.amount, 0);

    const overdue = activeBills.filter(b => b.next_due_date < today);
    const dueSoon = activeBills.filter(b => b.next_due_date >= today && b.next_due_date <= weekStr);

    // Get total paid this month
    const monthStart = new Date();
    monthStart.setDate(1);
    const { data: payments } = await supabase
      .from('bill_payments')
      .select('amount')
      .gte('paid_date', monthStart.toISOString().split('T')[0])
      .eq('status', 'paid');

    const paidThisMonth = (payments || []).reduce((sum, p) => sum + p.amount, 0);

    res.json({
      totalActive: activeBills.length,
      totalMonthly,
      overdueCount: overdue.length,
      overdueBills: overdue,
      dueSoonCount: dueSoon.length,
      dueSoonBills: dueSoon,
      paidThisMonth,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bill stats.' });
  }
});

// Create a recurring bill
router.post('/admin', authenticateToken, async (req, res) => {
  try {
    const { title, description, amount, category_id, category_name, vendor, frequency, due_day, next_due_date, notes } = req.body;

    if (!title || !amount || !next_due_date) {
      return res.status(400).json({ error: 'Title, amount, and next due date are required.' });
    }

    const { data, error } = await supabase
      .from('recurring_bills')
      .insert({
        title,
        description,
        amount: Math.round(amount * 100),
        category_id: category_id || null,
        category_name: category_name || null,
        vendor,
        frequency: frequency || 'monthly',
        due_day: due_day || null,
        next_due_date,
        notes,
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Create bill error:', err.message);
    res.status(500).json({ error: 'Failed to create recurring bill.' });
  }
});

// Update a recurring bill
router.put('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, amount, category_id, category_name, vendor, frequency, due_day, next_due_date, status, notes } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (amount !== undefined) updates.amount = Math.round(amount * 100);
    if (category_id !== undefined) updates.category_id = category_id;
    if (category_name !== undefined) updates.category_name = category_name;
    if (vendor !== undefined) updates.vendor = vendor;
    if (frequency !== undefined) updates.frequency = frequency;
    if (due_day !== undefined) updates.due_day = due_day;
    if (next_due_date !== undefined) updates.next_due_date = next_due_date;
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from('recurring_bills')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update recurring bill.' });
  }
});

// Delete a recurring bill
router.delete('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('recurring_bills')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete recurring bill.' });
  }
});

// Record a payment for a bill
router.post('/admin/:id/pay', authenticateToken, async (req, res) => {
  try {
    const { amount, paid_date, notes } = req.body;
    const billId = req.params.id;

    // Get the bill
    const { data: bill, error: billError } = await supabase
      .from('recurring_bills')
      .select('*')
      .eq('id', billId)
      .single();

    if (billError || !bill) return res.status(404).json({ error: 'Bill not found.' });

    const paymentAmount = amount ? Math.round(amount * 100) : bill.amount;

    // Record the payment
    const { data: payment, error: payError } = await supabase
      .from('bill_payments')
      .insert({
        bill_id: billId,
        amount: paymentAmount,
        paid_date: paid_date || new Date().toISOString().split('T')[0],
        status: 'paid',
        notes,
        recorded_by: req.admin.id,
      })
      .select()
      .single();

    if (payError) throw payError;

    // Calculate next due date
    let nextDue = new Date(bill.next_due_date);
    switch (bill.frequency) {
      case 'weekly':
        nextDue.setDate(nextDue.getDate() + 7);
        break;
      case 'monthly':
        nextDue.setMonth(nextDue.getMonth() + 1);
        break;
      case 'quarterly':
        nextDue.setMonth(nextDue.getMonth() + 3);
        break;
      case 'yearly':
        nextDue.setFullYear(nextDue.getFullYear() + 1);
        break;
    }

    // Update the bill with next due date
    await supabase
      .from('recurring_bills')
      .update({
        next_due_date: nextDue.toISOString().split('T')[0],
        last_paid_date: paid_date || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', billId);

    // Also record as an expense
    await supabase.from('expenses').insert({
      title: `${bill.title} (Recurring)`,
      description: bill.description,
      amount: paymentAmount,
      category_id: bill.category_id,
      category_name: bill.category_name,
      vendor: bill.vendor,
      date: paid_date || new Date().toISOString().split('T')[0],
      notes: `Auto-recorded from recurring bill payment`,
      added_by: req.admin.id,
      added_by_name: req.admin.name,
    });

    res.json(payment);
  } catch (err) {
    console.error('Record payment error:', err.message);
    res.status(500).json({ error: 'Failed to record payment.' });
  }
});

// Get payment history for a bill
router.get('/admin/:id/payments', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bill_payments')
      .select('*')
      .eq('bill_id', req.params.id)
      .order('paid_date', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment history.' });
  }
});

export default router;
