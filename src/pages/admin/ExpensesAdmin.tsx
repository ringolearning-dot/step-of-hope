import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  HiPlus, HiTrash, HiPencil, HiArrowDownTray, HiMagnifyingGlass,
  HiXMark, HiArrowPath
} from 'react-icons/hi2';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid,
} from 'recharts';

interface Expense {
  id: number;
  title: string;
  description: string;
  amount: number;
  category_id: number;
  category_name: string;
  vendor: string;
  receipt_url: string;
  receipt_filename: string;
  date: string;
  added_by_name: string;
  notes: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
}

interface Stats {
  totalExpenses: number;
  monthExpenses: number;
  totalIncome: number;
  balance: number;
  byCategory: Record<string, number>;
  monthlyBreakdown: { month: string; total: number }[];
  totalCount: number;
}

const fmt = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#84CC16', '#14B8A6', '#6B7280'];

export default function ExpensesAdmin() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [form, setForm] = useState({
    title: '', description: '', amount: '', category_id: '', category_name: '', vendor: '', date: new Date().toISOString().split('T')[0], notes: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => { fetchAll(); }, [page, filterCategory, search]);

  async function fetchAll() {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '30' });
      if (filterCategory) params.append('category', filterCategory);
      if (search) params.append('search', search);

      const [expRes, catRes, statsRes] = await Promise.all([
        api.get(`/expenses/admin/all?${params}`),
        api.get('/expenses/categories'),
        api.get('/expenses/admin/stats'),
      ]);
      setExpenses(expRes.data.expenses);
      setTotalPages(expRes.data.totalPages);
      setCategories(catRes.data);
      setStats(statsRes.data);
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = { ...form, amount: parseFloat(form.amount), category_id: form.category_id ? Number(form.category_id) : null };
      let expenseId = editId;
      if (editId) {
        await api.put(`/expenses/admin/${editId}`, payload);
        toast.success('Expense updated');
      } else {
        const res = await api.post('/expenses/admin', payload);
        expenseId = res.data.id;
        toast.success('Expense added');
      }
      if (receiptFile && expenseId) {
        const fd = new FormData();
        fd.append('receipt', receiptFile);
        await api.post(`/expenses/admin/${expenseId}/receipt`, fd);
      }
      resetForm();
      fetchAll();
    } catch { toast.error('Failed to save expense'); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/admin/${id}`);
      toast.success('Deleted');
      fetchAll();
    } catch { toast.error('Failed to delete'); }
  }

  async function handleReceiptUpload(id: number, file: File) {
    const fd = new FormData();
    fd.append('receipt', file);
    try {
      await api.post(`/expenses/admin/${id}/receipt`, fd);
      toast.success('Receipt uploaded');
      fetchAll();
    } catch { toast.error('Failed to upload receipt'); }
  }

  function startEdit(exp: Expense) {
    setEditId(exp.id);
    setForm({
      title: exp.title, description: exp.description || '', amount: (exp.amount / 100).toString(),
      category_id: exp.category_id?.toString() || '', category_name: exp.category_name || '',
      vendor: exp.vendor || '', date: exp.date, notes: exp.notes || '',
    });
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false); setEditId(null); setReceiptFile(null);
    setForm({ title: '', description: '', amount: '', category_id: '', category_name: '', vendor: '', date: new Date().toISOString().split('T')[0], notes: '' });
  }

  async function exportCSV() {
    try {
      const res = await api.get('/expenses/admin/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'expenses-export.csv'; a.click();
    } catch { toast.error('Export failed'); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full" /></div>;

  const pieData = stats ? Object.entries(stats.byCategory).map(([name, value]) => ({ name, value: value / 100 })) : [];
  const barData = (stats?.monthlyBreakdown || []).map(m => ({ month: m.month, amount: m.total / 100 }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage all foundation expenses.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <HiArrowDownTray className="w-4 h-4" /> Export
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800">
            <HiPlus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(stats?.totalExpenses || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(stats?.monthExpenses || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Income</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(stats?.totalIncome || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Current Balance</p>
          <p className={`text-2xl font-bold mt-1 ${(stats?.balance || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(stats?.balance || 0)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pieData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Expenses by Category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {barData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Monthly Expenses</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                  <Bar dataKey="amount" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editId ? 'Edit Expense' : 'Add Expense'}</h2>
              <button onClick={resetForm}><HiXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) *</label>
                  <input type="number" step="0.01" min="0" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category_id} onChange={e => { const cat = categories.find(c => c.id === Number(e.target.value)); setForm({ ...form, category_id: e.target.value, category_name: cat?.name || '' }); }} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <input type="text" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt</label>
                <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-lg px-3 py-4 text-sm cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition">
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
                  {receiptFile ? (
                    <span className="text-gray-700 truncate">{receiptFile.name}</span>
                  ) : (
                    <span className="text-gray-400">Click to upload receipt (image or PDF)</span>
                  )}
                </label>
                {receiptFile && (
                  <button type="button" onClick={() => setReceiptFile(null)} className="text-xs text-red-500 hover:underline mt-1">Remove</button>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800">{editId ? 'Update' : 'Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search expenses..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
        </div>
        <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => { setSearch(''); setFilterCategory(''); setPage(1); }} className="p-2 text-gray-400 hover:text-gray-600"><HiArrowPath className="w-4 h-4" /></button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Vendor</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Receipt</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{exp.date}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{exp.title}</td>
                  <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">{exp.category_name || '-'}</span></td>
                  <td className="px-5 py-3 text-gray-600">{exp.vendor || '-'}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{fmt(exp.amount)}</td>
                  <td className="px-5 py-3">
                    {exp.receipt_url ? (
                      <a href={exp.receipt_url} target="_blank" rel="noopener" className="text-blue-600 hover:underline text-xs">View</a>
                    ) : (
                      <label className="text-xs text-gray-400 hover:text-blue-600 cursor-pointer">
                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => e.target.files?.[0] && handleReceiptUpload(exp.id, e.target.files[0])} />
                        Upload
                      </label>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(exp)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><HiPencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(exp.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><HiTrash className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No expenses found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
