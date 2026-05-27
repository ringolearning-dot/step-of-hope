import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import {
  HiChartBar,
  HiCurrencyDollar,
  HiPhoto,
  HiUsers,
  HiEnvelope,
  HiCog6Tooth,
  HiDocumentText,
  HiCalendarDays,
  HiReceiptPercent,
  HiBanknotes,
  HiClipboardDocumentList,
  HiSparkles,
  HiBell,
  HiShieldCheck,
  HiClock,
  HiUserGroup,
  HiTicket,
  HiFolderOpen,
} from 'react-icons/hi2';
import { HiBars3, HiXMark, HiArrowRightOnRectangle } from 'react-icons/hi2';

const navSections = [
  {
    title: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: HiChartBar, end: true },
      { to: '/admin/notifications', label: 'Notifications', icon: HiBell },
    ],
  },
  {
    title: 'Finance',
    items: [
      { to: '/admin/donations', label: 'Donations', icon: HiCurrencyDollar },
      { to: '/admin/expenses', label: 'Expenses', icon: HiReceiptPercent },
      { to: '/admin/recurring-bills', label: 'Recurring Bills', icon: HiBanknotes },
      { to: '/admin/reports', label: 'Reports', icon: HiClipboardDocumentList },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/admin/reservations', label: 'Reservations', icon: HiCalendarDays },
      { to: '/admin/promo-codes', label: 'Promo Codes', icon: HiTicket },
      { to: '/admin/pricing', label: 'Pricing', icon: HiCurrencyDollar },
      { to: '/admin/calendar', label: 'Calendar', icon: HiCalendarDays },
      { to: '/admin/volunteers', label: 'Volunteers', icon: HiUsers },
      { to: '/admin/contacts', label: 'Contacts', icon: HiEnvelope },
    ],
  },
  {
    title: 'Content',
    items: [
      { to: '/admin/content', label: 'Page Content', icon: HiDocumentText },
      { to: '/admin/images', label: 'Images', icon: HiPhoto },
      { to: '/admin/documents', label: 'Documents', icon: HiFolderOpen },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/admin/ai-assistant', label: 'AI Assistant', icon: HiSparkles },
      { to: '/admin/users', label: 'Admin Users', icon: HiUserGroup },
      { to: '/admin/activity-logs', label: 'Activity Logs', icon: HiClock },
      { to: '/admin/settings', label: 'Settings', icon: HiCog6Tooth },
    ],
  },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.get('/notifications/admin/unread-count')
      .then(res => setUnreadCount(res.data.count))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-white/10 text-white'
        : 'text-slate-300 hover:bg-white/5 hover:text-white'
    }`;

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SH</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm">Step of Hope</h1>
            <p className="text-slate-400 text-xs">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={linkClasses}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.label === 'Notifications' && unreadCount > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{unreadCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Admin Info */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{admin?.name || 'Admin'}</p>
            <p className="text-slate-400 text-xs truncate">{admin?.role === 'super_admin' ? 'Super Admin' : admin?.role || 'Admin'}</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-200 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#0f172a' }}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <HiXMark className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Sidebar - desktop */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-64 lg:flex-shrink-0 lg:fixed lg:inset-y-0"
        style={{ backgroundColor: '#0f172a' }}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-lg"
            >
              <HiBars3 className="w-5 h-5" />
            </button>

            <div className="hidden lg:block" />

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 hidden sm:block">
                {admin?.name || 'Admin'}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600
                           hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <HiArrowRightOnRectangle className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
