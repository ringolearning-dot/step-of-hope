import { useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { HiDocumentArrowDown, HiChartBar, HiCalendarDays, HiArrowPath } from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];
const fmt = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export default function ReportsAdmin() {
  const [reportType, setReportType] = useState('financial');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [savedReports, setSavedReports] = useState<any[]>([]);

  async function generateReport() {
    setLoading(true);
    try {
      const res = await api.get(`/reports/admin/generate?type=${reportType}&startDate=${startDate}&endDate=${endDate}`);
      setReport(res.data);
    } catch { toast.error('Failed to generate report'); }
    finally { setLoading(false); }
  }

  async function saveReport() {
    if (!report) return;
    try {
      await api.post('/reports/admin/save', {
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report (${startDate} to ${endDate})`,
        type: reportType,
        date_from: startDate,
        date_to: endDate,
        data: report,
      });
      toast.success('Report saved');
    } catch { toast.error('Failed to save'); }
  }

  async function sendDailyReport() {
    try {
      await api.post('/daily-emails/admin/send');
      toast.success('Daily report email sent!');
    } catch { toast.error('Failed to send email'); }
  }

  function renderFinancialReport() {
    if (!report?.summary) return null;
    const { summary, donations, expenses, reservations } = report;

    const categoryData = expenses?.byCategory
      ? Object.entries(expenses.byCategory).map(([name, value]) => ({ name, value: (value as number) / 100 }))
      : [];

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <p className="text-sm text-emerald-700">Total Income</p>
            <p className="text-2xl font-bold text-emerald-800">{fmt(summary.totalIncome)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <p className="text-sm text-red-700">Total Expenses</p>
            <p className="text-2xl font-bold text-red-800">{fmt(summary.totalExpenses)}</p>
          </div>
          <div className={`rounded-xl p-4 border ${summary.netIncome >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
            <p className="text-sm text-gray-700">Net Income</p>
            <p className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>{fmt(summary.netIncome)}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <p className="text-sm text-purple-700">Reservation Revenue</p>
            <p className="text-2xl font-bold text-purple-800">{fmt(reservations?.revenue || 0)}</p>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border p-5">
            <h4 className="font-medium text-gray-700 mb-3">Donation Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Total donations:</span><span className="font-medium">{fmt(donations?.total || 0)}</span></div>
              <div className="flex justify-between"><span>Count:</span><span>{donations?.count || 0}</span></div>
              <div className="flex justify-between"><span>One-time:</span><span>{fmt(donations?.oneTime || 0)}</span></div>
              <div className="flex justify-between"><span>Recurring:</span><span>{fmt(donations?.recurring || 0)}</span></div>
            </div>
          </div>

          {categoryData.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h4 className="font-medium text-gray-700 mb-3">Expense Categories</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name }) => name}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderDonationReport() {
    if (!report) return null;
    const barData = (report.monthlyBreakdown || []).map((m: any) => ({ month: m.month, amount: m.total / 100 }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4"><p className="text-sm text-gray-500">Total</p><p className="text-xl font-bold">{fmt(report.total || 0)}</p></div>
          <div className="bg-white rounded-xl border p-4"><p className="text-sm text-gray-500">Count</p><p className="text-xl font-bold">{report.count || 0}</p></div>
          <div className="bg-white rounded-xl border p-4"><p className="text-sm text-gray-500">Average</p><p className="text-xl font-bold">{fmt(report.average || 0)}</p></div>
          <div className="bg-white rounded-xl border p-4"><p className="text-sm text-gray-500">Recurring</p><p className="text-xl font-bold">{report.recurring || 0}</p></div>
        </div>

        {barData.length > 0 && (
          <div className="bg-white rounded-xl border p-5">
            <h4 className="font-medium text-gray-700 mb-3">Monthly Breakdown</h4>
            <div className="h-64"><ResponsiveContainer><BarChart data={barData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 12 }} /><Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} /><Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </div>
        )}

        {report.topDonors?.length > 0 && (
          <div className="bg-white rounded-xl border p-5">
            <h4 className="font-medium text-gray-700 mb-3">Top Donors</h4>
            <div className="space-y-2">{report.topDonors.map((d: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-gray-50">
                <span className="font-medium">{i + 1}. {d.name}</span><span className="text-gray-600">{fmt(d.amount)}</span>
              </div>
            ))}</div>
          </div>
        )}
      </div>
    );
  }

  function renderGenericReport() {
    if (!report) return null;
    return (
      <div className="bg-white rounded-xl border p-5">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-96">
          {JSON.stringify(report, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Generate and export financial reports.</p>
        </div>
        <button onClick={sendDailyReport} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <HiDocumentArrowDown className="w-4 h-4" /> Send Daily Report
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select value={reportType} onChange={e => setReportType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
              <option value="financial">Financial Summary</option>
              <option value="donations">Donations Report</option>
              <option value="expenses">Expenses Report</option>
              <option value="volunteers">Volunteers Report</option>
              <option value="reservations">Reservations Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={generateReport} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50">
            {loading ? <HiArrowPath className="w-4 h-4 animate-spin" /> : <HiChartBar className="w-4 h-4" />}
            Generate
          </button>
          {report && (
            <button onClick={saveReport} className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
              Save Report
            </button>
          )}
        </div>
      </div>

      {/* Report Results */}
      {report && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-gray-900">{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h2>
            <span className="text-sm text-gray-500">({startDate} to {endDate})</span>
          </div>
          {reportType === 'financial' && renderFinancialReport()}
          {reportType === 'donations' && renderDonationReport()}
          {(reportType !== 'financial' && reportType !== 'donations') && renderGenericReport()}
        </div>
      )}
    </div>
  );
}
