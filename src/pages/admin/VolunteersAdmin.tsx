import { useState, useEffect } from 'react';
import api from '../../lib/api';

interface Volunteer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  interests: string;
  message: string | null;
  status: string;
  created_at: string;
}

export default function VolunteersAdmin() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, active: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [volRes, statsRes] = await Promise.all([
        api.get('/volunteers/admin/all', { params: { status: statusFilter || undefined } }),
        api.get('/volunteers/admin/stats'),
      ]);
      setVolunteers(volRes.data.volunteers);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const updateStatus = async (id: number, status: string) => {
    await api.put(`/volunteers/admin/${id}`, { status });
    fetchData();
  };

  const deleteVolunteer = async (id: number) => {
    if (!confirm('Delete this volunteer record?')) return;
    await api.delete(`/volunteers/admin/${id}`);
    fetchData();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Volunteers</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'bg-blue-50 text-blue-700' },
          { label: 'New', value: stats.new, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Contacted', value: stats.contacted, color: 'bg-purple-50 text-purple-700' },
          { label: 'Active', value: stats.active, color: 'bg-green-50 text-green-700' },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-4`}>
            <p className="text-sm font-medium opacity-70">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="active">Active</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Interests</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {volunteers.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{v.first_name} {v.last_name}</td>
                    <td className="px-4 py-3 text-gray-600">{v.email}</td>
                    <td className="px-4 py-3 text-gray-600">{v.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                      {(() => {
                        try { return JSON.parse(v.interests).join(', '); } catch { return v.interests; }
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={v.status}
                        onChange={(e) => updateStatus(v.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${
                          v.status === 'new' ? 'bg-yellow-100 text-yellow-700' :
                          v.status === 'contacted' ? 'bg-purple-100 text-purple-700' :
                          'bg-green-100 text-green-700'
                        }`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="active">Active</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(v.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteVolunteer(v.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {volunteers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      No volunteers yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
