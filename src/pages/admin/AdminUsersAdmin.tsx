import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { HiPlus, HiTrash, HiPencil, HiXMark, HiShieldCheck, HiUser } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  staff: 'Staff',
  viewer: 'Viewer',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-700',
  admin: 'bg-blue-100 text-blue-700',
  staff: 'bg-purple-100 text-purple-700',
  viewer: 'bg-gray-100 text-gray-700',
};

export default function AdminUsersAdmin() {
  const { admin: currentAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'staff' });

  const isSuperAdmin = currentAdmin?.role === 'super_admin';

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      const res = await api.get('/admin-users/admin/all');
      setUsers(res.data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editId) {
        const payload: any = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await api.put(`/admin-users/admin/${editId}`, payload);
        toast.success('User updated');
      } else {
        await api.post('/admin-users/admin', form);
        toast.success('User created');
      }
      resetForm();
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save user');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this admin user?')) return;
    try {
      await api.delete(`/admin-users/admin/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  }

  async function toggleActive(id: number, currentActive: boolean) {
    try {
      await api.put(`/admin-users/admin/${id}`, { is_active: !currentActive });
      toast.success(`User ${!currentActive ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch { toast.error('Failed to update'); }
  }

  function startEdit(user: AdminUser) {
    setEditId(user.id);
    setForm({ email: user.email, name: user.name, password: '', role: user.role });
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false); setEditId(null);
    setForm({ email: '', name: '', password: '', role: 'staff' });
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
          <p className="text-gray-500 text-sm mt-1">Manage admin accounts and permissions.</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800">
            <HiPlus className="w-4 h-4" /> Add User
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          Only Super Admins can manage user accounts. Contact your Super Admin to make changes.
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editId ? 'Edit User' : 'Add Admin User'}</h2>
              <button onClick={resetForm}><HiXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{editId ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input type="password" required={!editId} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" minLength={6} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="super_admin">Super Admin</option><option value="admin">Admin</option><option value="staff">Staff</option><option value="viewer">Viewer</option>
                </select></div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800">{editId ? 'Update' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last Login</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                        {user.role === 'super_admin' ? <HiShieldCheck className="w-5 h-5 text-red-500" /> : <HiUser className="w-5 h-5 text-gray-500" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role] || ROLE_COLORS.viewer}`}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${user.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {user.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-xs">
                    {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-5 py-3">
                    {isSuperAdmin && user.id !== currentAdmin?.id && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(user)} className="p-1.5 text-gray-400 hover:text-blue-600"><HiPencil className="w-4 h-4" /></button>
                        <button onClick={() => toggleActive(user.id, user.is_active !== false)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">
                          {user.is_active !== false ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="p-1.5 text-gray-400 hover:text-red-600"><HiTrash className="w-4 h-4" /></button>
                      </div>
                    )}
                    {user.id === currentAdmin?.id && <span className="text-xs text-gray-400">You</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
