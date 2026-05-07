import { useState, useEffect } from 'react';
import api from '../../lib/api';

interface Contact {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  inquiry_type: string;
  message: string;
  status: string;
  created_at: string;
}

export default function ContactsAdmin() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [stats, setStats] = useState({ total: 0, unread: 0, byType: [] as { inquiry_type: string; count: number }[] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contactRes, statsRes] = await Promise.all([
        api.get('/contact/admin/all', { params: { status: statusFilter || undefined } }),
        api.get('/contact/admin/stats'),
      ]);
      setContacts(contactRes.data.contacts);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const updateStatus = async (id: number, status: string) => {
    await api.put(`/contact/admin/${id}`, { status });
    fetchData();
  };

  const deleteContact = async (id: number) => {
    if (!confirm('Delete this message?')) return;
    await api.delete(`/contact/admin/${id}`);
    fetchData();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Contact Messages</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 text-blue-700 rounded-xl p-4">
          <p className="text-sm font-medium opacity-70">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-red-50 text-red-700 rounded-xl p-4">
          <p className="text-sm font-medium opacity-70">Unread</p>
          <p className="text-2xl font-bold">{stats.unread}</p>
        </div>
        {stats.byType.slice(0, 2).map((t) => (
          <div key={t.inquiry_type} className="bg-gray-50 text-gray-700 rounded-xl p-4">
            <p className="text-sm font-medium opacity-70 capitalize">{t.inquiry_type}</p>
            <p className="text-2xl font-bold">{t.count}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-xl border transition-all ${
                c.status === 'unread' ? 'border-gold/30 bg-gold/5' : 'border-gray-100'
              }`}
            >
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer"
                onClick={() => {
                  setExpanded(expanded === c.id ? null : c.id);
                  if (c.status === 'unread') updateStatus(c.id, 'read');
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    {c.status === 'unread' && (
                      <span className="w-2 h-2 bg-gold rounded-full flex-shrink-0" />
                    )}
                    <span className="font-medium text-gray-900">{c.name}</span>
                    <span className="text-xs text-gray-400 capitalize px-2 py-0.5 bg-gray-100 rounded-full">
                      {c.inquiry_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {c.subject || c.message.slice(0, 80)}
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <span className="text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expanded === c.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {expanded === c.id && (
                <div className="px-5 pb-5 border-t border-gray-50">
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-gray-400">Email:</span>{' '}
                      <a href={`mailto:${c.email}`} className="text-blue-600">{c.email}</a>
                    </div>
                    <div>
                      <span className="text-gray-400">Type:</span>{' '}
                      <span className="capitalize">{c.inquiry_type}</span>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                    {c.message}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <select
                      value={c.status}
                      onChange={(e) => updateStatus(c.id, e.target.value)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200"
                    >
                      <option value="unread">Unread</option>
                      <option value="read">Read</option>
                      <option value="replied">Replied</option>
                    </select>
                    <a
                      href={`mailto:${c.email}?subject=Re: ${c.subject || 'Your inquiry'}`}
                      className="text-xs bg-navy text-white px-4 py-1.5 rounded-lg hover:bg-navy-soft transition-colors"
                    >
                      Reply via Email
                    </a>
                    <button
                      onClick={() => deleteContact(c.id)}
                      className="text-xs text-red-500 hover:text-red-700 ml-auto"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {contacts.length === 0 && (
            <div className="text-center py-12 text-gray-400">No messages yet</div>
          )}
        </div>
      )}
    </div>
  );
}
