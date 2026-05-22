import { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
  HiMagnifyingGlass, HiXMark, HiEnvelope,
  HiChevronDown, HiChevronUp, HiArrowDownTray, HiFunnel,
} from 'react-icons/hi2';

interface VolunteerApp {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  profession: string | null;
  company_name: string | null;
  skills: string | null;
  languages: string | null;
  why_volunteer: string | null;
  volunteered_before: boolean;
  interests: string;
  days_available: string;
  time_available: string | null;
  can_travel: boolean;
  preferred_location: string | null;
  experience_with_children: boolean;
  comfortable_medical_conditions: boolean;
  medical_limitations: string | null;
  has_driver_license: boolean;
  can_lift_equipment: boolean;
  consent_background_check: boolean;
  agree_to_policies: boolean;
  digital_signature: boolean;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  active: number;
  inactive: number;
  rejected: number;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-100 text-red-700',
};

const interestLabels: Record<string, string> = {
  'hospital-visits': 'Hospital Visits',
  'children-events': 'Children Events',
  'fundraising': 'Fundraising',
  'photography-video': 'Photography / Video',
  'event-setup': 'Event Setup',
  'social-media': 'Social Media',
  'administration': 'Administration',
  'driving-transportation': 'Driving / Transportation',
  'community-outreach': 'Community Outreach',
  'other': 'Other',
};

function parseJSON(str: string): string[] {
  try { return JSON.parse(str); } catch { return []; }
}

