import { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { HiCurrencyDollar, HiCalendarDays, HiArrowTrendingUp, HiUsers } from 'react-icons/hi2';

interface DonationStats {
  totalRaised: number;
  todayCount: number;
  todayAmount: number;
  monthCount: number;
  monthAmount: number;
  monthlyDonors: number;
  recentDonations: any[];
  monthlyBreakdown: { month: string; amount: number }[];
}

interface VolunteerStats {
  total: number;
  thisMonth: number;
}

interface ContactStats {
  total: number;
  unread: number;
}

interface ReservationStats {
  total: number;
  totalRevenue: number;
  upcoming: number;
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

export default function Dashboard() {
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [volunteerStats, setVolunteerStats] = useState<VolunteerStats | null>(null);
  const [contactStats, setContactStats] = useState<ContactStats | null>(null);
  const [reservationStats, setReservationStats] = useState<ReservationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [donRes, volRes, conRes, resRes] = await Promise.all([
          api.get('/donations/admin/stats'),
          api.get('/volunteers/admin/stats').catch(() => ({ data: null })),
          api.get('/contacts/admin/stats').catch(() => ({ data: null })),
          api.get('/reservations/admin/stats').catch(() => ({ data: null })),
        ]);
        setStats(donRes.data);
        setVolunteerStats(volRes.data);
        setContactStats(conRes.data);
        setReservationStats(resRes.data);
      } catch (err: any) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        {error}
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Raised',
      value: formatCents(stats?.totalRaised || 0),
      icon: HiCurrencyDollar,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: "Today's Donations",
      value: stats?.todayCount?.toString() || '0',
      subtext: formatCents(stats?.todayAmount || 0),
      icon: HiCalendarDays,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'This Month',
      value: stats?.monthCount?.toString() || '0',
      subtext: formatCents(stats?.monthAmount || 0),
      icon: HiArrowTrendingUp,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Monthly Donors',
      value: stats?.monthlyDonors?.toString() || '0',
      icon: HiUsers,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  const chartData = (stats?.monthlyBreakdown || []).map((item) => ({
    month: item.month,
    amount: item.amount / 100,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your foundation's activity.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{card.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            {card.subtext && (
              <p className="text-sm text-gray-500 mt-0.5">{card.subtext}</p>
            )}
          </div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {volunteerStats && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Volunteers</h3>
            <div className="flex items-baseline gap-4">
              <div>
                <p className="text-xl font-bold text-gray-900">{volunteerStats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{volunteerStats.thisMonth}</p>
                <p className="text-xs text-gray-500">This Month</p>
              </div>
            </div>
          </div>
        )}
        {contactStats && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Messages</h3>
            <div className="flex items-baseline gap-4">
              <div>
                <p className="text-xl font-bold text-gray-900">{contactStats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-600">{contactStats.unread}</p>
                <p className="text-xs text-gray-500">Unread</p>
              </div>
            </div>
          </div>
        )}
        {reservationStats && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Reservations</h3>
            <div className="flex items-baseline gap-4">
              <div>
                <p className="text-xl font-bold text-gray-900">{reservationStats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div>
                <p className="text-xl font-bold text-blue-600">{reservationStats.upcoming}</p>
                <p className="text-xs text-gray-500">Upcoming</p>
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-600">{formatCents(reservationStats.totalRevenue)}</p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Monthly Donations</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="amount" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Donations */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Recent Donations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Donor</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(stats?.recentDonations || []).slice(0, 10).map((d: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                    {formatDate(d.createdAt || d.created_at)}
                  </td>
                  <td className="px-5 py-3 text-gray-900 font-medium whitespace-nowrap">
                    {d.donorName || d.donor_name || 'Anonymous'}
                  </td>
                  <td className="px-5 py-3 text-gray-900 font-medium whitespace-nowrap">
                    {formatCents(d.amount)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        d.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : d.status === 'pending'
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats?.recentDonations || stats.recentDonations.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                    No donations yet.
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
