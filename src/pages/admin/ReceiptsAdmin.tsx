import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { HiDocumentText, HiEnvelope, HiCheckCircle, HiFunnel } from 'react-icons/hi2';
import toast from 'react-hot-toast';

interface Receipt {
  id: string;
  receipt_number: string;
  type: 'donation' | 'reservation';
  name: string;
  email: string;
  amount: number;
  description: string;
  created_at: string;
  receipt_sent: boolean;
  source_id: number | string;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const PAGE_SIZE = 25;

export default function ReceiptsAdmin() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipts = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/receipts/admin/all', { params: { limit: 1000 } });
        setReceipts(res.data.receipts || []);
      } catch {
        setError('Failed to load receipts.');
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, []);

  const handleSendReceipt = async (receipt: Receipt) => {
    if (!receipt.email) {
      toast.error('No email address on file.');
      return;
    }
    setSending(receipt.id);
    try {
      if (receipt.type === 'donation') {
        await api.post(`/donations/admin/${receipt.source_id}/send-receipt`);
      } else {
        await api.post(`/reservations/admin/${receipt.source_id}/send-receipt`);
      }
      toast.success(`Receipt sent to ${receipt.email}`);
      setReceipts((prev) =>
        prev.map((r) => (r.id === receipt.id ? { ...r, receipt_sent: true } : r))
      );
    } catch {
      toast.error('Failed to send receipt.');
    } finally {
      setSending(null);
    }
  };

  const filtered = receipts.filter((r) => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.receipt_number.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalAmount = filtered.reduce((sum, r) => sum + r.amount, 0);
  const donationCount = receipts.filter((r) => r.type === 'donation').length;
  const reservationCount = receipts.filter((r) => r.type === 'reservation').length;

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      donation: 'bg-emerald-50 text-emerald-700',
      reservation: 'bg-blue-50 text-blue-700',
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          styles[type] || 'bg-gray-50 text-gray-700'
        }`}
      >
        {type === 'donation' ? 'Donation' : 'Reservation'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error}</div>
    );
  }

  const summaryCards = [
    {
      label: 'Total Receipts',
      value: receipts.length.toString(),
      icon: HiDocumentText,
      color: 'bg-slate-50 text-slate-600',
    },
    {
      label: 'Donations',
      value: donationCount.toString(),
      icon: HiCheckCircle,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Reservations',
      value: reservationCount.toString(),
      icon: HiCheckCircle,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Amount',
      value: formatCents(totalAmount),
      icon: HiDocumentText,
      color: 'bg-yellow-50 text-yellow-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Receipts</h1>
        <p className="text-gray-500 text-sm mt-1">
          All transaction receipts for donations and reservations
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <HiFunnel className="w-4 h-4 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700
                       focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="donation">Donations</option>
            <option value="reservation">Reservations</option>
          </select>
        </div>
        <input
          type="text"
          placeholder="Search name, email, or receipt #..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 w-full sm:w-72
                     focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
        />
        <span className="text-xs text-gray-400">
          Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-5 py-3 font-medium">Receipt #</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 text-gray-900 font-mono text-xs whitespace-nowrap">
                    {r.receipt_number}
                  </td>
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">{typeBadge(r.type)}</td>
                  <td className="px-5 py-3 text-gray-900 font-medium whitespace-nowrap">
                    {r.name}
                  </td>
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                    {r.email || '-'}
                  </td>
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                    {r.description}
                  </td>
                  <td className="px-5 py-3 text-gray-900 font-medium whitespace-nowrap">
                    {formatCents(r.amount)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <button
                      onClick={() => handleSendReceipt(r)}
                      disabled={sending === r.id || !r.email}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                                 bg-slate-800 text-white rounded-lg hover:bg-slate-700
                                 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      title={!r.email ? 'No email on file' : 'Send receipt email'}
                    >
                      <HiEnvelope className="w-3.5 h-3.5" />
                      {sending === r.id ? 'Sending...' : 'Send'}
                    </button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                    No receipts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs font-medium border border-gray-300 rounded-md
                           text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs font-medium border border-gray-300 rounded-md
                           text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
