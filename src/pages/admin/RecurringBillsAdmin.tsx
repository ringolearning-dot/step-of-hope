import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { HiPlus, HiTrash, HiPencil, HiXMark, HiCheck, HiClock, HiExclamationTriangle, HiBanknotes } from 'react-icons/hi2';

interface Bill {
  id: number;
  title: string;
  description: string;
  amount: number;
  category_name: string;
  vendor: string;
  frequency: string;
  next_due_date: string;
  last_paid_date: string;
  status: string;
  notes: string;
}

interface BillStats {
  totalActive: number;
  totalMonthly: number;
  overdueCount: number;
  overdueBills: Bill[];
  dueSoonCount: number;
  dueSoonBills: Bill[];
  paidThisMonth: number;
}

interface Payment {
  id: number;
  amount: number;
  paid_date: string;
  status: string;
  notes: string;
}

const fmt = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export default function RecurringBillsAdmin() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [stats, setStats] = useState<BillStats | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [showPayments, setShowPayments] = useState<number | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPayForm, setShowPayForm] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', amount: '', category_id: '', category_name: '', vendor: '',
    frequency: 'monthly', next_due_date: '', notes: '',
  });

  const [payForm, setPayForm] = useState({ amount: '', paid_date: new Date().toISOString().split('T')[0], notes: '' });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [billsRes, statsRes, catRes] = await Promise.all([
        api.get('/recurring-bills/admin/all'),
        api.get('/recurring-bills/admin/stats'),
        api.get('/expenses/categories'),
      ]);
      setBills(billsRes.data);
      setStats(statsRes.data);
      setCategories(catRes.data);
    } catch { toast.error('Failed to load bills'); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = { ...form, amount: parseFloat(form.amount), category_id: form.category_id ? Number(form.category_id) : null };
      if (editId) {
        await api.put(`/recurring-bills/admin/${editId}`, payload);
        toast.success('Bill updated');
      } else {
        await api.post('/recurring-bills/admin', payload);
        toast.success('Bill created');
      }
      resetForm();
      fetchAll();
    } catch { toast.error('Failed to save bill'); }
  }

  async function handlePay(billId: number) {
    try {
      const payload = {
        amount: payForm.amount ? parseFloat(payForm.amount) : undefined,
        paid_date: payForm.paid_date,
        notes: payForm.notes,
      };
      await api.post(`/recurring-bills/admin/${billId}/pay`, payload);
      toast.success('Payment recorded');
      setShowPayForm(null);
      setPayForm({ amount: '', paid_date: new Date().toISOString().split('T')[0], notes: '' });
      fetchAll();
    } catch { toast.error('Failed to record payment'); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this recurring bill?')) return;
    try {
      await api.delete(`/recurring-bills/admin/${id}`);
      toast.success('Deleted');
      fetchAll();
    } catch { toast.error('Failed to delete'); }
  }

  async function handleStatusChange(id: number, status: string) {
    try {
      await api.put(`/recurring-bills/admin/${id}`, { status });
      toast.success(`Bill ${status}`);
      fetchAll();
    } catch { toast.error('Failed to update'); }
  }

  async function loadPayments(billId: number) {
    try {
      const res = await api.get(`/recurring-bills/admin/${billId}/payments`);
      setPayments(res.data);
      setShowPayments(billId);
    } catch { toast.error('Failed to load payments'); }
  }

  function startEdit(bill: Bill) {
    setEditId(bill.id);
    setForm({
      title: bill.title, description: bill.description || '', amount: (bill.amount / 100).toString(),
      category_id: '', category_name: bill.category_name || '', vendor: bill.vendor || '',
      frequency: bill.frequency, next_due_date: bill.next_due_date, notes: bill.notes || '',
    });
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false); setEditId(null);
    setForm({ title: '', description: '', amount: '', category_id: '', category_name: '', vendor: '', frequency: 'monthly', next_due_date: '', notes: '' });
  }

  function getStatusBadge(bill: Bill) {
    const today = new Date().toISOString().split('T')[0];
    if (bill.status !== 'active') return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{bill.status}</span>;
    if (bill.next_due_date < today) return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Overdue</span>;
    const weekFromNow = new Date(); weekFromNow.setDate(weekFromNow.getDate() + 7);
    if (bill.next_due_date <= weekFromNow.toISOString().split('T')[0]) return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">Due Soon</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">Active</span>;
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recurring Bills</h1>
          <p className="text-gray-500 text-sm mt-1">Manage recurring payments and subscriptions.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800">
          <HiPlus className="w-4 h-4" /> Add Bill
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center"><HiBanknotes className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-sm text-gray-500">Active Bills</p><p className="text-xl font-bold">{stats?.totalActive || 0}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center"><HiClock className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-sm text-gray-500">Monthly Total</p><p className="text-xl font-bold">{fmt(stats?.totalMonthly || 0)}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center"><HiExclamationTriangle className="w-5 h-5 text-red-600" /></div>
            <div><p className="text-sm text-gray-500">Overdue</p><p className="text-xl font-bold text-red-600">{stats?.overdueCount || 0}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center"><HiCheck className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-sm text-gray-500">Paid This Month</p><p className="text-xl font-bold">{fmt(stats?.paidThisMonth || 0)}</p></div>
          </div>
        </div>
      </div>

      {/* Overdue Alert */}
      {stats && stats.overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-medium text-red-800 flex items-center gap-2"><HiExclamationTriangle className="w-5 h-5" /> Overdue Bills ({stats.overdueCount})</h3>
          <div className="mt-2 space-y-1">
            {stats.overdueBills.map(b => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span className="text-red-700">{b.title} - {fmt(b.amount)} (due {b.next_due_date})</span>
                <button onClick={() => { setShowPayForm(b.id); setPayForm({ ...payForm, amount: (b.amount / 100).toString() }); }} className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Pay Now</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editId ? 'Edit Bill' : 'Add Recurring Bill'}</h2>
              <button onClick={resetForm}><HiXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) *</label>
                  <input type="number" step="0.01" min="0" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option>
                  </select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date *</label>
                <input type="date" required value={form.next_due_date} onChange={e => setForm({ ...form, next_due_date: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category_id} onChange={e => { const cat = categories.find((c: any) => c.id === Number(e.target.value)); setForm({ ...form, category_id: e.target.value, category_name: cat?.name || '' }); }} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select category</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <input type="text" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800">{editId ? 'Update' : 'Add Bill'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPayForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Record Payment</h2>
              <button onClick={() => setShowPayForm(null)}><HiXMark className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Leave blank for bill amount" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={payForm.paid_date} onChange={e => setPayForm({ ...payForm, paid_date: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input type="text" value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowPayForm(null)} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
                <button onClick={() => handlePay(showPayForm)} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Record Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPayments && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Payment History</h2>
              <button onClick={() => setShowPayments(null)}><HiXMark className="w-5 h-5" /></button>
            </div>
            {payments.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No payments recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-gray-500 uppercase border-b">
                  <th className="py-2">Date</th><th className="py-2">Amount</th><th className="py-2">Status</th><th className="py-2">Notes</th>
                </tr></thead>
                <tbody className="divide-y">
                  {payments.map(p => (
                    <tr key={p.id}><td className="py-2">{p.paid_date}</td><td className="py-2 font-medium">{fmt(p.amount)}</td>
                      <td className="py-2"><span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">{p.status}</span></td>
                      <td className="py-2 text-gray-500">{p.notes || '-'}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Bills Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b">
                <th className="px-5 py-3 font-medium">Bill</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Frequency</th>
                <th className="px-5 py-3 font-medium">Next Due</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bills.map(bill => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{bill.title}</p>
                    <p className="text-xs text-gray-500">{bill.vendor || bill.category_name || ''}</p>
                  </td>
                  <td className="px-5 py-3 font-medium">{fmt(bill.amount)}</td>
                  <td className="px-5 py-3 capitalize text-gray-600">{bill.frequency}</td>
                  <td className="px-5 py-3 text-gray-600">{bill.next_due_date}</td>
                  <td className="px-5 py-3">{getStatusBadge(bill)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setShowPayForm(bill.id); setPayForm({ ...payForm, amount: (bill.amount / 100).toString() }); }} className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100">Pay</button>
                      <button onClick={() => loadPayments(bill.id)} className="p-1.5 text-gray-400 hover:text-blue-600" title="History"><HiClock className="w-4 h-4" /></button>
                      <button onClick={() => startEdit(bill)} className="p-1.5 text-gray-400 hover:text-blue-600"><HiPencil className="w-4 h-4" /></button>
                      {bill.status === 'active' ? (
                        <button onClick={() => handleStatusChange(bill.id, 'paused')} className="p-1.5 text-gray-400 hover:text-yellow-600" title="Pause">||</button>
                      ) : bill.status === 'paused' ? (
                        <button onClick={() => handleStatusChange(bill.id, 'active')} className="p-1.5 text-gray-400 hover:text-emerald-600" title="Resume"><HiCheck className="w-4 h-4" /></button>
                      ) : null}
                      <button onClick={() => handleDelete(bill.id)} className="p-1.5 text-gray-400 hover:text-red-600"><HiTrash className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No recurring bills added yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