export default function VolunteersAdmin() {
  const [applications, setApplications] = useState<VolunteerApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, active: 0, inactive: 0, rejected: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [interestFilter, setInterestFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Detail view
  const [selected, setSelected] = useState<VolunteerApp | null>(null);
  const [notes, setNotes] = useState('');

  // Bulk email
  const [showEmail, setShowEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      if (cityFilter) params.city = cityFilter;
      if (interestFilter) params.interest = interestFilter;

      const [appRes, statsRes] = await Promise.all([
        api.get('/volunteer-applications/admin/all', { params }),
        api.get('/volunteer-applications/admin-stats/overview'),
      ]);
      setApplications(appRes.data.applications);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [statusFilter, interestFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const updateStatus = async (id: number, status: string) => {
    await api.put(`/volunteer-applications/admin/${id}`, { status });
    fetchData();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const saveNotes = async (id: number) => {
    await api.put(`/volunteer-applications/admin/${id}`, { admin_notes: notes });
    fetchData();
  };

  const deleteApp = async (id: number) => {
    if (!confirm('Delete this volunteer application?')) return;
    await api.delete(`/volunteer-applications/admin/${id}`);
    if (selected?.id === id) setSelected(null);
    fetchData();
  };

  const exportCSV = async () => {
    try {
      const res = await api.get('/volunteer-applications/admin/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'volunteer-applications.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export.');
    }
  };

  const sendBulkEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) return;
    setEmailSending(true);
    try {
      const payload: Record<string, string> = { subject: emailSubject, body: emailBody };
      if (statusFilter) payload.filterStatus = statusFilter;
      if (cityFilter) payload.filterCity = cityFilter;
      if (interestFilter) payload.filterInterest = interestFilter;

      const res = await api.post('/volunteer-applications/admin/bulk-email', payload);
      alert(res.data.message);
      setShowEmail(false);
      setEmailSubject('');
      setEmailBody('');
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response: { data: { error: string } } }).response?.data?.error
        : 'Failed to send emails.';
      alert(message);
    }
    setEmailSending(false);
  };

  // ─── Detail Modal ──────────────────────────────────────────────

  const DetailModal = () => {
    if (!selected) return null;
    const v = selected;
    const interests = parseJSON(v.interests);
    const days = parseJSON(v.days_available);

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-3xl mx-4 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{v.first_name} {v.last_name}</h2>
              <p className="text-sm text-gray-500">{v.email} &bull; Applied {new Date(v.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg">
              <HiXMark className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Status */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Status:</span>
              <select
                value={v.status}
                onChange={(e) => updateStatus(v.id, e.target.value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 ${statusColors[v.status] || 'bg-gray-100'}`}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Personal */}
            <Section title="Personal Information">
              <Row label="Phone" value={v.phone} />
              <Row label="Date of Birth" value={v.date_of_birth} />
              <Row label="Age" value={v.age?.toString()} />
              <Row label="Gender" value={v.gender} />
              <Row label="Address" value={[v.address, v.city, v.state, v.zip_code, v.country].filter(Boolean).join(', ')} />
            </Section>

            {/* Emergency */}
            <Section title="Emergency Contact">
              <Row label="Name" value={v.emergency_contact_name} />
              <Row label="Relationship" value={v.emergency_contact_relationship} />
              <Row label="Phone" value={v.emergency_contact_phone} />
            </Section>

            {/* Professional */}
            <Section title="Professional Information">
              <Row label="Profession" value={v.profession} />
              <Row label="Company" value={v.company_name} />
              <Row label="Skills" value={v.skills} />
              <Row label="Languages" value={v.languages} />
            </Section>

            {/* Volunteer Details */}
            <Section title="Volunteer Details">
              <Row label="Why Volunteer" value={v.why_volunteer} />
              <Row label="Volunteered Before" value={v.volunteered_before ? 'Yes' : 'No'} />
              <div className="py-2">
                <p className="text-xs text-gray-500 mb-1.5">Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {interests.map((i) => (
                    <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                      {interestLabels[i] || i}
                    </span>
                  ))}
                </div>
              </div>
            </Section>

            {/* Availability */}
            <Section title="Availability">
              <div className="py-2">
                <p className="text-xs text-gray-500 mb-1.5">Days Available</p>
                <div className="flex flex-wrap gap-1.5">
                  {days.map((d) => (
                    <span key={d} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium">{d}</span>
                  ))}
                  {days.length === 0 && <span className="text-xs text-gray-400">Not specified</span>}
                </div>
              </div>
              <Row label="Time Available" value={v.time_available} />
              <Row label="Can Travel" value={v.can_travel ? 'Yes' : 'No'} />
              <Row label="Preferred Location" value={v.preferred_location} />
            </Section>

            {/* Important Questions */}
            <Section title="Important Questions">
              <Row label="Experience with Children" value={v.experience_with_children ? 'Yes' : 'No'} />
              <Row label="Comfortable with Medical Conditions" value={v.comfortable_medical_conditions ? 'Yes' : 'No'} />
              <Row label="Medical Limitations" value={v.medical_limitations || 'None'} />
              <Row label="Driver License" value={v.has_driver_license ? 'Yes' : 'No'} />
              <Row label="Can Lift Equipment" value={v.can_lift_equipment ? 'Yes' : 'No'} />
            </Section>

            {/* Background */}
            <Section title="Background & Safety">
              <Row label="Background Check Consent" value={v.consent_background_check ? 'Yes' : 'No'} />
              <Row label="Agreed to Policies" value={v.agree_to_policies ? 'Yes' : 'No'} />
              <Row label="Digital Signature" value={v.digital_signature ? 'Yes' : 'No'} />
            </Section>

            {/* Admin Notes */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Admin Notes</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add internal notes about this volunteer..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
              />
              <button
                onClick={() => saveNotes(v.id)}
                className="mt-2 px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Save Notes
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => deleteApp(v.id)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Delete Application
            </button>
            <button
              onClick={() => setSelected(null)}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Bulk Email Modal ──────────────────────────────────────────

  const EmailModal = () => {
    if (!showEmail) return null;
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Send Bulk Email</h2>
            <button onClick={() => setShowEmail(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <HiXMark className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
              <strong>Sending to:</strong>{' '}
              {statusFilter || cityFilter || interestFilter
                ? [statusFilter && `Status: ${statusFilter}`, cityFilter && `City: ${cityFilter}`, interestFilter && `Interest: ${interestFilter}`].filter(Boolean).join(' + ')
                : 'All volunteers'}
              <p className="text-xs text-blue-500 mt-1">
                Use {'{first_name}'}, {'{last_name}'}, {'{full_name}'} for personalization.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="e.g. Upcoming Event - We Need You!"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={8}
                placeholder="Dear {first_name},&#10;&#10;We are excited to announce..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={() => setShowEmail(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={sendBulkEmail}
              disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <HiEnvelope className="w-4 h-4" />
              {emailSending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Main Render ───────────────────────────────────────────────

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Volunteer Applications</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmail(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            <HiEnvelope className="w-4 h-4" /> Bulk Email
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
          >
            <HiArrowDownTray className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'bg-slate-50 text-slate-700' },
          { label: 'Pending', value: stats.pending, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Approved', value: stats.approved, color: 'bg-blue-50 text-blue-700' },
          { label: 'Active', value: stats.active, color: 'bg-green-50 text-green-700' },
          { label: 'Inactive', value: stats.inactive, color: 'bg-gray-50 text-gray-600' },
          { label: 'Rejected', value: stats.rejected, color: 'bg-red-50 text-red-700' },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-3`}>
            <p className="text-xs font-medium opacity-70">{s.label}</p>
            <p className="text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex gap-2">
            <div className="relative flex-1">
              <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone, skills..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition">
              Search
            </button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium transition ${
              showFilters ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <HiFunnel className="w-4 h-4" />
            Filters
            {showFilters ? <HiChevronUp className="w-3 h-3" /> : <HiChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
              <input
                type="text"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                onBlur={fetchData}
                placeholder="e.g. San Jose"
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Interest</label>
              <select
                value={interestFilter}
                onChange={(e) => setInterestFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="">All Interests</option>
                {Object.entries(interestLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            {(cityFilter || interestFilter) && (
              <button
                onClick={() => { setCityFilter(''); setInterestFilter(''); }}
                className="self-end px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Interests</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {applications.map((v) => {
                  const interests = parseJSON(v.interests);
                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setSelected(v); setNotes(v.admin_notes || ''); }}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{v.first_name} {v.last_name}</p>
                        <p className="text-xs text-gray-400">{v.profession || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-600">{v.email}</p>
                        <p className="text-xs text-gray-400">{v.phone || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {[v.city, v.state].filter(Boolean).join(', ') || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {interests.slice(0, 2).map((i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full font-medium">
                              {interestLabels[i] || i}
                            </span>
                          ))}
                          {interests.length > 2 && (
                            <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] rounded-full font-medium">
                              +{interests.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={v.status}
                          onChange={(e) => updateStatus(v.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 ${statusColors[v.status] || 'bg-gray-100'}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(v.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => deleteApp(v.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      No volunteer applications yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <DetailModal />
      <EmailModal />
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-2 pb-1 border-b border-gray-100">{title}</p>
      <div className="grid sm:grid-cols-2 gap-x-6">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-1.5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-900">{value || <span className="text-gray-300">—</span>}</p>
    </div>
  );
}
