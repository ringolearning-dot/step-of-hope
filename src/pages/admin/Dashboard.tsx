import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';
import {
  HiCurrencyDollar, HiCalendarDays, HiArrowTrendingUp, HiUsers,
  HiBanknotes, HiExclamationTriangle, HiSparkles, HiBell, HiReceiptPercent,
} from 'react-icons/hi2';

const fmt = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function Dashboard() {
  const [donationStats, setDonationStats] = useState<any>(null);
  const [expenseStats, setExpenseStats] = useState<any>(null);
  const [billStats, setBillStats] = useState<any>(null);
  const [volunteerStats, setVolunteerStats] = useState<any>(null);
  const [reservationStats, setReservationStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const results = await Promise.allSettled([
          api.get('/donations/admin/stats'),
          api.get('/expenses/admin/stats'),
          api.get('/recurring-bills/admin/stats'),
          api.get('/volunteer-applications/admin-stats/overview'),
          api.get('/reservations/admin/stats'),
          api.get('/activity-logs/admin/recent'),
          api.get('/notifications/admin/unread-count'),
        ]);

        if (results[0].status === 'fulfilled') setDonationStats(results[0].value.data);
        if (results[1].status === 'fulfilled') setExpenseStats(results[1].value.data);
        if (results[2].status === 'fulfilled') setBillStats(results[2].value.data);
        if (results[3].status === 'fulfilled') setVolunteerStats(results[3].value.data);
        if (results[4].status === 'fulfilled') setReservationStats(results[4].value.data);
        if (results[5].status === 'fulfilled') setRecentActivity(results[5].value.data);
        if (results[6].status === 'fulfilled') setUnreadNotifications(results[6].value.data.count);
      } catch {}
      finally { setLoading(false); }
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full" />
      </div>
    );
  }

  const totalRaised = (donationStats?.totalRaised || 0) + (reservationStats?.totalRevenue || 0);
  const balance = totalRaised - (expenseStats?.totalExpenses || 0);
  const chartData = (donationStats?.monthlyBreakdown || []).map((item: any) => ({
    month: item.month,
    donations: item.total / 100,
  }));
  const expenseChartData = (expenseStats?.monthlyBreakdown || []).map((item: any) => ({
    month: item.month,
    expenses: item.total / 100,
  }));

  // Merge donation + expense data for combined chart
  const combinedData = chartData.map((d: any) => {
    const exp = expenseChartData.find((e: any) => e.month === d.month);
    return { ...d, expenses: exp?.expenses || 0 };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of your foundation's activity.</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadNotifications > 0 && (
            <Link to="/admin/notifications" className="relative p-2 text-gray-500 hover:text-gray-700 bg-white border rounded-lg">
              <HiBell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{unreadNotifications}</span>
            </Link>
          )}
          <Link to="/admin/ai-assistant" className="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90">
            <HiSparkles className="w-4 h-4" /> AI Assistant
          </Link>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Total Raised</span>
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center"><HiCurrencyDollar className="w-5 h-5 text-emerald-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(totalRaised)}</p>
          <p className="text-xs text-gray-500 mt-1">{fmt(reservationStats?.totalRevenue || 0)} from reservations</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Total Expenses</span>
            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center"><HiReceiptPercent className="w-5 h-5 text-red-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(expenseStats?.totalExpenses || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">{fmt(expenseStats?.monthExpenses || 0)} this month</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Current Balance</span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <HiBanknotes className={`w-5 h-5 ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{fmt(balance)}</p>
          <p className="text-xs text-gray-500 mt-1">Income - Expenses</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Monthly Donors</span>
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center"><HiUsers className="w-5 h-5 text-purple-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{donationStats?.monthlyDonors || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Recurring supporters</p>
        </div>
      </div>

      {/* Second Row - Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/reservations" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center"><HiCalendarDays className="w-5 h-5 text-indigo-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Reservations</p>
              <p className="text-lg font-bold">{reservationStats?.total || 0}<span className="text-sm font-normal text-gray-400 ml-1">({reservationStats?.upcoming || 0} upcoming)</span></p>
            </div>
          </div>
        </Link>

        <Link to="/admin/volunteers" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-cyan-50 rounded-lg flex items-center justify-center"><HiUsers className="w-5 h-5 text-cyan-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Volunteers</p>
              <p className="text-lg font-bold">{volunteerStats?.total || volunteerStats?.pending || 0}</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/recurring-bills" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${(billStats?.overdueCount || 0) > 0 ? 'bg-red-50' : 'bg-amber-50'}`}>
              {(billStats?.overdueCount || 0) > 0 ? <HiExclamationTriangle className="w-5 h-5 text-red-600" /> : <HiArrowTrendingUp className="w-5 h-5 text-amber-600" />}
            </div>
            <div>
              <p className="text-sm text-gray-500">Bills</p>
              <p className="text-lg font-bold">{billStats?.totalActive || 0}
                {(billStats?.overdueCount || 0) > 0 && <span className="text-sm font-normal text-red-500 ml-1">({billStats.overdueCount} overdue)</span>}
              </p>
            </div>
          </div>
        </Link>

        <Link to="/admin/reports" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center"><HiArrowTrendingUp className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-lg font-bold">{fmt(totalRaised)}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Overdue Bills Alert */}
      {billStats && billStats.overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HiExclamationTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800 font-medium">{billStats.overdueCount} overdue bill{billStats.overdueCount > 1 ? 's' : ''} require attention</p>
          </div>
          <Link to="/admin/recurring-bills" className="text-sm text-red-700 hover:text-red-800 font-medium">View &rarr;</Link>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {combinedData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Income vs Expenses (Monthly)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(2)}`]} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="donations" name="Donations" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Donations */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Recent Donations</h3>
            <Link to="/admin/donations" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Donor</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(donationStats?.recentDonations || []).slice(0, 7).map((d: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 text-gray-500 text-xs">{fmtDate(d.created_at)}</td>
                    <td className="px-5 py-2.5 font-medium text-gray-900">{d.donor_name || 'Anonymous'}</td>
                    <td className="px-5 py-2.5 font-medium text-emerald-600">{fmt(d.amount)}</td>
                  </tr>
                ))}
                {(!donationStats?.recentDonations || donationStats.recentDonations.length === 0) && (
                  <tr><td colSpan={3} className="px-5 py-6 text-center text-gray-400">No donations yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Recent Activity</h3>
            <Link to="/admin/activity-logs" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActivity.slice(0, 8).map((log: any) => (
              <div key={log.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-700">{log.admin_name || 'System'}</span>
                  <span className="text-gray-500">{log.action}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{log.entity_type}</span>
                </div>
                <span className="text-xs text-gray-400">{fmtDate(log.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
