import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { HiCalendarDays, HiCamera, HiVideoCamera, HiCurrencyDollar, HiArrowTrendingUp, HiTrash } from 'react-icons/hi2';

interface Reservation {
  id: string;
  stripe_session_id: string;
  service_type: string;
  full_name: string;
  email: string;
  phone: string;
  organization: string | null;
  event_date: string;
  start_time: string;
  num_hours: number;
  event_type: string;
  event_address: string;
  indoor_outdoor: string;
  estimated_guests: number;
  with_tent: boolean | null;
  custom_backdrop: boolean | null;
  backdrop_choice: string | null;
  design_notes: string | null;
  parking_instructions: string | null;
  setup_access_time: string | null;
  power_availability: string | null;
  special_requests: string | null;
  total_amount: number;
  status: string;
  created_at: string;
}

interface Stats {
  total: number;
  totalRevenue: number;
  photobooth: number;
  videobooth: number;
  upcoming: number;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ReservationsAdmin() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', serviceType: '' });
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [sendingReceipt, setSendingReceipt] = useState<string | null>(null);

  const sendReceipt = async (id: string) => {
    setSendingReceipt(id);
    try {
      await api.post(`/reservations/admin/${id}/send-receipt`);
      alert('Receipt email sent!');
    } catch {
      alert('Failed to send receipt.');
    } finally {
      setSendingReceipt(null);
    }
  };

