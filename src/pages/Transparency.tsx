import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  HiCurrencyDollar, HiHeart, HiCalendarDays, HiBanknotes, HiReceiptPercent,
  HiShieldCheck, HiEye,
} from 'react-icons/hi2';

const fmt = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

const fmtShort = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cents / 100);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'];

export default function Transparency() {
  const [stats, setStats] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'donations' | 'expenses'>('donations');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/transparency/stats'),
      api.get('/transparency/donations'),
      api.get('/transparency/expenses'),
    ])
      .then(([statsRes, donationsRes, expensesRes]) => {
        setStats(statsRes.data);
        setDonations(donationsRes.data);
        setExpenses(expensesRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Build category breakdown for pie chart
  const categoryMap: Record<string, number> = {};
  expenses.forEach(e => {
    const cat = e.category || 'General';
    categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
  });
  const pieData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value: value / 100 }))
    .sort((a, b) => b.value - a.value);

  // Monthly breakdown for bar chart
  const monthlyMap: Record<string, { donations: number; expenses: number }> = {};
  donations.forEach(d => {
    const month = d.date.substring(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { donations: 0, expenses: 0 };
    monthlyMap[month].donations += d.amount / 100;
  });
  expenses.forEach(e => {
    const month = e.date.substring(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { donations: 0, expenses: 0 };
    monthlyMap[month].expenses += e.amount / 100;
  });
  const barData = Object.entries(monthlyMap)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-warm">
        <div className="animate-spin w-10 h-10 border-4 border-hope/20 border-t-hope rounded-full" />
      </div>
    );
  }

  const statCards = [
    { icon: HiCurrencyDollar, label: 'Lifetime Donations Raised', value: fmtShort(stats?.totalRaised || 0), color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-200' },
    { icon: HiReceiptPercent, label: 'Total Expenses', value: fmtShort(stats?.totalExpenses || 0), color: 'bg-red-50 text-red-600', border: 'border-red-200' },
    { icon: HiBanknotes, label: 'Current Available Funds', value: fmtShort(stats?.availableFunds || 0), color: 'bg-blue-50 text-blue-600', border: 'border-blue-200' },
    { icon: HiHeart, label: 'Children Helped', value: `${stats?.childrenHelped || 0}+`, color: 'bg-pink-50 text-pink-600', border: 'border-pink-200' },
    { icon: HiCalendarDays, label: 'Events Organized', value: `${stats?.eventsOrganized || 0}`, color: 'bg-amber-50 text-amber-600', border: 'border-amber-200' },
  ];

  return (
    <div className="min-h-screen bg-bg-warm pt-36">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-navy via-navy-soft to-hope-dark text-white py-16 sm:py-20 -mt-36 pt-48">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
            <HiShieldCheck className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-white/90">Full Financial Transparency</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Where Your Money Goes
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            We believe in complete transparency. Every dollar donated is tracked and reported
            so you can see exactly how your generosity helps children in need.
          </p>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="max-w-6xl mx-auto px-4 -mt-10 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {statCards.map((card) => (
            <div key={card.label} className={`bg-white rounded-xl border ${card.border} p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Charts Section */}
      <section className="max-w-6xl mx-auto px-4 mt-10 sm:mt-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Income vs Expenses */}
          {barData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Income vs Expenses</h3>
              <p className="text-sm text-gray-500 mb-5">Monthly breakdown over the last 12 months</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => {
                        const [y, m] = v.split('-');
                        return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short' });
                      }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 13 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="donations" name="Donations" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Expense Allocation Pie Chart */}
          {pieData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Fund Allocation</h3>
              <p className="text-sm text-gray-500 mb-5">How funds are distributed by category</p>
              <div className="h-72 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 13 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Donations & Expenses Tables */}
      <section className="max-w-6xl mx-auto px-4 mt-10 sm:mt-14 pb-20">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Tab Header */}
          <div className="flex items-center border-b border-gray-200">
            <button
              onClick={() => setActiveTab('donations')}
              className={`flex-1 sm:flex-none px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'donations'
                  ? 'text-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <HiCurrencyDollar className="w-4 h-4" />
                Donations
                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {donations.length}
                </span>
              </div>
              {activeTab === 'donations' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 sm:flex-none px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'expenses'
                  ? 'text-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <HiReceiptPercent className="w-4 h-4" />
                Expenses
                <span className="bg-red-50 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {expenses.length}
                </span>
              </div>
              {activeTab === 'expenses' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
              )}
            </button>
          </div>

          {/* Donations Table */}
          {activeTab === 'donations' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50/80">
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Donor</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {donations.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-gray-500">{fmtDate(d.date)}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{d.donor}</td>
                      <td className="px-5 py-3 font-semibold text-emerald-600">{fmt(d.amount)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          d.isMonthly
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {d.isMonthly ? 'Monthly' : 'One-time'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {donations.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-gray-400">
                        No donations recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Expenses Table */}
          {activeTab === 'expenses' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50/80">
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{fmtDate(e.date)}</td>
                      <td className="px-5 py-3 font-semibold text-red-600">{fmt(e.amount)}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-700 max-w-md">
                        <p className="font-medium">{e.title}</p>
                        {e.description && (
                          <p className="text-gray-500 text-xs mt-0.5">{e.description}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-gray-400">
                        No expenses recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Trust Footer */}
      <section className="bg-navy text-white py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <HiEye className="w-10 h-10 text-gold mx-auto mb-4" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
            Your Trust Matters
          </h2>
          <p className="text-white/70 max-w-xl mx-auto leading-relaxed mb-6">
            Step of Hope Foundation is committed to full financial transparency.
            Every donation is accounted for, and every expense is documented.
            We want you to see exactly how your generosity changes lives.
          </p>
          <Link
            to="/donate"
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-white px-8 py-3 rounded-full font-semibold transition-all hover:shadow-lg hover:shadow-gold/30"
          >
            <HiHeart className="w-5 h-5" />
            Donate With Confidence
          </Link>
        </div>
      </section>
    </div>
  );
}
