import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { HiPlus, HiTrash, HiCheckCircle, HiXCircle } from 'react-icons/hi2';

interface PromoCode {
  id: number;
  code: string;
  discount: number;
  used: boolean;
  used_at: string | null;
  used_by: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function PromoCodesAdmin() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('35.5');
  const [newExpiry, setNewExpiry] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCodes = async () => {
    try {
      const res = await api.get('/reservations/admin/promo-codes');
      setCodes(res.data.promoCodes || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCodes(); }, []);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'SOH-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setNewCode(code);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newDiscount) return;
    setCreating(true);
    try {
      await api.post('/reservations/admin/promo-codes', {
        code: newCode.trim(),
        discount: parseFloat(newDiscount),
        expiresAt: newExpiry || null,
      });
      setNewCode('');
      setNewExpiry('');
      setShowForm(false);
      fetchCodes();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create promo code.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this promo code?')) return;
    try {
      await api.delete(`/reservations/admin/promo-codes/${id}`);
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert('Failed to delete promo code.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create one-time use promo codes for reservation discounts.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (!newCode) generateCode(); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white
                     rounded-lg text-sm font-medium hover:bg-slate-700 transition"
        >
          <HiPlus className="w-4 h-4" />
          Create Code
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                  placeholder="PROMO-CODE"
                  required
                />
                <button
                  type="button"
                  onClick={generateCode}
                  className="px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Generate
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="100"
                value={newDiscount}
                onChange={(e) => setNewDiscount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires (optional)</label>
              <input
                type="date"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition"
            >
              {creating ? 'Creating...' : 'Create Promo Code'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Discount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Used By</th>
                <th className="px-5 py-3 font-medium">Expires</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-mono font-bold text-gray-900">{code.code}</td>
                  <td className="px-5 py-3 text-gray-900">{code.discount}%</td>
                  <td className="px-5 py-3">
                    {code.used ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                        <HiXCircle className="w-3.5 h-3.5" /> Used
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <HiCheckCircle className="w-3.5 h-3.5" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{code.used_by || '-'}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {new Date(code.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleDelete(code.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {codes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    No promo codes created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