  const fetchData = async () => {
    try {
      const [resRes, statsRes] = await Promise.all([
        api.get('/reservations/admin/all', { params: { status: filter.status || undefined, serviceType: filter.serviceType || undefined } }),
        api.get('/reservations/admin/stats'),
      ]);
      setReservations(resRes.data.reservations || []);
      setStats(statsRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/reservations/admin/${id}`, { status });
      fetchData();
    } catch {
      // ignore
    }
  };

  const deleteReservation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reservation?')) return;
    try {
      await api.delete(`/reservations/admin/${id}`);
      setSelectedRes(null);
      fetchData();
    } catch {
      // ignore
    }
  };

  const exportCSV = () => {
    window.open(`${api.defaults.baseURL}/reservations/admin/export`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Reservations', value: stats?.total || 0, icon: HiCalendarDays, color: 'bg-blue-50 text-blue-600' },
    { label: 'Revenue', value: formatCents(stats?.totalRevenue || 0), icon: HiCurrencyDollar, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Photobooth', value: stats?.photobooth || 0, icon: HiCamera, color: 'bg-purple-50 text-purple-600' },
    { label: '360 Booth', value: stats?.videobooth || 0, icon: HiVideoCamera, color: 'bg-amber-50 text-amber-600' },
    { label: 'Upcoming', value: stats?.upcoming || 0, icon: HiArrowTrendingUp, color: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
          <p className="text-gray-500 text-sm mt-1">Manage photobooth and 360 booth bookings.</p>
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition"
        >
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={filter.status}
          onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
        <select
          value={filter.serviceType}
          onChange={(e) => setFilter((f) => ({ ...f, serviceType: e.target.value }))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All Services</option>
          <option value="photobooth">Photobooth</option>
          <option value="360booth">360 Video Booth</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Service</th>
                <th className="px-5 py-3 font-medium">Event Date</th>
                <th className="px-5 py-3 font-medium">Event Type</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservations.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">{r.full_name}</div>
                    <div className="text-gray-500 text-xs">{r.email}</div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.service_type === 'photobooth'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {r.service_type === 'photobooth' ? 'Photobooth' : '360 Booth'}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-gray-600">
                    {formatDate(r.event_date + 'T12:00:00')}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-gray-600">{r.event_type}</td>
                  <td className="px-5 py-3 whitespace-nowrap font-medium text-gray-900">
                    {formatCents(r.total_amount)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === 'paid' || r.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : r.status === 'pending'
                          ? 'bg-yellow-50 text-yellow-700'
                          : r.status === 'completed'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedRes(r)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => sendReceipt(r.id)}
                        disabled={sendingReceipt === r.id}
                        className="text-emerald-600 hover:text-emerald-800 text-xs font-medium disabled:opacity-50"
                      >
                        {sendingReceipt === r.id ? 'Sending...' : 'Send Receipt'}
                      </button>
                      <button
                        onClick={() => deleteReservation(r.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete reservation"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    No reservations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRes && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRes(null)}>
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-lg text-gray-900">Reservation Details</h3>
              <button onClick={() => setSelectedRes(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-6 text-sm">
              {/* Customer */}
              <div>
                <h4 className="font-medium text-gray-500 text-xs uppercase tracking-wider mb-3">Customer</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-gray-400">Name:</span> <span className="font-medium text-gray-900">{selectedRes.full_name}</span></div>
                  <div><span className="text-gray-400">Email:</span> <span className="font-medium text-gray-900">{selectedRes.email}</span></div>
                  <div><span className="text-gray-400">Phone:</span> <span className="font-medium text-gray-900">{selectedRes.phone}</span></div>
                  <div><span className="text-gray-400">Org:</span> <span className="font-medium text-gray-900">{selectedRes.organization || 'N/A'}</span></div>
                </div>
              </div>

              {/* Event */}
              <div>
                <h4 className="font-medium text-gray-500 text-xs uppercase tracking-wider mb-3">Event</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-gray-400">Service:</span> <span className="font-medium text-gray-900">{selectedRes.service_type === 'photobooth' ? 'Photobooth' : '360 Video Booth'}</span></div>
                  <div><span className="text-gray-400">Date:</span> <span className="font-medium text-gray-900">{formatDate(selectedRes.event_date + 'T12:00:00')}</span></div>
                  <div><span className="text-gray-400">Time:</span> <span className="font-medium text-gray-900">{selectedRes.start_time}</span></div>
                  <div><span className="text-gray-400">Hours:</span> <span className="font-medium text-gray-900">{selectedRes.num_hours}</span></div>
                  <div><span className="text-gray-400">Type:</span> <span className="font-medium text-gray-900">{selectedRes.event_type}</span></div>
                  <div><span className="text-gray-400">Indoor/Outdoor:</span> <span className="font-medium text-gray-900">{selectedRes.indoor_outdoor}</span></div>
                  <div className="col-span-2"><span className="text-gray-400">Address:</span> <span className="font-medium text-gray-900">{selectedRes.event_address}</span></div>
                  <div><span className="text-gray-400">Guests:</span> <span className="font-medium text-gray-900">{selectedRes.estimated_guests}</span></div>
                  <div><span className="text-gray-400">Amount:</span> <span className="font-medium text-emerald-600 text-base">{formatCents(selectedRes.total_amount)}</span></div>
                </div>
              </div>

              {/* Package */}
              <div>
                <h4 className="font-medium text-gray-500 text-xs uppercase tracking-wider mb-3">Package</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedRes.service_type === 'photobooth' && (
                    <div><span className="text-gray-400">Custom Backdrop:</span> <span className="font-medium text-gray-900">{selectedRes.custom_backdrop ? 'Yes' : 'No'}</span></div>
                  )}
                  {selectedRes.service_type === '360booth' && (
                    <div><span className="text-gray-400">With Tent:</span> <span className="font-medium text-gray-900">{selectedRes.with_tent ? 'Yes' : 'No'}</span></div>
                  )}
                  <div><span className="text-gray-400">Backdrop:</span> <span className="font-medium text-gray-900">{selectedRes.backdrop_choice || 'N/A'}</span></div>
                  <div className="col-span-2"><span className="text-gray-400">Design Notes:</span> <span className="font-medium text-gray-900">{selectedRes.design_notes || 'N/A'}</span></div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="font-medium text-gray-500 text-xs uppercase tracking-wider mb-3">Special Notes</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-gray-400">Parking:</span> <span className="font-medium text-gray-900">{selectedRes.parking_instructions || 'N/A'}</span></div>
                  <div><span className="text-gray-400">Setup Time:</span> <span className="font-medium text-gray-900">{selectedRes.setup_access_time || 'N/A'}</span></div>
                  <div><span className="text-gray-400">Power:</span> <span className="font-medium text-gray-900">{selectedRes.power_availability || 'N/A'}</span></div>
                  <div className="col-span-2"><span className="text-gray-400">Requests:</span> <span className="font-medium text-gray-900">{selectedRes.special_requests || 'N/A'}</span></div>
                </div>
              </div>

              {/* Status Update */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-500 text-xs uppercase tracking-wider mb-3">Update Status</h4>
                <div className="flex flex-wrap gap-2">
                  {['confirmed', 'completed', 'cancelled'].map((s) => (
                    <button
                      key={s}
                      onClick={() => { updateStatus(selectedRes.id, s); setSelectedRes({ ...selectedRes, status: s }); }}
                      disabled={selectedRes.status === s}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-40 ${
                        s === 'confirmed' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' :
                        s === 'completed' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' :
                        'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      Mark {s}
                    </button>
                  ))}
                  <button
                    onClick={() => deleteReservation(selectedRes.id)}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition ml-auto"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
