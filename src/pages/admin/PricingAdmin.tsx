import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { HiCurrencyDollar } from 'react-icons/hi2';

interface PricingConfig {
  photobooth_base: number;
  photobooth_extra_hour: number;
  photobooth_backdrop: number;
  '360booth_base': number;
  '360booth_tent': number;
  '360booth_extra_hour': number;
  both_base: number;
  both_extra_hour: number;
  both_backdrop: number;
}

const labels: Record<string, { label: string; group: string }> = {
  photobooth_base: { label: 'Base Price (3 hrs)', group: 'Photobooth' },
  photobooth_extra_hour: { label: 'Extra Hour', group: 'Photobooth' },
  photobooth_backdrop: { label: 'Custom Backdrop', group: 'Photobooth' },
  '360booth_base': { label: 'Base Price (no tent)', group: '360 Booth' },
  '360booth_tent': { label: 'Base Price (with tent)', group: '360 Booth' },
  '360booth_extra_hour': { label: 'Extra Hour', group: '360 Booth' },
  both_base: { label: 'Base Price (3 hrs)', group: 'Full Package' },
  both_extra_hour: { label: 'Extra Hour', group: 'Full Package' },
  both_backdrop: { label: 'Custom Backdrop', group: 'Full Package' },
};

export default function PricingAdmin() {
  const [pricing, setPricing] = useState<PricingConfig>({
    photobooth_base: 800,
    photobooth_extra_hour: 150,
    photobooth_backdrop: 200,
    '360booth_base': 600,
    '360booth_tent': 750,
    '360booth_extra_hour': 150,
    both_base: 1300,
    both_extra_hour: 250,
    both_backdrop: 200,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/reservations/pricing')
      .then((res) => setPricing(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/reservations/admin/pricing', pricing);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Failed to save pricing.');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string) => {
    setPricing((prev) => ({ ...prev, [key]: parseInt(value) || 0 }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full" />
      </div>
    );
  }

  const groups = ['Photobooth', '360 Booth', 'Full Package'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pricing</h1>
          <p className="text-gray-500 text-sm mt-1">
            Set prices for each service. All prices are in USD.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-emerald-600 text-sm font-medium">Saved!</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white
                       rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Save Pricing'}
          </button>
        </div>
      </div>

      {groups.map((group) => {
        const keys = Object.entries(labels).filter(([, v]) => v.group === group);
        return (
          <div key={group} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <HiCurrencyDollar className="w-4 h-4 text-gray-500" />
                {group}
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {keys.map(([key, meta]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{meta.label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                    <input
                      type="number"
                      min="0"
                      value={(pricing as any)[key]}
                      onChange={(e) => update(key, e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
