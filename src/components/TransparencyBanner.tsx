import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiCurrencyDollar, HiBanknotes, HiReceiptPercent } from 'react-icons/hi2';
import api from '../lib/api';

const fmt = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cents / 100);

function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    if (value === 0) return;
    const start = ref.current;
    const diff = value - start;
    const duration = 1500;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = value;
    }

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

export default function TransparencyBanner() {
  const [stats, setStats] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    api.get('/transparency/stats')
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  if (location.pathname.startsWith('/admin')) return null;
  if (!stats) return null;

  const items = [
    { icon: HiCurrencyDollar, label: 'Raised', value: fmt(stats.totalRaised), color: 'text-emerald-400' },
    { icon: HiReceiptPercent, label: 'Expenses', value: fmt(stats.totalExpenses), color: 'text-red-400' },
    { icon: HiBanknotes, label: 'Available', value: fmt(stats.availableFunds), color: 'text-blue-400' },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-navy/95 backdrop-blur-md text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-8">
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-hide text-[11px] sm:text-xs">
            {items.map((item) => (
              <div key={item.label} className="flex items-center gap-1 whitespace-nowrap">
                <item.icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${item.color} flex-shrink-0`} />
                <span className="text-white/60 hidden sm:inline">{item.label}:</span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
          <Link
            to="/transparency"
            className="text-[10px] sm:text-xs font-medium text-gold hover:text-gold-light transition-colors whitespace-nowrap ml-3 flex-shrink-0"
          >
            Full Report &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
