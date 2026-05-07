import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { HiCurrencyDollar, HiCheckCircle, HiClock, HiArrowDownTray } from 'react-icons/hi2';

interface Donation {
  id: number;
  donorName: string;
  donor_name?: string;
  email: string;
  amount: number;
  status: string;
  isMonthly: boolean;
  is_monthly?: boolean;
  createdAt: string;
  created_at?: string;
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

const PAGE_SIZE = 20;

export default function DonationsAdmin() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState({ total: 0, completed: 0, pending: 0 });

  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/donations/admin/all');
        const data: Donation[] = res.data;
        setDonations(data);

        const totalAmount = data.reduce((sum, d) => sum + d.amount, 0);
        const completedAmount = data
          .filter((d) => d.status === 'completed')
          .reduce((sum, d) => sum + d.amount, 0);
        const pendingAmount = data
          .filter((d) => d.status === 'pending')
          .reduce((sum, d) => sum + d.amount, 0);

        setSummary({
          total: totalAmount,
          completed: completedAmount,
          pending: pendingAmount,
        });
      } catch (err: any) {
        setError('Failed to load donations.');
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, []);

  const filtered =
    statusFilter === 'all'
      ? donations
      : donations.filter((d) => d.status === statusFilter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = async () => {
    try {
      const res = await api.get('/donations/admin/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'donations-export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export donations.');
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-emerald-50 text-emerald-700',
      pending: 'bg-yellow-50 text-yellow-700',
      expired: 'bg-red-50 text-red-700',
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          styles[status] || 'bg-gray-50 text-gray-700'
        }`}
      >
        {status}
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
      label: 'Total',
      value: formatCents(summary.total),
      icon: HiCurrencyDollar,
      color: 'bg-slate-50 text-slate-600',
    },
    {
      label: 'Completed',
      value: formatCents(summary.completed),
      icon: HiCheckCircle,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Pending',
      value: formatCents(summary.pending),
      icon: HiClock,
      color: 'bg-yellow-50 text-yellow-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donations</h1>
          <p className="text-gray-500 text-sm mt-1">
            {donations.length} total donation{donations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200
                     rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <HiArrowDownTray className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-500">Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
        >
          <option value="all">All</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="expired">Expired</option>
        </select>
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
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Donor Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Monthly</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                    {formatDate(d.createdAt || d.created_at || '')}
                  </td>
                  <td className="px-5 py-3 text-gray-900 font-medium whitespace-nowrap">
                    {d.donorName || d.donor_name || 'Anonymous'}
                  </td>
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{d.email || '-'}</td>
                  <td className="px-5 py-3 text-gray-900 font-medium whitespace-nowrap">
                    {formatCents(d.amount)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">{statusBadge(d.status)}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      className={`text-xs font-medium ${
                        d.isMonthly || d.is_monthly ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    >
                      {d.isMonthly || d.is_monthly ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    No donations found.
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
