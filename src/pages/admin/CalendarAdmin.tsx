import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { HiPlus, HiTrash, HiXMark, HiCalendarDays } from 'react-icons/hi2';

interface CalendarBlock {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  service_type: string;
  reason: string;
  title: string;
  notes: string;
}

interface Reservation {
  id: string;
  full_name: string;
  service_type: string;
  event_date: string;
  start_time: string;
  num_hours: number;
  status: string;
  total_amount: number;
}

interface WaitlistEntry {
  id: number;
  service_type: string;
  preferred_date: string;
  full_name: string;
  email: string;
  status: string;
}

const fmt = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export default function CalendarAdmin() {
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [activeTab, setActiveTab] = useState<'calendar' | 'waitlist'>('calendar');

  const [form, setForm] = useState({
    date: '', start_time: '', end_time: '', service_type: '', reason: 'maintenance', title: '', notes: '',
  });

  useEffect(() => { fetchAll(); }, [viewMonth]);

  async function fetchAll() {
    try {
      const [y, m] = viewMonth.split('-').map(Number);
      const startDate = `${viewMonth}-01`;
      const endDate = `${y}-${String(m + 1).padStart(2, '0')}-01`;

      const [blocksRes, resRes, waitRes] = await Promise.all([
        api.get(`/calendar/admin/all?startDate=${startDate}&endDate=${endDate}`),
        api.get(`/reservations/admin/all?page=1&limit=100`),
        api.get('/calendar/admin/waitlist'),
      ]);
      setBlocks(blocksRes.data);
      setReservations((resRes.data.reservations || []).filter((r: Reservation) =>
        r.event_date >= startDate && r.event_date < endDate
      ));
      setWaitlist(waitRes.data);
    } catch { toast.error('Failed to load calendar data'); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/calendar/admin', {
        ...form,
        service_type: form.service_type || null,
      });
      toast.success('Date blocked');
      setShowForm(false);
      setForm({ date: '', start_time: '', end_time: '', service_type: '', reason: 'maintenance', title: '', notes: '' });
      fetchAll();
    } catch { toast.error('Failed to block date'); }
  }

  async function handleDeleteBlock(id: number) {
    if (!confirm('Remove this block?')) return;
    try {
      await api.delete(`/calendar/admin/${id}`);
      toast.success('Block removed');
      fetchAll();
    } catch { toast.error('Failed to remove block'); }
  }

  // Build calendar grid
  const [year, month] = viewMonth.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  function getDayInfo(day: number) {
    const dateStr = `${viewMonth}-${String(day).padStart(2, '0')}`;
    const dayBlocks = blocks.filter(b => b.date === dateStr);
    const dayReservations = reservations.filter(r => r.event_date === dateStr);
    return { dateStr, blocks: dayBlocks, reservations: dayReservations };
  }

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMonth = () => {
    const d = new Date(year, month, 1);
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full" /></div>;

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservation Calendar</h1>
          <p className="text-gray-500 text-sm mt-1">Manage availability, blocks, and reservations.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800">
          <HiPlus className="w-4 h-4" /> Block Date
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab('calendar')} className={`px-4 py-2 text-sm rounded-md ${activeTab === 'calendar' ? 'bg-white shadow font-medium' : 'text-gray-600'}`}>Calendar</button>
        <button onClick={() => setActiveTab('waitlist')} className={`px-4 py-2 text-sm rounded-md ${activeTab === 'waitlist' ? 'bg-white shadow font-medium' : 'text-gray-600'}`}>Waitlist ({waitlist.filter(w => w.status === 'waiting').length})</button>
      </div>

      {activeTab === 'calendar' ? (
        <>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Available</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" /> Confirmed</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500" /> Pending</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> Blocked</span>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="px-3 py-1 text-sm border rounded hover:bg-gray-50">&larr;</button>
              <h3 className="text-lg font-bold">{monthName}</h3>
              <button onClick={nextMonth} className="px-3 py-1 text-sm border rounded hover:bg-gray-50">&rarr;</button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
              ))}
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="h-24" />;
                const info = getDayInfo(day);
                const isToday = info.dateStr === today;
                const isBlocked = info.blocks.length > 0;
                const hasConfirmed = info.reservations.some(r => r.status === 'confirmed' || r.status === 'completed');
                const hasPending = info.reservations.some(r => r.status === 'pending' || r.status === 'paid');

                return (
                  <div key={day} className={`h-24 border rounded-lg p-1.5 text-xs overflow-hidden ${isToday ? 'border-blue-400 bg-blue-50/50' : 'border-gray-100'} ${isBlocked ? 'bg-red-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day}</span>
                      <div className="flex gap-0.5">
                        {isBlocked && <span className="w-2 h-2 rounded-full bg-red-500" />}
                        {hasConfirmed && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                        {hasPending && <span className="w-2 h-2 rounded-full bg-yellow-500" />}
                      </div>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {info.blocks.map(b => (
                        <div key={b.id} className="bg-red-100 text-red-700 rounded px-1 py-0.5 truncate text-[10px]" title={b.title || b.reason}>
                          {b.title || b.reason}
                        </div>
                      ))}
                      {info.reservations.slice(0, 2).map(r => (
                        <div key={r.id} className={`rounded px-1 py-0.5 truncate text-[10px] ${r.status === 'confirmed' || r.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {r.full_name} ({r.service_type})
                        </div>
                      ))}
                      {info.reservations.length > 2 && <div className="text-gray-400 text-[10px]">+{info.reservations.length - 2} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Blocked Dates List */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b"><h3 className="font-medium text-gray-700">Blocked Dates This Month</h3></div>
            <div className="divide-y">
              {blocks.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400">No blocked dates this month.</div>
              ) : blocks.map(b => (
                <div key={b.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{b.date} {b.start_time && `(${b.start_time} - ${b.end_time || ''})`}</p>
                    <p className="text-sm text-gray-500">{b.title || b.reason} {b.service_type ? `- ${b.service_type}` : '(all services)'}</p>
                  </div>
                  <button onClick={() => handleDeleteBlock(b.id)} className="p-1.5 text-gray-400 hover:text-red-600"><HiTrash className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Waitlist Tab */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b">
                  <th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Preferred Date</th><th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {waitlist.map(w => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium">{w.full_name}</td>
                    <td className="px-5 py-3 text-gray-600">{w.email}</td>
                    <td className="px-5 py-3 text-gray-600">{w.service_type}</td>
                    <td className="px-5 py-3">{w.preferred_date}</td>
                    <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${w.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' : w.status === 'notified' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{w.status}</span></td>
                  </tr>
                ))}
                {waitlist.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No waitlist entries.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Block Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Block Date/Time</h2>
              <button onClick={() => setShowForm(false)}><HiXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <select value={form.service_type} onChange={e => setForm({ ...form, service_type: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">All Services</option><option value="photobooth">Photobooth</option><option value="360booth">360 Booth</option>
                </select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="maintenance">Maintenance</option><option value="holiday">Holiday</option><option value="private_event">Private Event</option>
                  <option value="personal">Personal Use</option><option value="fully_booked">Fully Booked</option>
                </select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Optional description" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Block Date</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
