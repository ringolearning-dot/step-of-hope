import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { HiClock, HiFunnel } from 'react-icons/hi2';

interface ActivityLog {
  id: number;
  admin_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
}

export default function ActivityLogsAdmin() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('');

  useEffect(() => { fetchLogs(); }, [page, filterType]);

  async function fetchLogs() {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '50' });
      if (filterType) params.append('entity_type', filterType);
      const res = await api.get(`/activity-logs/admin/all?${params}`);
      setLogs(res.data.logs);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Failed to load activity logs'); }
    finally { setLoading(false); }
  }

  function getActionColor(action: string) {
    if (action.includes('Created') || action.includes('added')) return 'text-emerald-700 bg-emerald-50';
    if (action.includes('Updated') || action.includes('changed')) return 'text-blue-700 bg-blue-50';
    if (action.includes('Deleted') || action.includes('removed')) return 'text-red-700 bg-red-50';
    return 'text-gray-700 bg-gray-50';
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
        <p className="text-gray-500 text-sm mt-1">Track all admin actions and system changes.</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <HiFunnel className="w-4 h-4 text-gray-400" />
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Types</option>
          <option value="donation">Donations</option>
          <option value="expense">Expenses</option>
          <option value="reservation">Reservations</option>
          <option value="volunteer">Volunteers</option>
          <option value="admin">Admin Users</option>
          <option value="content">Content</option>
          <option value="bill">Bills</option>
        </select>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="divide-y">
          {logs.map(log => (
            <div key={log.id} className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <HiClock className="w-4 h-4 text-gray-500" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm">{log.admin_name || 'System'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>{log.action}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{log.entity_type}</span>
                </div>
                {log.details && (
                  <p className="text-xs text-gray-500 mt-1">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</p>
                )}
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="px-5 py-12 text-center text-gray-400">No activity logs found.</div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-sm text-gray-600 disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-sm text-gray-600 disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
