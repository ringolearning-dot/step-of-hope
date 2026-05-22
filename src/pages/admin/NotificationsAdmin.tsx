import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { HiBell, HiCheck, HiTrash, HiCheckCircle } from 'react-icons/hi2';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  entity_type: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  donation_received: '🎁',
  bill_due: '📋',
  reservation_new: '📅',
  volunteer_new: '🤝',
  overdue: '⚠️',
  system: '🔔',
};

export default function NotificationsAdmin() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => { fetchNotifications(); }, [filter]);

  async function fetchNotifications() {
    try {
      const params = filter === 'unread' ? '?unread_only=true' : '';
      const res = await api.get(`/notifications/admin/all${params}`);
      setNotifications(res.data);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  }

  async function markAsRead(id: number) {
    try {
      await api.put(`/notifications/admin/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { toast.error('Failed to mark as read'); }
  }

  async function markAllRead() {
    try {
      await api.put('/notifications/admin/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All marked as read');
    } catch { toast.error('Failed'); }
  }

  async function deleteNotification(id: number) {
    try {
      await api.delete(`/notifications/admin/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { toast.error('Failed to delete'); }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">{unreadCount} unread notifications</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50">
            <HiCheckCircle className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm rounded-md ${filter === 'all' ? 'bg-white shadow font-medium' : 'text-gray-600'}`}>All</button>
        <button onClick={() => setFilter('unread')} className={`px-4 py-2 text-sm rounded-md ${filter === 'unread' ? 'bg-white shadow font-medium' : 'text-gray-600'}`}>Unread ({unreadCount})</button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y">
        {notifications.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400">
            <HiBell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No notifications</p>
          </div>
        ) : notifications.map(n => (
          <div key={n.id} className={`px-5 py-4 flex items-start gap-4 hover:bg-gray-50 ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
            <div className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
              {n.message && <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>}
              <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!n.is_read && (
                <button onClick={() => markAsRead(n.id)} className="p-1.5 text-gray-400 hover:text-blue-600" title="Mark read">
                  <HiCheck className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => deleteNotification(n.id)} className="p-1.5 text-gray-400 hover:text-red-600">
                <HiTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
