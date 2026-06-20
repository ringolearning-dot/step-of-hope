import { useState, useEffect } from 'react';
import api from '../../lib/api';
import DEFAULTS from '../../lib/content-defaults';
import { HiCheckCircle, HiXCircle, HiPencilSquare, HiHeart, HiEye } from 'react-icons/hi2';

interface Stat {
  valueKey: string;
  labelKey: string;
  valueLabel: string;
  labelLabel: string;
}

const impactStats: Stat[] = [
  { valueKey: 'stat1_value', labelKey: 'stat1_label', valueLabel: 'Stat 1 Number', labelLabel: 'Stat 1 Label' },
  { valueKey: 'stat2_value', labelKey: 'stat2_label', valueLabel: 'Stat 2 Number', labelLabel: 'Stat 2 Label' },
  { valueKey: 'stat3_value', labelKey: 'stat3_label', valueLabel: 'Stat 3 Number', labelLabel: 'Stat 3 Label' },
  { valueKey: 'stat4_value', labelKey: 'stat4_label', valueLabel: 'Stat 4 Number', labelLabel: 'Stat 4 Label' },
];

const transparencyStats = [
  { key: 'transparency_children_helped', label: 'Children Helped' },
  { key: 'transparency_events_organized', label: 'Events Organized' },
];

const defaults = DEFAULTS.impact || {};

export default function ImpactStatsAdmin() {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, { type: 'success' | 'error'; msg: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Start with defaults
    const init: Record<string, string> = {};
    Object.entries(defaults).forEach(([k, v]) => { init[k] = v; });

    api.get('/content/impact')
      .then(res => {
        const db: Record<string, string> = res.data || {};
        setFields({ ...init, ...db });
      })
      .catch(() => setFields(init))
      .finally(() => setLoading(false));
  }, []);

  const save = async (key: string) => {
    setSaving(s => ({ ...s, [key]: true }));
    setFeedback(f => { const n = { ...f }; delete n[key]; return n; });
    try {
      await api.put(`/content/impact/${key}`, { value: fields[key] || '' });
      setFeedback(f => ({ ...f, [key]: { type: 'success', msg: 'Saved' } }));
      setTimeout(() => setFeedback(f => { const n = { ...f }; delete n[key]; return n; }), 3000);
    } catch {
      setFeedback(f => ({ ...f, [key]: { type: 'error', msg: 'Failed' } }));
      setTimeout(() => setFeedback(f => { const n = { ...f }; delete n[key]; return n; }), 3000);
    }
    setSaving(s => ({ ...s, [key]: false }));
  };

  const saveAll = async () => {
    const allKeys = [
      ...impactStats.flatMap(s => [s.valueKey, s.labelKey]),
      ...transparencyStats.map(s => s.key),
    ];
    for (const key of allKeys) {
      await save(key);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Impact Stats</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage the numbers shown on the Home page, Impact page, and Transparency banner.
          </p>
        </div>
        <button
          onClick={saveAll}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition"
        >
          <HiPencilSquare className="w-4 h-4" />
          Save All
        </button>
      </div>

      {/* Impact Counters — Home + Impact pages */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <HiHeart className="w-5 h-5 text-pink-500" />
            <h2 className="text-base font-semibold text-gray-800">Impact Counters</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">Displayed on the Home page and Impact page under "Making a Difference"</p>
        </div>
        <div className="divide-y divide-gray-100">
          {impactStats.map((stat, i) => (
            <div key={stat.valueKey} className="px-5 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Stat {i + 1}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Number / Value</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={fields[stat.valueKey] || ''}
                      onChange={e => setFields(f => ({ ...f, [stat.valueKey]: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                      placeholder="e.g. 50+"
                    />
                    <button
                      onClick={() => save(stat.valueKey)}
                      disabled={saving[stat.valueKey]}
                      className="px-3 py-2 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition"
                    >
                      {saving[stat.valueKey] ? '...' : 'Save'}
                    </button>
                  </div>
                  {feedback[stat.valueKey] && (
                    <div className={`flex items-center gap-1 text-xs mt-1 ${feedback[stat.valueKey].type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {feedback[stat.valueKey].type === 'success' ? <HiCheckCircle className="w-3.5 h-3.5" /> : <HiXCircle className="w-3.5 h-3.5" />}
                      {feedback[stat.valueKey].msg}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Label</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={fields[stat.labelKey] || ''}
                      onChange={e => setFields(f => ({ ...f, [stat.labelKey]: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                      placeholder="e.g. Children Supported"
                    />
                    <button
                      onClick={() => save(stat.labelKey)}
                      disabled={saving[stat.labelKey]}
                      className="px-3 py-2 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition"
                    >
                      {saving[stat.labelKey] ? '...' : 'Save'}
                    </button>
                  </div>
                  {feedback[stat.labelKey] && (
                    <div className={`flex items-center gap-1 text-xs mt-1 ${feedback[stat.labelKey].type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {feedback[stat.labelKey].type === 'success' ? <HiCheckCircle className="w-3.5 h-3.5" /> : <HiXCircle className="w-3.5 h-3.5" />}
                      {feedback[stat.labelKey].msg}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transparency Counters */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <HiEye className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-semibold text-gray-800">Transparency Counters</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">Shown in the top transparency banner and on the Transparency page</p>
        </div>
        <div className="divide-y divide-gray-100">
          {transparencyStats.map(stat => (
            <div key={stat.key} className="px-5 py-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">{stat.label}</label>
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={fields[stat.key] || ''}
                  onChange={e => setFields(f => ({ ...f, [stat.key]: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                  placeholder="e.g. 150"
                />
                <button
                  onClick={() => save(stat.key)}
                  disabled={saving[stat.key]}
                  className="px-3 py-2 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition"
                >
                  {saving[stat.key] ? '...' : 'Save'}
                </button>
              </div>
              {feedback[stat.key] && (
                <div className={`flex items-center gap-1 text-xs mt-1 ${feedback[stat.key].type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {feedback[stat.key].type === 'success' ? <HiCheckCircle className="w-3.5 h-3.5" /> : <HiXCircle className="w-3.5 h-3.5" />}
                  {feedback[stat.key].msg}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-base font-semibold text-gray-800">Preview</h2>
          <p className="text-xs text-gray-500 mt-1">How the stats will appear on the website</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {impactStats.map(stat => (
              <div key={stat.valueKey} className="text-center">
                <p className="text-3xl font-bold text-blue-500">{fields[stat.valueKey] || '—'}</p>
                <p className="text-sm text-gray-500 mt-1">{fields[stat.labelKey] || '—'}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-6 pt-6 grid grid-cols-2 gap-6 max-w-md mx-auto">
            {transparencyStats.map(stat => (
              <div key={stat.key} className="text-center">
                <p className="text-2xl font-bold text-gray-800">{fields[stat.key] || '—'}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
